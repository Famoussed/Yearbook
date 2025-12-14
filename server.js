require('dotenv').config();
const express = require("express");
const app = express();
const db = require("./app/models");
const path = require("path");
const Role = db.roles;
const GradeLevel = db.gradeLevels;
const School = db.schools;
const cookieParser = require('cookie-parser');

// --- AYARLAR ---
app.use(express.json()); // JSON verilerini okumak için
app.use(express.urlencoded({ extended: true })); // 👈 EKSİKTİ: HTML Form verilerini okumak için ŞART!

// Görüntü motorunu EJS olarak ayarla
app.set('view engine', 'ejs');
// "public" klasörünü dışarıya aç
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser())
// --- VERİTABANI BAĞLANTISI ---
// DİKKAT: force: true yaptık. Çünkü yeni modeller ekledik, tablolar sıfırdan oluşmalı.
// Proje çalışıp tablolar oluşunca bunu tekrar 'false' yaparsın.
db.sequelize.sync({ force: false }) 
  .then(() => {
    //initial()
    console.log("Veritabanı senkronize oldu");
  })
  .catch((err) => {
    console.log("Veritabanı hatası: " + err.message);
  });

// Başlangıç Verilerini Ekleyen Fonksiyon
function initial() {
  // Rolleri oluştur (Varsa oluşturma mantığı ekleyebilirsin ama force:true iken gerek yok)
  Role.create({ id: 1, name: "student" });
  Role.create({ id: 2, name: "teacher" });
  Role.create({ id: 3, name: "admin" });

  // Sınıf Seviyelerini oluştur
  GradeLevel.create({ id: 1, name: "İlkokul" });
  GradeLevel.create({ id: 2, name: "Ortaokul" });
  GradeLevel.create({ id: 3, name: "Lise" });
  GradeLevel.create({ id: 4, name: "Üniversite" });
  GradeLevel.create({ id: 5, name: "Kurumlar" });
  
  // Okul oluştur
  School.create({ id: 1, name: "Atatürk Anadolu Lisesi", city: "Ankara" });

  console.log("Varsayılan veriler (Roller ve Sınıflar) eklendi.");
}

// --- ROTALAR ---
require("./app/routes/auth.routes")(app);
require("./app/routes/Yearbook.routes")(app); // Dosya adının büyük/küçük harf durumuna dikkat et!
require("./app/routes/view.routes")(app);
require("./app/routes/school.routes")(app);

// --- SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});