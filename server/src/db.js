import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__movizzquizzPrisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__movizzquizzPrisma = prisma;
}
