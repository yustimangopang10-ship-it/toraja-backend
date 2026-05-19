process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT ERROR:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err);
  process.exit(1);
});

console.log("🚀 Starting server...");

const express = require("express");
console.log("✅ express loaded");

const cors = require("cors");
console.log("✅ cors loaded");

const bcrypt = require("bcrypt");
console.log("✅ bcrypt loaded");

const jwt = require("jsonwebtoken");
console.log("✅ jwt loaded");

console.log("📦 Loading prismaClient...");
const prisma = require("./prismaClient");
console.log("✅ prismaClient loaded");

const multer = require("multer");
console.log("✅ multer loaded");

const path = require("path");
console.log("✅ path loaded");

const fs = require("fs");
console.log("✅ fs loaded");

const crypto = require("crypto");
console.log("✅ crypto loaded");

const nodemailer = require("nodemailer");
console.log("✅ nodemailer loaded");

const app = express();
console.log("✅ app created");

app.use(cors());
app.use(express.json());
console.log("✅ middleware loaded");

const SECRET = "rahasia_jwt";
console.log("✅ SECRET set");

// ================= KONFIGURASI UPLOAD GAMBAR =================
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log("📁 Uploads folder created");
}
console.log("✅ upload config done");

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Backend jalan 🚀");
});
console.log("✅ GET / endpoint registered");

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
console.log("✅ GET /products endpoint registered");

app.get("/products/:id", async (req, res) => {
  console.log("Endpoint /products/:id dipanggil, ID:", req.params.id);
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID harus berupa angka" });
    }
    const product = await prisma.product.findUnique({
      where: { id: id }
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
console.log("✅ GET /products/:id endpoint registered");

console.log("🚀 Attempting to start server on port 5000...");

app.listen(5000, () => {
  console.log("Server running di http://localhost:5000");
});

console.log("✅ Server listen called");