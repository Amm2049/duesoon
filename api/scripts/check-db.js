// Step 1 verification (PLAN Step 1): runs the two key queries from SPEC §3.1.
// Run with: npm run db:check            (add PRISMA_LOG=1 to print the generated SQL for slides)
const prisma = require("../src/db");
const { todayBangkok, toDateStr, daysBetween } = require("../src/lib/dates");

async function main() {
  const today = todayBangkok();
  const me = await prisma.user.findUnique({ where: { email: "mai@duesoon.test" } });
  if (!me) throw new Error("Seed user mai@duesoon.test not found. Run: npx prisma db seed");

  // 1) Task list with MY done flag (Prisma generates a LEFT JOIN on task_done filtered by me)
  const tasks = await prisma.task.findMany({
    include: { course: true, done: { where: { userId: me.id } } },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
  });

  console.log(`\nToday (Bangkok): ${today} · tasks as seen by ${me.name} (user ${me.id})`);
  console.table(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      due_date: toDateStr(t.dueDate),
      days_left: daysBetween(today, toDateStr(t.dueDate)),
      done: t.done.length > 0,
    }))
  );

  // 2) Done count per task (COUNT on task_done)
  const counts = await prisma.task.findMany({
    select: { id: true, title: true, _count: { select: { done: true } } },
    orderBy: { id: "asc" },
  });
  console.log("Done counts (should include 3, 1, 1 and zeros):");
  console.table(counts.map((c) => ({ id: c.id, title: c.title, done_count: c._count.done })));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
