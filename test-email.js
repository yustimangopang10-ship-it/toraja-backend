const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'yustimangopang10@gmail.com',
    pass: 'fkfgqdubiwjfhyka'
  }
});

console.log("Mencoba verifikasi koneksi SMTP ke Gmail...");
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Koneksi SMTP Gagal:", error);
  } else {
    console.log("✅ Koneksi SMTP Sukses! Server siap mengirim email.");
  }
});
