// POST /register, POST /login, GET /me (SPEC §4.2).
const express = require("express");
const bcrypt = require("bcryptjs");
const { validateRegister, validateLogin } = require("../lib/validate");
const { signToken } = require("../lib/token");
const { requireAuth } = require("../middleware/auth");
const users = require("../repos/users");

const router = express.Router();
const BCRYPT_COST = 10;
// Compared against when the email doesn't exist, so "unknown email" and "wrong password"
// take about the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync("duesoon-timing-equalizer", BCRYPT_COST);

router.post("/register", async (req, res) => {
  const { error, value } = validateRegister(req.body);
  if (error) return res.status(400).json({ error });

  const passwordHash = await bcrypt.hash(value.password, BCRYPT_COST);
  const user = await users.createUser({ name: value.name, email: value.email, passwordHash });
  if (!user) return res.status(409).json({ error: "Email already registered" });

  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const { error, value } = validateLogin(req.body);
  if (error) return res.status(400).json({ error });

  const row = await users.findByEmailForLogin(value.email);
  const passwordOk = await bcrypt.compare(value.password, row ? row.passwordHash : DUMMY_HASH);
  if (!row || !passwordOk) return res.status(401).json({ error: "Invalid email or password" });

  const user = users.toUserJson(row);
  res.json({ token: signToken(user), user });
});

// Lets the app (and tests) check a token; returns who the token belongs to.
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
