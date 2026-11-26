// /tasks routes (SPEC §4.2–4.5). Mounted behind requireAuth in index.js.
// The current user is ALWAYS req.user.id (from the token), never from the body or query (D-06).
const express = require("express");
const tasks = require("../repos/tasks");
const { courseExists } = require("../repos/courses");
const { validateTask, parseId } = require("../lib/validate");
const { todayBangkok } = require("../lib/dates");

const router = express.Router();

const notFound = (res) => res.status(404).json({ error: "Task not found" });

/** Parse :id or answer 404. */
function taskId(req, res) {
  const id = parseId(req.params.id);
  if (id === null) notFound(res);
  return id;
}

/** 404 if missing, then 403 if not the creator (D-15). Returns true when the caller may continue. */
async function checkOwner(id, req, res) {
  const owner = await tasks.findTaskOwner(id);
  if (!owner) {
    notFound(res);
    return false;
  }
  if (owner.createdBy !== req.user.id) {
    res.status(403).json({ error: "Only the person who added this task can change it" });
    return false;
  }
  return true;
}

// GET /tasks?filter=week|all|done
router.get("/", async (req, res) => {
  const filter = req.query.filter ?? "all";
  if (!tasks.FILTERS.includes(filter)) {
    return res.status(400).json({ error: "filter must be week, all or done" });
  }
  res.json(await tasks.listTasks({ me: req.user.id, today: todayBangkok(), filter }));
});

// GET /tasks/:id
router.get("/:id", async (req, res) => {
  const id = taskId(req, res);
  if (id === null) return;
  const task = await tasks.getTaskDetail(id, { me: req.user.id, today: todayBangkok() });
  if (!task) return notFound(res);
  res.json(task);
});

// POST /tasks
router.post("/", async (req, res) => {
  const today = todayBangkok();
  const { error, value } = validateTask(req.body, { today, isCreate: true });
  if (error) return res.status(400).json({ error });
  if (!(await courseExists(value.courseId))) return res.status(400).json({ error: "Course not found" });

  const id = await tasks.createTask(value, req.user.id);
  res.status(201).json(await tasks.getTaskDetail(id, { me: req.user.id, today }));
});

// PUT /tasks/:id (creator only)
router.put("/:id", async (req, res) => {
  const id = taskId(req, res);
  if (id === null) return;
  if (!(await checkOwner(id, req, res))) return;

  const today = todayBangkok();
  const { error, value } = validateTask(req.body, { today, isCreate: false });
  if (error) return res.status(400).json({ error });
  if (!(await courseExists(value.courseId))) return res.status(400).json({ error: "Course not found" });

  if (!(await tasks.updateTask(id, value))) return notFound(res);
  res.json(await tasks.getTaskDetail(id, { me: req.user.id, today }));
});

// DELETE /tasks/:id (creator only)
router.delete("/:id", async (req, res) => {
  const id = taskId(req, res);
  if (id === null) return;
  if (!(await checkOwner(id, req, res))) return;

  if (!(await tasks.deleteTask(id))) return notFound(res);
  res.status(204).end();
});

// POST /tasks/:id/done (any user, only for themselves)
router.post("/:id/done", async (req, res) => {
  const id = taskId(req, res);
  if (id === null) return;
  if (!(await tasks.markDone(req.user.id, id))) return notFound(res);
  res.json({ done: true, done_count: await tasks.countDone(id) });
});

// DELETE /tasks/:id/done
router.delete("/:id/done", async (req, res) => {
  const id = taskId(req, res);
  if (id === null) return;
  if (!(await tasks.findTaskOwner(id))) return notFound(res);
  await tasks.unmarkDone(req.user.id, id);
  res.json({ done: false, done_count: await tasks.countDone(id) });
});

module.exports = router;
