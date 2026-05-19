// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ========== HAPUS DATA LAMA (URUTAN PENTING) ==========
  // Hapus data yang memiliki foreign key terlebih dahulu
  await prisma.termAgreement.deleteMany();
  await prisma.term.deleteMany();
  await prisma.sizeOnProduct.deleteMany();  // ← TAMBAH: hapus relasi produk-ukuran
  await prisma.cart.deleteMany();           // ← TAMBAH: hapus cart
  await prisma.orderItem.deleteMany();      // ← TAMBAH: hapus order item
  await prisma.order.deleteMany();          // ← TAMBAH: hapus order
  await prisma.size.deleteMany();           // ← TAMBAH: hapus ukuran

  // ========== SEED DATA UKURAN BAJU ==========
  const sizes = [
    { name: 'S', label: 'Small (S)' },
    { name: 'M', label: 'Medium (M)' },
    { name: 'L', label: 'Large (L)' },
    { name: 'XL', label: 'Extra Large (XL)' },
    { name: 'XXL', label: 'Double Extra Large (XXL)' },
  ];

  for (const size of sizes) {
    await prisma.size.upsert({
      where: { name: size.name },
      update: {},
      create: size,
    });
  }
  console.log("✅ Data ukuran baju berhasil ditambahkan:", sizes.map(s => s.name).join(', '));

  // ========== SEED DATA SYARAT & KETENTUAN ==========
  await prisma.term.createMany({
    data: [
      {
        title: "Ketentuan Umum To Manglaa x TORAJA CLOTHING",
        content: "Selamat datang di To Manglaa x TORAJA CLOTHING! Dengan menggunakan sistem pemesanan ini, Anda menyetujui seluruh syarat dan ketentuan yang berlaku.",
        category: "umum",
        version: 1,
        isActive: true
      },
      {
        title: "Prosedur Pemesanan",
        content: "Pelanggan wajib login terlebih dahulu. Pilih produk favorit dari koleksi To Manglaa x TORAJA CLOTHING, pastikan memilih ukuran yang sesuai, lalu masukkan ke keranjang, dan lakukan checkout.",
        category: "pemesanan",
        version: 1,
        isActive: true
      },
      {
        title: "Pengelolaan Order",
        content: "Setelah checkout, order akan diproses oleh admin To Manglaa x TORAJA CLOTHING. Status pesanan dapat dipantau oleh pelanggan melalui halaman 'Pesananku'.",
        category: "order",
        version: 1,
        isActive: true
      },
      {
        title: "Pembayaran",
        content: "Pembayaran dilakukan sesuai total harga pesanan. Konfirmasi pembayaran akan diverifikasi oleh admin To Manglaa x TORAJA CLOTHING.",
        category: "pembayaran",
        version: 1,
        isActive: true
      },
      {
        title: "Privasi Data",
        content: "Data pribadi pelanggan To Manglaa x TORAJA CLOTHING akan dijaga kerahasiaannya dan tidak akan disalahgunakan.",
        category: "privasi",
        version: 1,
        isActive: true
      },
      {
        title: "Kebijakan Ukuran Baju",
        content: "Tersedia ukuran S, M, L, XL, dan XXL. Pastikan memilih ukuran yang sesuai sebelum checkout. Stok setiap ukuran terbatas.",
        category: "ukuran",
        version: 1,
        isActive: true
      }
    ],
  });

  console.log("✅ Data syarat & ketentuan To Manglaa x TORAJA CLOTHING berhasil ditambahkan");
}

main()
  .catch(e => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });