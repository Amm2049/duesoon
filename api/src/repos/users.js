// All Prisma calls for users (SPEC D-30). passwordHash never leaves this file except for login checks.
const prisma = require("../db");

const toUserJson = (u) => ({ id: u.id, name: u.name, email: u.email });

/** Full row including passwordHash, for login only. */
function findByEmailForLogin(email) {
  return prisma.user.findUnique({ where: { email } });
}

/** Returns the public user, or null if the email is already registered. */
async function createUser({ name, email, passwordHash }) {
  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    return toUserJson(user);
  } catch (err) {
    if (err.code === "P2002") return null; // unique constraint (email)
    throw err;
  }
}

module.exports = { toUserJson, findByEmailForLogin, createUser };
