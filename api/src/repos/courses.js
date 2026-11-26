// All Prisma calls for courses (SPEC D-30).
const prisma = require("../db");

function listCourses() {
  return prisma.course.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } });
}

async function courseExists(id) {
  return (await prisma.course.count({ where: { id } })) > 0;
}

module.exports = { listCourses, courseExists };
