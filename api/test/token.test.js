const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

before(() => {
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

const { signToken, verifyToken } = require("../src/lib/token");

test("sign + verify round-trip keeps id and name only", () => {
  const token = signToken({ id: 3, name: "Ton", email: "ton@x.com" });
  assert.deepEqual(verifyToken(token), { id: 3, name: "Ton" });
  assert.equal(jwt.decode(token).email, undefined); // no extra data in the token
});

test("token expires in 7 days", () => {
  const { iat, exp } = jwt.decode(signToken({ id: 1, name: "Mai" }));
  assert.equal(exp - iat, 7 * 24 * 60 * 60);
});

test("expired token is rejected as TokenExpiredError", () => {
  const expired = jwt.sign({ id: 1, name: "Mai" }, process.env.JWT_SECRET, { expiresIn: -10 });
  assert.throws(() => verifyToken(expired), { name: "TokenExpiredError" });
});

test("token signed with another secret is rejected", () => {
  const forged = jwt.sign({ id: 1, name: "Mai" }, "some-other-secret-some-other-secret!!");
  assert.throws(() => verifyToken(forged), { name: "JsonWebTokenError" });
});

test('"alg: none" token is rejected', () => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ id: 1, name: "Mai" })).toString("base64url");
  assert.throws(() => verifyToken(`${header}.${body}.`), { name: "JsonWebTokenError" });
});

test("token without an integer id is rejected", () => {
  const bad = jwt.sign({ id: "1", name: "Mai" }, process.env.JWT_SECRET);
  assert.throws(() => verifyToken(bad), { name: "JsonWebTokenError" });
});

test("missing/short JWT_SECRET fails loudly", () => {
  const saved = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "short";
  try {
    assert.throws(() => signToken({ id: 1, name: "Mai" }), /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = saved;
  }
});
