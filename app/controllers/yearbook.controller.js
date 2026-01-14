const db = require("../models");
const YearBook = db.yearbooks;
const School = db.schools;

//Veritabanından tüm yıllık bilgilerini çeken fonksiyon
exports.getAllYearbooks = (req, res) => {
  YearBook.findAll({
    include: [{
      model: School,
      as: "school", // Okul bilgilerini de getir
      attributes: ['name'] // Sadece okulun adını al, fazlasına gerek yok
    }],
    order: [['createdAt', 'DESC']] // En son oluşturulan en üstte görünsün
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message: err.message || "Yıllıklar getirilirken bir hata oluştu."
    });
  });
};

exports.createYearBook = (req, res) => {
  // Status Değerini Güvenli Hale Getir
  let status = parseInt(req.body.YearBookStatus);
  if (isNaN(status)) status = 1; // Eğer sayı değilse varsayılan 1 olsun

  // YearBook Oluşturma
  YearBook.create({
    YearBookName: req.body.YearBookName,
    EduDate: req.body.EduDate,
    school_id: req.body.school_id,
    YearBookCover: req.body.YearBookCover,
    PageSizes: req.body.PageSizes,
    YearBookStatus: status, // Parsed integer
    PaperType: req.body.PaperType,
    ResponsedPerson: req.body.ResponsedPerson,
  })
    .then(user => {
      res.send({ message: "Yıllık Veritabanına Başarıyla Eklendi" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};