// API tests: real HTTP requests to the app, against the real (Neon) database.
// Run with: npm run test:api   (needs api/.env). Creates users "apitest-*@duesoon.test" and deletes them.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { startServer, stopServer, prisma } = require("./helpers");

let server;
let call;
const email = `apitest-${Date.now()}@duesoon.test`;
const password = "secret123";

before(async () => {
  ({ server, call } = await startServer());
});

after(async () => {
  await stopServer(server);
});

test("GET / health check", async () => {
  assert.deepEqual(await call("GET", "/"), { status: 200, body: { status: "ok" } });
});

let token;

test("POST /register → 201 with token, no password hash in response", async () => {
  const res = await call("POST", "/register", { body: { name: " Api Tester ", email: email.toUpperCase(), password } });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, email); // lowercased
  assert.equal(res.body.user.name, "Api Tester"); // trimmed
  assert.deepEqual(Object.keys(res.body.user).sort(), ["email", "id", "name"]);
  assert.ok(res.body.token);
  token = res.body.token;
});

test("POST /register same email (different case) → 409", async () => {
  const res = await call("POST", "/register", { body: { name: "Again", email: ` ${email.toUpperCase()} `, password } });
  assert.deepEqual(res, { status: 409, body: { error: "Email already registered" } });
});

test("POST /register invalid input → 400 with message", async () => {
  const res = await call("POST", "/register", { body: { name: "X", email: "apitest-bad@duesoon.test", password: "123" } });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /at least 6/);
});

test("stored password is a bcrypt hash, not the password", async () => {
  const row = await prisma.user.findUnique({ where: { email } });
  assert.match(row.passwordHash, /^\$2[ab]\$10\$/);
  assert.notEqual(row.passwordHash, password);
});

test("POST /login correct (any email case) → 200 + token for the same user", async () => {
  const res = await call("POST", "/login", { body: { email: email.toUpperCase(), password } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, email);
  assert.equal(jwt.decode(res.body.token).id, res.body.user.id);
});

test("POST /login wrong password and unknown email → same 401 message", async () => {
  const wrongPw = await call("POST", "/login", { body: { email, password: "nope-nope" } });
  const unknown = await call("POST", "/login", { body: { email: "apitest-nobody@duesoon.test", password } });
  assert.deepEqual(wrongPw, { status: 401, body: { error: "Invalid email or password" } });
  assert.deepEqual(unknown, wrongPw);
});

test("POST /login missing fields → 400", async () => {
  assert.equal((await call("POST", "/login", { body: { email } })).status, 400);
});

test("GET /me: valid token → 200 with the token's user", async () => {
  const res = await call("GET", "/me", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, "Api Tester");
});

test("GET /me: no token / garbage / forged / expired → 401", async () => {
  const forged = jwt.sign({ id: 1, name: "Mai" }, "attacker-secret-attacker-secret-1234");
  const expired = jwt.sign({ id: 1, name: "Mai" }, process.env.JWT_SECRET, { expiresIn: -10 });
  assert.deepEqual(await call("GET", "/me"), { status: 401, body: { error: "Not logged in" } });
  assert.deepEqual(await call("GET", "/me", { token: "garbage" }), { status: 401, body: { error: "Invalid token" } });
  assert.deepEqual(await call("GET", "/me", { token: forged }), { status: 401, body: { error: "Invalid token" } });
  assert.deepEqual(await call("GET", "/me", { token: expired }), {
    status: 401, body: { error: "Session expired, please log in again" },
  });
});

test("broken JSON body → 400, unknown route → JSON 404", async () => {
  assert.deepEqual(await call("POST", "/login", { raw: "{not json" }), { status: 400, body: { error: "Invalid JSON body" } });
  assert.deepEqual(await call("GET", "/nope"), { status: 404, body: { error: "Not found" } });
});
