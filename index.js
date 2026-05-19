const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./prismaClient");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();

// ================= KONFIGURASI CORS YANG LEBIH BAIK =================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const SECRET = "rahasia_jwt";

// ================= KONFIGURASI UPLOAD GAMBAR =================
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// ================= KONFIGURASI EMAIL =================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'yustimangopang10@gmail.com',
    pass: 'fkfgqdubiwjfhyka'
  }
});

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Backend jalan 🚀");
});

// ================= REGISTER =================
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.json({ message: "Register berhasil", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= LOGIN JWT =================
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "User tidak ditemukan" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Password salah" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      message: "Login berhasil",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= JWT MIDDLEWARE =================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token tidak ada" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token tidak valid" });
    req.user = user;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Akses admin saja" });
  next();
};

// ================= FORGOT & RESET PASSWORD =================
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email tidak terdaftar" });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    await prisma.passwordReset.create({
      data: { email, token, expiresAt }
    });
    
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: 'yustimangopang10@gmail.com',
      to: email,
      subject: "Reset Password - TORAJA CLOTHING",
      html: `<h3>Reset Password Anda</h3><p>Klik link di bawah ini:</p><a href="${resetLink}">${resetLink}</a><p>Link berlaku 1 jam.</p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`
    });
    
    res.json({ message: "Link reset password telah dikirim ke email Anda" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset) return res.status(400).json({ error: "Token tidak valid" });
    if (reset.expiresAt < new Date()) return res.status(400).json({ error: "Token sudah kadaluarsa" });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: reset.email },
      data: { password: hashedPassword }
    });
    await prisma.passwordReset.delete({ where: { token } });
    res.json({ message: "Password berhasil direset. Silakan login." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= USER MANAGEMENT (ADMIN) =================
app.get("/api/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (parseInt(id) === req.user.id && role !== "admin") {
      return res.status(400).json({ error: "Tidak bisa ubah role sendiri" });
    }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });
    res.json({ message: "Role berhasil diubah", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cart.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.order.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/change-password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Password lama salah" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });
    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= ORDER MANAGEMENT =================
app.get("/api/admin/orders", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true, size: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true, size: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔥 UPDATE STATUS ORDER
app.put("/api/admin/orders/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log("=========================================");
    console.log("📦 REQUEST UPDATE STATUS");
    console.log("📦 Request params:", req.params);
    console.log("📦 Request body:", req.body);
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "ID order tidak ditemukan di URL" });
    }
    
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: `ID order harus berupa angka, menerima: ${id}` });
    }
    
    const validStatus = ["pending", "processed", "shipped", "delivered", "cancelled"];
    if (!status || !validStatus.includes(status)) {
      return res.status(400).json({ error: `Status tidak valid. Pilihan: ${validStatus.join(", ")}` });
    }
    
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ error: `Order dengan ID ${orderId} tidak ditemukan` });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status }
    });
    
    console.log(`✅ Status berhasil diupdate menjadi: ${updatedOrder.status}`);
    console.log("=========================================");
    
    res.json({ 
      success: true, 
      message: "Status order berhasil diupdate", 
      order: updatedOrder 
    });
    
  } catch (error) {
    console.error("❌ Error update status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= CHECKOUT =================
app.post("/checkout", verifyToken, async (req, res) => {
  try {
    const { cart, customerName, customerPhone, customerAddress, shippingMethod, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Cart kosong" });
    }

    let total = 0;
    for (const item of cart) {
      total += Number(item.price) * Number(item.qty);
    }

    let shippingCost = 10000;
    if (shippingMethod === "express") shippingCost = 20000;
    const grandTotal = total + shippingCost;

    const order = await prisma.order.create({
      data: {
        userId,
        customerName,
        customerPhone,
        customerAddress,
        total: grandTotal,
        paymentMethod: paymentMethod || "cod",
        status: "pending"
      }
    });

    for (const item of cart) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: Number(item.id),
          sizeId: item.sizeId || null,  // ← TAMBAHKAN UKURAN
          qty: Number(item.qty),
          price: Number(item.price)
        }
      });
    }

    res.json({ message: "Checkout berhasil", order });
  } catch (error) {
    console.error("❌ Error checkout:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= PRODUCT CRUD =================

// GET ALL PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        sizes: {
          include: { size: true }
        }
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE PRODUCT (DENGAN UKURAN)
app.get("/products/:id", async (req, res) => {
  console.log("Endpoint /products/:id dipanggil, ID:", req.params.id);
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID harus berupa angka" });
    }
    const product = await prisma.product.findUnique({
      where: { id: id },
      include: {
        sizes: {
          include: { size: true }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ error: "Produk tidak ditemukan" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error di /products/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE PRODUCT (ADMIN ONLY)
app.post("/products", verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const product = await prisma.product.create({
      data: { name, price: Number(price), description, image }
    });
    
    // Otomatis tambahkan semua ukuran untuk produk baru dengan stok 10
    const sizes = await prisma.size.findMany();
    for (const size of sizes) {
      await prisma.sizeOnProduct.create({
        data: {
          productId: product.id,
          sizeId: size.id,
          stock: 10
        }
      });
    }
    
    res.json({ message: "Produk berhasil ditambahkan", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PRODUCT (ADMIN ONLY)
app.put("/products/:id", verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: { name, price: Number(price), description, ...(image && { image }) }
    });
    res.json({ message: "Produk berhasil diupdate", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE PRODUCT (ADMIN ONLY)
app.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus relasi ukuran terlebih dahulu
    await prisma.sizeOnProduct.deleteMany({
      where: { productId: Number(id) }
    });
    await prisma.product.delete({ where: { id: Number(id) } });
    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= ENDPOINT UNTUK UKURAN (ADMIN) =================

// GET ALL SIZES
app.get("/api/sizes", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const sizes = await prisma.size.findMany();
    res.json(sizes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE STOCK PER UKURAN (ADMIN)
app.put("/api/products/:productId/sizes/:sizeId/stock", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { productId, sizeId } = req.params;
    const { stock } = req.body;
    
    const sizeOnProduct = await prisma.sizeOnProduct.update({
      where: {
        productId_sizeId: {
          productId: parseInt(productId),
          sizeId: parseInt(sizeId)
        }
      },
      data: { stock: parseInt(stock) }
    });
    
    res.json({ message: "Stok berhasil diupdate", sizeOnProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= TERMS API =================
app.get("/api/terms", async (req, res) => {
  try {
    const terms = await prisma.term.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/terms/:id/agree", verifyToken, async (req, res) => {
  try {
    const termId = parseInt(req.params.id);
    const userId = req.user.id;
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term) return res.status(404).json({ error: "Term tidak ditemukan" });
    const existing = await prisma.termAgreement.findUnique({
      where: { userId_termId: { userId, termId } }
    });
    if (existing) return res.status(400).json({ error: "Sudah pernah menyetujui" });
    const agreement = await prisma.termAgreement.create({
      data: { userId, termId, ipAddress: req.ip }
    });
    res.json({ success: true, message: "Berhasil menyetujui syarat", agreement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/terms/my-agreements", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const agreements = await prisma.termAgreement.findMany({
      where: { userId },
      include: { term: true }
    });
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/terms", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const terms = await prisma.term.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/terms", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, content, category, version, isActive } = req.body;
    const term = await prisma.term.create({
      data: { title, content, category: category || "umum", version: version || 1, isActive: isActive !== undefined ? isActive : true }
    });
    res.json({ message: "Term berhasil ditambahkan", term });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/terms/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, version, isActive } = req.body;
    const term = await prisma.term.update({
      where: { id: parseInt(id) },
      data: { title, content, category, version, isActive }
    });
    res.json({ message: "Term berhasil diupdate", term });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/terms/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.term.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Term berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ================= SETTINGS API =================

// GET semua settings (public)
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET specific setting by key
app.get("/api/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE setting (ADMIN ONLY)
app.put("/api/admin/settings/:key", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    res.json({ message: "Setting berhasil diupdate", setting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize default settings (jalankan sekali untuk mengisi data awal)
app.post("/api/admin/settings/init", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const defaultSettings = [
      { key: "whatsapp_number", value: "6285397853625" },
      { key: "bank_bca_number", value: "1234567890" },
      { key: "bank_mandiri_number", value: "9876543210" },
      { key: "bank_bri_number", value: "5555555555" },
      { key: "bank_account_name", value: "TO Manglaa x TORAJA CLOTHING" }
    ];
    
    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }
    
    res.json({ message: "Default settings berhasil diinisialisasi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ================= START SERVER =================
const PORT = process.env.PORT || 5000;  // ← PERUBAHAN ADA DI SINI
app.listen(PORT, () => {
  console.log(`🚀 Server running di port ${PORT}`);
});