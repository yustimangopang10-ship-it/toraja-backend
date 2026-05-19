const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.create({
    data: {
      name: "Admin Toko",
      email: "admin@toraja.com",
      password: hashedPassword,
      role: "admin"
    }
  });
  
  console.log("✅ Admin berhasil dibuat!");
  console.log("📧 Email: admin@toraja.com");
  console.log("🔑 Password: admin123");
  console.log("👑 Role: admin");
}

main();