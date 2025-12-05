const db = require("../models");
const YearBook = db.yearbook;

exports.createYearBook = (req, res) => {
  // YearBook Oluşturma
  YearBook.create({
    YearBookName: req.body.YearBookName,
    EduDate: req.body.EduDate,
    YearBookCover: req.body.YearBookCover,
    PageSizes: req.body.PageSizes,
    YearBookStatus: req.body.YearBookStatus,
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