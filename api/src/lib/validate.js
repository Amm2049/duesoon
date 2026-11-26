// Input validation (SPEC §4.4). The server is the rule; the Flutter app mirrors these checks.
// Each validator returns { error } (first problem found) or { value } (cleaned input).
const { isDateStr, addDays } = require("./dates");

const TASK_TYPES = ["assignment", "exam", "quiz"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (error) => ({ error });
const ok = (value) => ({ value });
const trimmed = (v) => (typeof v === "string" ? v.trim() : "");

function validateRegister(body) {
  const b = body ?? {};
  const name = trimmed(b.name);
  const email = trimmed(b.email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : ""; // not trimmed: spaces are allowed

  if (!name) return fail("Name is required");
  if (name.length > 50) return fail("Name must be at most 50 characters");
  if (!email) return fail("Email is required");
  if (email.length > 100 || !EMAIL_RE.test(email)) return fail("Email is not valid");
  if (password.length < 6) return fail("Password must be at least 6 characters");
  // bcrypt only uses the first 72 BYTES; Thai characters are 3 bytes each in UTF-8.
  if (Buffer.byteLength(password, "utf8") > 72) return fail("Password is too long");
  return ok({ name, email, password });
}

function validateLogin(body) {
  const b = body ?? {};
  const email = trimmed(b.email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  // No length rules here: they would hint at what valid accounts look like.
  if (!email || !password) return fail("Email and password are required");
  return ok({ email, password });
}

/**
 * Task create/edit (D-19). `today` is todayBangkok(); course existence is checked by the caller.
 * Returns camelCase fields ready for Prisma (dueDate stays a "YYYY-MM-DD" string).
 */
function validateTask(body, { today, isCreate }) {
  const b = body ?? {};
  const title = trimmed(b.title);
  if (!title) return fail("Title is required");
  if (title.length > 100) return fail("Title must be at most 100 characters");

  if (!Number.isInteger(b.course_id) || b.course_id <= 0) return fail("Course is required");

  if (!TASK_TYPES.includes(b.type)) return fail("Type must be assignment, exam or quiz");

  if (!isDateStr(b.due_date)) return fail("Due date must be a real date (YYYY-MM-DD)");
  // "YYYY-MM-DD" strings compare correctly as plain strings.
  if (isCreate && b.due_date < today) return fail("Due date cannot be in the past");
  if (b.due_date > addDays(today, 365)) return fail("Due date must be within one year");

  let description = null;
  if (b.description !== undefined && b.description !== null) {
    if (typeof b.description !== "string") return fail("Description must be text");
    description = b.description.trim() || null;
    if (description && description.length > 1000) return fail("Description must be at most 1000 characters");
  }

  return ok({ title, courseId: b.course_id, type: b.type, dueDate: b.due_date, description });
}

/** Route param ":id" → positive integer, or null (caller answers 404). */
function parseId(param) {
  if (typeof param !== "string" || !/^[1-9]\d{0,9}$/.test(param)) return null;
  const n = Number(param);
  return n <= 2147483647 ? n : null; // Postgres INT max
}

module.exports = { validateRegister, validateLogin, validateTask, parseId, TASK_TYPES };
