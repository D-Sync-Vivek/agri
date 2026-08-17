import { PrismaClient } from "@prisma/client";

// Singleton Prisma client (equivalent to SessionLocal in database.py)
const prisma = new PrismaClient();

export default prisma;


