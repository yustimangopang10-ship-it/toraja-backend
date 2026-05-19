const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);
  
  const user = await prisma.user.create({
    data: {
      name: "User Baru",
      email: "userbaru@mail.com",
      password: hashedPassword,
      role: "user"
    }
  });
  
  console.log("✅ Akun berhasil dibuat!");
  console.log("📧 Email: userbaru@mail.com");
  console.log("🔑 Password: 123456");
  console.log("👤 Role: user");
}

main();