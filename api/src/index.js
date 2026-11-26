// Builds the Express app. Vercel's zero-config Express support uses this file (SPEC D-37):
// export the app, never call app.listen() here (local dev does that in dev.js).
require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const taskRoutes = require("./routes/tasks");
const { requireAuth } = require("./middleware/auth");

const app = express();

app.use(cors()); // mobile + web clients, no cookies (SPEC §7)
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ status: "ok" }));
app.use(authRoutes);
app.use("/courses", requireAuth, courseRoutes);
app.use("/tasks", requireAuth, taskRoutes);

// Unknown routes → JSON 404 (not Express's HTML page).
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request body too large" });
  console.error(err); // details stay in the server log
  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;
