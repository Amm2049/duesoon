// Prisma 7 config (SPEC D-34, D-39). The database URL lives here, not in schema.prisma.
require("dotenv").config({ quiet: true });
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  // Prisma CLI (db push, seed) must use Neon's DIRECT connection, not the pooled one.
  // process.env (not env()) so `prisma generate` on Vercel doesn't fail when the URL isn't set at build time.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED },
});
