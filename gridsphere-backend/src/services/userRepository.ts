import prisma from "../config/prisma";
import { UserCreate } from "../schemas/userSchema";

// Equivalent of app/repositories/user_repo.py -> get_user_by_email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

// Equivalent of app/repositories/user_repo.py -> create_user
export async function createUser(userData: UserCreate, hashedPassword: string) {
  return prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      passwordHash: hashedPassword,
      // Always "user" - self-registration can never grant elevated roles.
      // See middleware/rbac.ts and schemas/userSchema.ts for context.
      role: "user",
    },
  });
}


