const controller = require("../controllers/announcement.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Duyuru Yayınla (Sadece Öğretmen)
  app.post(
    "/api/announcements",
    [authJwt.verifyToken], 
    controller.createAnnouncement
  );

  // Duyuruları Gör (Herkes)
  app.get(
    "/api/announcements",
    [authJwt.verifyToken],
    controller.getAnnouncements
  );
};