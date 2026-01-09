const controller = require("../controllers/notification.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // 1. Kullanıcının Bildirimlerini Getir
  app.get(
    "/api/notifications",
    [authJwt.verifyToken], // Sadece giriş yapmış kullanıcılar erişebilir
    controller.getUserNotifications
  );

  // 2. Bildirimi Okundu Olarak İşaretle (İsteğe bağlı kullanım için)
  app.delete( // DELETE metodu kullanıyoruz
    "/api/notifications/:id",
    [authJwt.verifyToken],
    controller.deleteNotification // Controller'daki yeni fonksiyonun ismini yazdığına emin ol
  );
};