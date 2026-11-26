// API tests for /courses and /tasks (SPEC §4.2–4.5, §9). Real HTTP + real Neon database.
// Two throwaway users: A (creates tasks) and B (another classmate). Seeded data is never modified.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, stopServer, prisma } = require("./helpers");
const { todayBangkok, addDays } = require("../src/lib/dates");

let server;
let call;
let A; // { token, user }
let B;
let courseId;
const today = todayBangkok();
const stamp = Date.now();

const register = async (who) => {
  const res = await call("POST", "/register", {
    body: { name: `Tester ${who}`, email: `apitest-${who}-${stamp}@duesoon.test`, password: "secret123" },
  });
  assert.equal(res.status, 201);
  return res.body;
};

const newTask = (over = {}) => ({
  title: "apitest task", course_id: courseId, type: "assignment", due_date: addDays(today, 1), ...over,
});

const ids = (list) => list.map((t) => t.id);

before(async () => {
  ({ server, call } = await startServer());
  A = await register("a");
  B = await register("b");
});

after(async () => {
  await stopServer(server);
});

// ---------- courses ----------
test("GET /courses: needs login; returns CSC452", async () => {
  assert.equal((await call("GET", "/courses")).status, 401);
  const res = await call("GET", "/courses", { token: A.token });
  assert.equal(res.status, 200);
  const csc = res.body.find((c) => c.code === "CSC452");
  assert.deepEqual(Object.keys(csc).sort(), ["code", "id", "name"]);
  courseId = csc.id;
});

// ---------- create ----------
let t1;
test("POST /tasks → 201 with full detail; creator comes from the token, not the body", async () => {
  const res = await call("POST", "/tasks", {
    token: A.token,
    body: newTask({ title: "  apitest Lab  ", description: "  notes ", created_by: B.user.id }),
  });
  assert.equal(res.status, 201);
  t1 = res.body;
  assert.equal(t1.title, "apitest Lab");
  assert.equal(t1.description, "notes");
  assert.equal(t1.created_by, A.user.id); // body's created_by was ignored (D-06)
  assert.equal(t1.creator_name, "Tester a");
  assert.equal(t1.is_owner, true);
  assert.equal(t1.done, false);
  assert.equal(t1.done_count, 0);
  assert.equal(t1.course_code, "CSC452");
  assert.equal(t1.due_date, addDays(today, 1));
  assert.equal(t1.days_left, 1);
});

test("POST /tasks invalid → 400 (past date, unknown course, bad type, no token → 401)", async () => {
  const past = await call("POST", "/tasks", { token: A.token, body: newTask({ due_date: addDays(today, -1) }) });
  assert.deepEqual(past, { status: 400, body: { error: "Due date cannot be in the past" } });
  const noCourse = await call("POST", "/tasks", { token: A.token, body: newTask({ course_id: 999999 }) });
  assert.deepEqual(noCourse, { status: 400, body: { error: "Course not found" } });
  assert.equal((await call("POST", "/tasks", { token: A.token, body: newTask({ type: "homework" }) })).status, 400);
  assert.equal((await call("POST", "/tasks", { body: newTask() })).status, 401);
});

test("POST /tasks due today is allowed (boundary)", async () => {
  const res = await call("POST", "/tasks", { token: A.token, body: newTask({ due_date: today }) });
  assert.equal(res.status, 201);
  assert.equal(res.body.days_left, 0);
});

// ---------- filters ----------
let t7, t8, tOver;
test("week filter: today+7 in, today+8 out, overdue in (D-11)", async () => {
  t7 = (await call("POST", "/tasks", { token: A.token, body: newTask({ title: "apitest +7", due_date: addDays(today, 7) }) })).body;
  t8 = (await call("POST", "/tasks", { token: A.token, body: newTask({ title: "apitest +8", due_date: addDays(today, 8) }) })).body;
  // Overdue: create in the future, then edit into the past (edit allows past dates, D-19).
  tOver = (await call("POST", "/tasks", { token: A.token, body: newTask({ title: "apitest overdue" }) })).body;
  const edit = await call("PUT", `/tasks/${tOver.id}`, { token: A.token, body: newTask({ title: "apitest overdue", due_date: addDays(today, -3) }) });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.days_left, -3);

  const week = (await call("GET", "/tasks?filter=week", { token: A.token })).body;
  assert.ok(ids(week).includes(t7.id), "today+7 should be in This Week");
  assert.ok(!ids(week).includes(t8.id), "today+8 should NOT be in This Week");
  assert.ok(ids(week).includes(tOver.id), "overdue should be in This Week");

  const all = (await call("GET", "/tasks?filter=all", { token: A.token })).body;
  for (const t of [t7, t8, tOver]) assert.ok(ids(all).includes(t.id));
  // sorted by due date
  const dates = all.map((t) => t.due_date);
  assert.deepEqual(dates, [...dates].sort());
  // every date is a plain "YYYY-MM-DD" string
  for (const t of all) assert.match(t.due_date, /^\d{4}-\d{2}-\d{2}$/);
});

test("GET /tasks: default filter is all; bad filter → 400", async () => {
  const def = (await call("GET", "/tasks", { token: A.token })).body;
  const all = (await call("GET", "/tasks?filter=all", { token: A.token })).body;
  assert.deepEqual(ids(def), ids(all));
  assert.deepEqual(await call("GET", "/tasks?filter=soon", { token: A.token }), {
    status: 400, body: { error: "filter must be week, all or done" },
  });
});

// ---------- done toggle ----------
test("done is per user, idempotent, and leaves This Week (D-16)", async () => {
  const first = await call("POST", `/tasks/${t7.id}/done`, { token: A.token });
  assert.deepEqual(first, { status: 200, body: { done: true, done_count: 1 } });
  const again = await call("POST", `/tasks/${t7.id}/done`, { token: A.token });
  assert.deepEqual(again.body, { done: true, done_count: 1 }); // still one row
  assert.equal(await prisma.taskDone.count({ where: { taskId: t7.id } }), 1);

  const aWeek = (await call("GET", "/tasks?filter=week", { token: A.token })).body;
  assert.ok(!ids(aWeek).includes(t7.id), "A finished it → gone from A's This Week");

  const bView = (await call("GET", `/tasks/${t7.id}`, { token: B.token })).body;
  assert.equal(bView.done, false, "B has not finished it");
  assert.equal(bView.done_count, 1, "but B sees 1 classmate finished");
  assert.equal(bView.is_owner, false);
  const bWeek = (await call("GET", "/tasks?filter=week", { token: B.token })).body;
  assert.ok(ids(bWeek).includes(t7.id), "still in B's This Week");
});

test("done tab: only my finished tasks, most recently finished first", async () => {
  await call("POST", `/tasks/${t8.id}/done`, { token: A.token });
  await new Promise((r) => setTimeout(r, 20));
  await call("POST", `/tasks/${tOver.id}/done`, { token: A.token });
  const done = (await call("GET", "/tasks?filter=done", { token: A.token })).body;
  const mine = ids(done).filter((id) => [t7.id, t8.id, tOver.id].includes(id));
  assert.deepEqual(mine, [tOver.id, t8.id, t7.id]);
  assert.ok(done.every((t) => t.done === true));
  const bDone = (await call("GET", "/tasks?filter=done", { token: B.token })).body;
  assert.ok(!ids(bDone).includes(t7.id));
});

test("undo done → done false, count drops; undoing twice is fine", async () => {
  assert.deepEqual((await call("DELETE", `/tasks/${t7.id}/done`, { token: A.token })).body, { done: false, done_count: 0 });
  assert.deepEqual((await call("DELETE", `/tasks/${t7.id}/done`, { token: A.token })).body, { done: false, done_count: 0 });
});

test("editing a task keeps done status (D-18)", async () => {
  const res = await call("PUT", `/tasks/${t8.id}`, { token: A.token, body: newTask({ title: "apitest +8 renamed", due_date: addDays(today, 9) }) });
  assert.equal(res.status, 200);
  assert.equal(res.body.title, "apitest +8 renamed");
  assert.equal(res.body.done, true);
});

// ---------- ownership & not found ----------
test("B cannot edit or delete A's task → 403; nothing changes", async () => {
  const put = await call("PUT", `/tasks/${t1.id}`, { token: B.token, body: newTask({ title: "hacked" }) });
  assert.equal(put.status, 403);
  const del = await call("DELETE", `/tasks/${t1.id}`, { token: B.token });
  assert.equal(del.status, 403);
  assert.equal((await call("GET", `/tasks/${t1.id}`, { token: A.token })).body.title, "apitest Lab");
});

test("403 comes before validation (no hints for non-owners)", async () => {
  const res = await call("PUT", `/tasks/${t1.id}`, { token: B.token, body: {} });
  assert.equal(res.status, 403);
});

test("missing or malformed ids → 404", async () => {
  for (const [method, path] of [
    ["GET", "/tasks/999999999"], ["PUT", "/tasks/999999999"], ["DELETE", "/tasks/999999999"],
    ["POST", "/tasks/999999999/done"], ["DELETE", "/tasks/999999999/done"],
    ["GET", "/tasks/abc"], ["GET", "/tasks/0"], ["GET", "/tasks/-1"],
  ]) {
    const res = await call(method, path, { token: A.token, body: method === "PUT" ? newTask() : undefined });
    assert.equal(res.status, 404, `${method} ${path}`);
  }
});

// ---------- delete ----------
test("DELETE own task → 204; its done rows are removed (cascade, D-17)", async () => {
  await call("POST", `/tasks/${t8.id}/done`, { token: B.token });
  assert.equal(await prisma.taskDone.count({ where: { taskId: t8.id } }), 2); // A + B
  const del = await call("DELETE", `/tasks/${t8.id}`, { token: A.token });
  assert.deepEqual(del, { status: 204, body: null });
  assert.equal(await prisma.taskDone.count({ where: { taskId: t8.id } }), 0);
  assert.equal((await call("GET", `/tasks/${t8.id}`, { token: A.token })).status, 404);
});
