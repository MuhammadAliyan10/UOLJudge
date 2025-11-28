// prisma/seed.ts
import { PrismaClient, UserRole, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({}); // Instantiate locally. Do not import from src/lib/db

async function main() {
  console.log("🌱 Starting Seed...");

  // 1. Create Global Admin
  const adminPassword = await bcrypt.hash("uol0512", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password_hash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log("✅ Admin Created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
