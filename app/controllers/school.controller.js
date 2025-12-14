const db = require("../models");
const School = db.schools;

exports.createSchool = (req, res) => {
  // Basit Validasyon
  if (!req.body.name) {
    return res.status(400).send({ message: "Okul adı boş olamaz!" });
  }

  // Okul Oluştur
  School.create({
    name: req.body.name,
    city: req.body.city
  })
    .then(data => {
      res.send({ 
          message: "Okul başarıyla eklendi!",
          school: data // Oluşan okulun ID'sini frontend'de göstermek istersen diye
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Okul oluşturulurken bir hata oluştu."
      });
    });
};