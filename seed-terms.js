require("dotenv").config();
const prisma = require("./prismaClient");

async function seedTerms() {
  const terms = [
    {
      title: "Syarat Pembelian",
      content: "Dengan memesan di TO Mangla x TORAJA CLOTHING, pelanggan menyetujui semua syarat yang berlaku. Pesanan diproses setelah pembayaran dikonfirmasi. Kami berhak menolak pesanan yang tidak memenuhi ketentuan.",
      category: "pembelian",
      version: 1,
      isActive: true,
    },
    {
      title: "Pembayaran",
      content: "Pembayaran via transfer bank (BCA, Mandiri, BRI) atau COD. Kirim bukti transfer ke admin via WhatsApp. Pesanan diproses setelah pembayaran terverifikasi dalam 1x24 jam.",
      category: "pembayaran",
      version: 1,
      isActive: true,
    },
    {
      title: "Pengiriman",
      content: "Pengiriman ke seluruh Indonesia via ekspedisi terpercaya. Estimasi 2-5 hari kerja (reguler) atau 1-2 hari kerja (express). Ongkir ditanggung pembeli. Keterlambatan dari ekspedisi bukan tanggung jawab kami.",
      category: "pengiriman",
      version: 1,
      isActive: true,
    },
    {
      title: "Pengembalian & Penukaran",
      content: "Produk bisa dikembalikan dalam 3 hari jika ada cacat produksi atau salah kirim. Produk yang sudah dipakai atau dicuci tidak bisa dikembalikan. Biaya return ditanggung pembeli kecuali kesalahan dari kami.",
      category: "pengembalian",
      version: 1,
      isActive: true,
    },
    {
      title: "Privasi Data Pelanggan",
      content: "Data pelanggan (nama, alamat, telepon, email) hanya digunakan untuk pemrosesan pesanan. Kami tidak menjual data ke pihak ketiga. Dengan menggunakan layanan kami, pelanggan menyetujui kebijakan privasi ini.",
      category: "privasi",
      version: 1,
      isActive: true,
    },
    {
      title: "Keaslian Produk",
      content: "Semua produk TO Mangla x TORAJA CLOTHING adalah produk original buatan kami. Desain terinspirasi budaya Toraja, Sulawesi Selatan. Kami menjamin kualitas dan keaslian setiap produk.",
      category: "produk",
      version: 1,
      isActive: true,
    },
  ];

  console.log("🌱 Memulai seeding terms...");

  for (const term of terms) {
    // Cek apakah sudah ada
    const existing = await prisma.term.findFirst({
      where: { title: term.title }
    });

    if (existing) {
      console.log(`⏭️  Term "${term.title}" sudah ada, skip.`);
    } else {
      await prisma.term.create({ data: term });
      console.log(`✅ Term "${term.title}" berhasil ditambahkan.`);
    }
  }

  console.log("🎉 Seeding selesai!");
  await prisma.$disconnect();
}

seedTerms().catch((e) => {
  console.error("❌ Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
