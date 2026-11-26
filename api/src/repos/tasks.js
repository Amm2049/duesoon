// All Prisma calls for tasks and task_done (SPEC §3.1, §4.3, D-16, D-17).
// Prisma uses camelCase + Date objects; the API's JSON uses snake_case + "YYYY-MM-DD" strings.
const prisma = require("../db");
const { toDateStr, fromDateStr, addDays, daysBetween } = require("../lib/dates");

// ---------- JSON shapes (SPEC §4.2) ----------
function toTaskListItem(t, today) {
  const dueDate = toDateStr(t.dueDate);
  return {
    id: t.id,
    title: t.title,
    type: t.type,
    due_date: dueDate,
    course_id: t.courseId,
    course_code: t.course.code,
    course_name: t.course.name,
    done: t.done.length > 0, // `done` was loaded filtered to the current user only
    days_left: daysBetween(today, dueDate),
  };
}

function toTaskDetail(t, today, me) {
  return {
    ...toTaskListItem(t, today),
    description: t.description,
    created_by: t.createdBy,
    creator_name: t.creator.name,
    is_owner: t.createdBy === me,
    done_count: t._count.done,
  };
}

// ---------- reads ----------
const FILTERS = ["week", "all", "done"];

/** Task list for user `me` (SPEC §4.3). */
async function listTasks({ me, today, filter }) {
  let where = {};
  if (filter === "week") {
    // Not done by me AND due on or before today + 7 (includes every overdue task).
    where = { dueDate: { lte: fromDateStr(addDays(today, 7)) }, done: { none: { userId: me } } };
  } else if (filter === "done") {
    where = { done: { some: { userId: me } } };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { course: true, done: { where: { userId: me } } },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
  });

  if (filter === "done") {
    // Most recently finished first (Prisma can't order by a filtered relation's field).
    tasks.sort((a, b) => b.done[0].doneAt - a.done[0].doneAt || b.id - a.id);
  }
  return tasks.map((t) => toTaskListItem(t, today));
}

/** Full detail, or null if the task doesn't exist. */
async function getTaskDetail(id, { me, today }) {
  const t = await prisma.task.findUnique({
    where: { id },
    include: {
      course: true,
      creator: { select: { name: true } },
      done: { where: { userId: me } },
      _count: { select: { done: true } }, // → LEFT JOIN … COUNT(*) GROUP BY
    },
  });
  return t ? toTaskDetail(t, today, me) : null;
}

/** { createdBy } or null; used for the 404-then-403 check (D-15). */
function findTaskOwner(id) {
  return prisma.task.findUnique({ where: { id }, select: { createdBy: true } });
}

function countDone(taskId) {
  return prisma.taskDone.count({ where: { taskId } });
}

// ---------- writes ----------
// `data` comes from validateTask(): { title, courseId, type, dueDate: "YYYY-MM-DD", description }
const toPrismaData = (data) => ({ ...data, dueDate: fromDateStr(data.dueDate) });

async function createTask(data, me) {
  const t = await prisma.task.create({ data: { ...toPrismaData(data), createdBy: me } });
  return t.id;
}

/** Returns false if the task vanished in the meantime. Done rows are kept (D-18). */
async function updateTask(id, data) {
  try {
    await prisma.task.update({ where: { id }, data: toPrismaData(data) });
    return true;
  } catch (err) {
    if (err.code === "P2025") return false; // record not found
    throw err;
  }
}

/** Returns false if already gone. task_done rows are removed by ON DELETE CASCADE (D-17). */
async function deleteTask(id) {
  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err.code === "P2025") return false;
    throw err;
  }
}

/** Idempotent (D-16). Returns false if the task doesn't exist. */
async function markDone(me, taskId) {
  try {
    await prisma.taskDone.upsert({
      where: { userId_taskId: { userId: me, taskId } },
      create: { userId: me, taskId },
      update: {}, // already done: keep the original done_at
    });
    return true;
  } catch (err) {
    if (err.code === "P2003") return false; // foreign key: task (or user) doesn't exist
    throw err;
  }
}

/** Idempotent: undoing something not done is fine. */
async function unmarkDone(me, taskId) {
  await prisma.taskDone.deleteMany({ where: { userId: me, taskId } });
}

module.exports = {
  FILTERS,
  listTasks,
  getTaskDetail,
  findTaskOwner,
  countDone,
  createTask,
  updateTask,
  deleteTask,
  markDone,
  unmarkDone,
};
