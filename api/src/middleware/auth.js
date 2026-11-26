// Requires "Authorization: Bearer <token>". Sets req.user = { id, name } (SPEC D-06).
// The user id must ONLY ever come from here, never from the body or query.
const { verifyToken } = require("../lib/token");

function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.get("authorization") || "");
  if (!match) return res.status(401).json({ error: "Not logged in" });

  try {
    req.user = verifyToken(match[1]);
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired, please log in again" });
    }
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return next(err); // e.g. JWT_SECRET missing → 500
  }
}

module.exports = { requireAuth };
