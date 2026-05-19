const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== MEMULAI SEEDING UKURAN & UPDATE PRODUK ===");

  // 1. Tambahkan ukuran default ke database jika belum ada (S, M, L, XL, XXL)
  const sizes = [
    { name: "S", label: "Small (S)" },
    { name: "M", label: "Medium (M)" },
    { name: "L", label: "Large (L)" },
    { name: "XL", label: "Extra Large (XL)" },
    { name: "XXL", label: "Double Extra Large (XXL)" }
  ];

  console.log("1. Memeriksa dan menambahkan ukuran baju default...");
  for (const size of sizes) {
    await prisma.size.upsert({
      where: { name: size.name },
      update: {},
      create: size
    });
  }
  console.log("✅ Ukuran default siap.");

  // Ambil data ukuran dari database setelah upsert
  const dbSizes = await prisma.size.findMany();

  // 2. Ambil semua produk yang ada di database
  console.log("\n2. Mengambil daftar produk...");
  const products = await prisma.product.findMany({
    include: { sizes: true }
  });
  console.log(`Menemukan ${products.length} produk.`);

  // 3. Hubungkan setiap produk dengan ukuran default jika belum terhubung
  console.log("\n3. Menghubungkan produk dengan ukuran baju...");
  for (const product of products) {
    const existingSizeIds = product.sizes.map(s => s.sizeId);
    
    for (const size of dbSizes) {
      if (!existingSizeIds.includes(size.id)) {
        await prisma.sizeOnProduct.create({
          data: {
            productId: product.id,
            sizeId: size.id,
            stock: 10 // Stok default 10
          }
        });
        console.log(`➕ Hubungkan produk "${product.name}" dengan Ukuran [${size.name}] (Stok: 10)`);
      }
    }
  }

  console.log("\n✅ Semua produk berhasil memiliki pilihan ukuran!");
}

main()
  .catch(err => {
    console.error("❌ Terjadi kesalahan:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
