require('dotenv').config();
const express = require("express");
const app = express();
const db = require("./app/models");

app.use(express.json()); // JSON verilerini okumak için

db.sequelize.sync({ force: false }) // force: true => Her açılışta tabloları silip baştan yapar (Geliştirme için)
  .catch((err) => {
    console.log("Veritabanı hatası: " + err.message);
  });

app.get("/", (req, res) => {
  res.json({ message: "SQLite API çalışıyor!" });
});

const PORT = process.env.PORT || 8080;

require("./app/routes/tutorial.routes")(app);
require("./app/routes/auth.routes")(app);
require("./app/routes/Yearbook.routes")(app);

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});