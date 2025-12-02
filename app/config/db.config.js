module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "none", 
  DB: "testdb",
  dialect: "sqlite", 
  
  storage: './database.sqlite', 
  
  pool: { // (Opsiyonel)
    max: 5,     // Aynı anda en fazla 5 açık bağlantı
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};