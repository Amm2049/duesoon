const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateRegister, validateLogin, validateTask, parseId } = require("../src/lib/validate");

// ---------- register ----------
const reg = (over) => validateRegister({ name: "Mai", email: "mai@x.com", password: "secret1", ...over });

test("register: valid input is cleaned (trim, lowercase email)", () => {
  const { value, error } = validateRegister({ name: "  Mai ", email: "  MAI@X.Com ", password: " pass word " });
  assert.equal(error, undefined);
  assert.deepEqual(value, { name: "Mai", email: "mai@x.com", password: " pass word " });
});

test("register: name boundaries (empty, 50 ok, 51 too long)", () => {
  assert.ok(reg({ name: "   " }).error);
  assert.ok(reg({ name: "a".repeat(50) }).value);
  assert.ok(reg({ name: "a".repeat(51) }).error);
});

test("register: email must look like an email", () => {
  for (const bad of ["", "mai", "mai@", "mai@x", "@x.com", "m ai@x.com"]) {
    assert.ok(reg({ email: bad }).error, `should reject "${bad}"`);
  }
  assert.ok(reg({ email: "a".repeat(94) + "@x.com" }).value); // exactly 100 chars → ok
  assert.ok(reg({ email: "a".repeat(95) + "@x.com" }).error); // 101 chars → too long
});

test("register: password boundaries (5 no, 6 yes, 72 bytes yes, 73 no)", () => {
  assert.ok(reg({ password: "12345" }).error);
  assert.ok(reg({ password: "123456" }).value);
  assert.ok(reg({ password: "a".repeat(72) }).value);
  assert.ok(reg({ password: "a".repeat(73) }).error);
  // 25 Thai characters = 75 bytes → too long even though only 25 "characters"
  assert.ok(reg({ password: "ก".repeat(25) }).error);
  assert.ok(reg({ password: "ก".repeat(24) }).value); // 72 bytes
});

test("register: missing body or wrong types don't crash", () => {
  assert.ok(validateRegister(undefined).error);
  assert.ok(validateRegister({ name: 5, email: [], password: {} }).error);
});

// ---------- login ----------
test("login: needs both fields, email normalised", () => {
  assert.ok(validateLogin({ email: "a@b.co" }).error);
  assert.ok(validateLogin({ password: "x" }).error);
  assert.ok(validateLogin(null).error);
  assert.deepEqual(validateLogin({ email: " A@B.CO ", password: "x" }).value, { email: "a@b.co", password: "x" });
});

// ---------- task ----------
const today = "2026-11-26";
const task = (over, opts = { today, isCreate: true }) =>
  validateTask({ title: "Lab 6", course_id: 1, type: "assignment", due_date: "2026-11-28", ...over }, opts);

test("task: valid input returns camelCase fields", () => {
  assert.deepEqual(task({ description: "  notes  " }).value, {
    title: "Lab 6", courseId: 1, type: "assignment", dueDate: "2026-11-28", description: "notes",
  });
});

test("task: title boundaries", () => {
  assert.ok(task({ title: "  " }).error);
  assert.ok(task({ title: "a".repeat(100) }).value);
  assert.ok(task({ title: "a".repeat(101) }).error);
});

test("task: course_id must be a positive integer", () => {
  for (const bad of [undefined, 0, -1, 1.5, "1", null]) assert.ok(task({ course_id: bad }).error, String(bad));
});

test("task: type must be one of the three", () => {
  assert.ok(task({ type: "homework" }).error);
  assert.ok(task({ type: "quiz" }).value);
});

test("task: due date on CREATE (today ok, yesterday no)", () => {
  assert.ok(task({ due_date: "2026-11-26" }).value);
  assert.ok(task({ due_date: "2026-11-25" }).error);
});

test("task: due date on EDIT may be in the past (D-19)", () => {
  assert.ok(task({ due_date: "2026-11-01" }, { today, isCreate: false }).value);
});

test("task: due date max today + 365, and must be a real date", () => {
  assert.ok(task({ due_date: "2027-11-26" }).value); // +365
  assert.ok(task({ due_date: "2027-11-27" }).error); // +366
  assert.ok(task({ due_date: "2026-02-30" }).error);
  assert.ok(task({ due_date: "28/11/2026" }).error);
});

test("task: description optional, empty → null, max 1000", () => {
  assert.equal(task({}).value.description, null);
  assert.equal(task({ description: "   " }).value.description, null);
  assert.equal(task({ description: null }).value.description, null);
  assert.ok(task({ description: "a".repeat(1000) }).value);
  assert.ok(task({ description: "a".repeat(1001) }).error);
  assert.ok(task({ description: 42 }).error);
});

// ---------- :id ----------
test("parseId: only positive integers within INT range", () => {
  assert.equal(parseId("7"), 7);
  for (const bad of ["0", "-1", "1.5", "abc", "07", "", "2147483648", undefined]) {
    assert.equal(parseId(bad), null, String(bad));
  }
});
