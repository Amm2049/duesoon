// Demo data (SPEC §3.2, D-21, D-27). Re-runnable: wipes everything first.
// Run with: npx prisma db seed
const bcrypt = require("bcryptjs");
const prisma = require("../src/db");
const { todayBangkok, addDays, fromDateStr } = require("../src/lib/dates");

const DEMO_PASSWORD = "demo1234";

const USERS = [
  { name: "Mai", email: "mai@duesoon.test" },
  { name: "Ploy", email: "ploy@duesoon.test" },
  { name: "Ton", email: "ton@duesoon.test" },
  { name: "Beam", email: "beam@duesoon.test" },
];

// offset = days from today (Bangkok). Fills every group: Overdue / Today / Tomorrow / This week / Later.
// by = index in USERS of the creator; doneBy = indexes of users who finished it.
const TASKS = [
  { offset: -2, type: "assignment", title: "Lab 5: Forms & Validation", by: 0, doneBy: [0, 1, 2],
    description: "TextFormField validators + SnackBar on submit. Upload zip to LMS." },
  { offset: -1, type: "quiz", title: "Quiz 2: Layouts", by: 1, doneBy: [1],
    description: "Online quiz on LMS, 20 minutes." },
  { offset: 0, type: "quiz", title: "Quiz 3: HTTP & JSON", by: 2, doneBy: [],
    description: "Covers async/await, http.get, fromJson." },
  { offset: 1, type: "assignment", title: "Lab 6: Full CRUD", by: 0, doneBy: [],
    description: "Create/update/delete screens calling your own API." },
  { offset: 2, type: "assignment", title: "Lab 7: Tabs & Navigation", by: 3, doneBy: [3],
    description: "DefaultTabController + passing id to a detail page." },
  { offset: 5, type: "exam", title: "Midterm Exam", by: 1, doneBy: [],
    description: "Closed book. Check room on LMS." },
  { offset: 7, type: "assignment", title: "Project proposal", by: 2, doneBy: [],
    description: "One page: app idea, screens, database tables." },
  { offset: 9, type: "quiz", title: "Quiz 4: StatefulWidget", by: 0, doneBy: [] },
  { offset: 14, type: "assignment", title: "Final project demo", by: 3, doneBy: [],
    description: "5-minute live demo + slides." },
  { offset: 20, type: "exam", title: "Final Exam", by: 1, doneBy: [],
    description: "Covers everything after the midterm." },
];

async function main() {
  const today = todayBangkok();

  // Child tables first (foreign keys).
  await prisma.taskDone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.course.deleteMany();

  const course = await prisma.course.create({
    data: { code: "CSC452", name: "Mobile Programming" },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];
  for (const u of USERS) {
    users.push(await prisma.user.create({ data: { ...u, passwordHash } }));
  }

  for (const t of TASKS) {
    const task = await prisma.task.create({
      data: {
        courseId: course.id,
        title: t.title,
        type: t.type,
        dueDate: fromDateStr(addDays(today, t.offset)),
        description: t.description ?? null,
        createdBy: users[t.by].id,
      },
    });
    for (const i of t.doneBy) {
      await prisma.taskDone.create({ data: { userId: users[i].id, taskId: task.id } });
    }
  }

  console.log(
    `Seeded (today in Bangkok = ${today}): 1 course, ${users.length} users ` +
      `(password "${DEMO_PASSWORD}"), ${TASKS.length} tasks.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
