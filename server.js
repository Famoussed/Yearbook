const express = require("express");
const app = express();
const db = require("./app/models"); // index.js dosyasını çağırır

app.use(express.json()); // JSON verilerini okumak için

// --- SİHİRLİ KISIM BAŞLIYOR ---
// sync() komutu veritabanına bakar:
// "Tablolar var mı? Yoksa oluşturayım mı?" diye kontrol eder.
db.sequelize.sync({ force: true }) // force: true => Her açılışta tabloları silip baştan yapar (Geliştirme için)
  .then(() => {
    console.log("Tablolar silindi ve yeniden senkronize edildi (Drop & Sync).");
  })
  .catch((err) => {
    console.log("Veritabanı hatası: " + err.message);
  });
// --- SİHİRLİ KISIM BİTTİ ---

app.get("/", (req, res) => {
  res.json({ message: "SQLite API çalışıyor!" });
});

const PORT = 8080;

require("./app/routes/tutorial.routes")(app); // 👈 Bu satırı ekle

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});