// JWT helpers (SPEC D-06, §4.1). Payload { id, name }, 7-day expiry, HS256 only.
const jwt = require("jsonwebtoken");

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be set (at least 32 characters)");
  return s;
}

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name }, secret(), { algorithm: "HS256", expiresIn: "7d" });
}

/** Returns { id, name } or throws (TokenExpiredError / JsonWebTokenError). */
function verifyToken(token) {
  // Pinning the algorithm blocks "alg: none" and algorithm-swap tricks.
  const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
  if (!Number.isInteger(payload.id)) throw new jwt.JsonWebTokenError("Invalid payload");
  return { id: payload.id, name: payload.name };
}

module.exports = { signToken, verifyToken };
