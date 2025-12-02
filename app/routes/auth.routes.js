const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  // CORS ayarları (Tarayıcı güvenliği için)
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // 1. Kayıt Ol (POST)
  app.post("/api/auth/signup", controller.register);

  // 2. Giriş Yap (POST) - 👈 YENİ EKLENECEK SATIR
  app.post("/api/auth/signin", controller.signin);
};