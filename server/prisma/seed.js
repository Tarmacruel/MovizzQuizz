import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import questions from "../data/questions.js";
import { DEFAULT_APP_SETTINGS } from "../src/appSettings.js";
import { hashPassword } from "../src/security.js";

const prisma = new PrismaClient();
const DEFAULT_ADMIN_USERNAME = "Tarmac";
const DEFAULT_ADMIN_PASSWORD = "Thmpv77d6f*";

async function main() {
  await prisma.question.updateMany({
    data: { active: false },
  });

  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: {
        category: question.category,
        difficulty: question.difficulty,
        question: question.question,
        options: question.options,
        answer: question.answer,
        active: true,
      },
      create: {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        question: question.question,
        options: question.options,
        answer: question.answer,
        active: true,
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "game" },
    update: {},
    create: {
      key: "game",
      value: DEFAULT_APP_SETTINGS,
    },
  });

  await prisma.adminUser.upsert({
    where: { username: DEFAULT_ADMIN_USERNAME },
    update: { active: true },
    create: {
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
      active: true,
    },
  });

  console.log(`Seed concluido: ${questions.length} perguntas sincronizadas e ativadas.`);
  console.log(`Admin inicial garantido: ${DEFAULT_ADMIN_USERNAME}`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
