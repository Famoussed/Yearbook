const db = require("../models");
const Tutorial = db.tutorials;
const Op = db.Sequelize.Op;

// 1. Yeni Kayıt Oluşturma ve Kaydetme
exports.create = (req, res) => {
  // Önce gelen veriyi kontrol edelim (Validasyon)
  if (!req.body.title) {
    res.status(400).send({
      message: "İçerik boş olamaz! Lütfen bir başlık (title) girin."
    });
    return;
  }

  // Veritabanı için nesneyi hazırlayalım
  const tutorial = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false
  };

  // Sequelize ile veritabanına kaydedelim
  Tutorial.create(tutorial)
    .then(data => {
      res.send(data); // Başarılı olursa kaydedilen veriyi geri dön
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Kayıt oluşturulurken bir hata oluştu."
      });
    });
};

// 2. Tüm Verileri Getir (Read)
exports.findAll = (req, res) => {
  Tutorial.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Veriler getirilirken bir hata oluştu."
      });
    });
};