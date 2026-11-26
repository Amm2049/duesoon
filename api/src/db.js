// One shared Prisma client (SPEC §3, D-34, D-39). Only src/repos/ and scripts should import this.
require("dotenv").config({ quiet: true }); // local dev; on Vercel env vars are injected
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (copy api/.env.example to api/.env and fill it in)");
}

// App traffic uses Neon's POOLED connection string (hostname contains "-pooler").
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: process.env.PRISMA_LOG ? ["query"] : [],
});

module.exports = prisma;
