const controller = require("../controllers/auth.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
  // CORS ayarları (Tarayıcı güvenliği için)
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  //middleware katmanından geçiriyoruz önce
  app.get(
    "/api/test/user",
    [authJwt.verifyToken], // 1. Önce Güvenlik Bakar (Token var mı?)
    (req, res) => {        // 2. Varsa bu fonksiyon çalışır
      res.status(200).send({
        message: "Tebrikler! Token geçerli, bu gizli yazıyı görebildin. 🎉",
        userId: req.userId // Middleware'in bulduğu ID'yi de görelim
      });
    }
  );

  //Token varlığını sorgulayan middleware
  app.get("/api/auth/check", [authJwt.verifyToken], controller.checkSession);
  
  // DİKKAT: Buraya [verifyToken] EKLEMİYORUZ! Çünkü Access Token zaten yok veya geçersiz.
  app.post("/api/auth/refreshtoken", controller.refreshToken);

  // 1. Kayıt Ol (POST)
  app.post("/api/auth/signup", controller.register);

  // 2. Giriş Yap (POST)
  app.post("/api/auth/signin", controller.signin);

  // 3. Çıkış Yap (POST)
  app.post("/api/auth/logout", controller.signout)
};