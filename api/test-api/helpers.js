// Shared setup for API tests: start the real app on a random port, call it over HTTP, clean up.
const app = require("../src/index");
const prisma = require("../src/db");

async function startServer() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { body, token, raw } = {}) => {
    const headers = {};
    if (body !== undefined || raw !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(base + path, { method, headers, body: raw ?? (body && JSON.stringify(body)) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };

  return { server, call };
}

/** Deletes everything created by "apitest-*" users (done rows → tasks → users, FK order). */
async function cleanupTestData() {
  const testUsers = { email: { startsWith: "apitest-" } };
  await prisma.taskDone.deleteMany({ where: { user: testUsers } });
  await prisma.task.deleteMany({ where: { creator: testUsers } });
  await prisma.user.deleteMany({ where: testUsers });
}

async function stopServer(server) {
  await cleanupTestData();
  await prisma.$disconnect();
  server.close();
}

module.exports = { startServer, stopServer, cleanupTestData, prisma };
