const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// 1. MEVCUT FONKSİYON (API Koruması İçin)
// Token yoksa 403 hatası döner (Frontend fetch ile yakalar)
const verifyToken = (req, res, next) => {
  let token = req.cookies.accessToken;

  if (!token) {
    return res.status(403).send({ message: "Giriş yapılmamış (Token yok)!" });
  }

  jwt.verify(token, process.env.JWT_SECRET || config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Yetkisiz! Token geçersiz." });
    }
    
    req.userId = decoded.id; 
    next();
  });
};

// 2. YENİ EKLENEN FONKSİYON (Sayfa/View Koruması İçin)
// Token yoksa direkt Login sayfasına atar (Tarayıcı yönlendirir)
const verifyTokenForView = (req, res, next) => {
  let token = req.cookies.accessToken;

  if (!token) {
    // Token yoksa Giriş sayfasına postala
    return res.redirect("/login");
  }

  jwt.verify(token, process.env.JWT_SECRET || config.secret, (err, decoded) => {
    if (err) {
      // Token bozuksa veya süresi dolmuşsa da Giriş sayfasına at
      return res.redirect("/login");
    }
    
    req.userId = decoded.id;
    next();
  });
};

// Paketi Hazırla
const authJwt = {
  verifyToken: verifyToken,
  verifyTokenForView: verifyTokenForView // 👈 İkisini de dışarı açıyoruz
};

module.exports = authJwt;