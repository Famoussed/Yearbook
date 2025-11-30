module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "none", // SQLite kullanırken bu ikisine gerek yok ama standartta durur.
  DB: "testdb",
  dialect: "sqlite", // 👈 EN ÖNEMLİ KISIM: Hangi dili konuşacağız?
  
  // SQLite'a özel ayar: Veritabanı dosyası nerede dursun?
  storage: './database.sqlite', 
  
  pool: { // Bağlantı havuzu ayarları (Opsiyonel ama profesyonel)
    max: 5,     // Aynı anda en fazla 5 açık bağlantı
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};