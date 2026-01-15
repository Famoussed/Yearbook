const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.users;
const Role = db.roles;
const RefreshToken = db.refreshToken; // RefreshToken modelini ekle

// 1. MEVCUT FONKSİYON (API Koruması İçin)
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

// 2. GELİŞMİŞ VIEW KORUMASI (Token Refresh Destekli) 🚀
const verifyTokenForView = async (req, res, next) => {
  let accessToken = req.cookies.accessToken;

  // A. Access Token Var ve Geçerli mi?
  if (accessToken) {
    jwt.verify(accessToken, process.env.JWT_SECRET || config.secret, (err, decoded) => {
      if (!err) {
        req.userId = decoded.id;
        return next(); // Her şey yolunda, devam et
      }
      // Access Token geçersizse (Süresi dolmuş vs.) B planına geç (Refresh Token)
    });
  }

  // B. B Planı: Refresh Token Kontrolü
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.redirect("/login"); // İkisi de yoksa Giriş'e at
  }

  try {
    // 1. Refresh Token'ı DB'de bul
    let dbRefreshToken = await RefreshToken.findOne({ where: { token: refreshToken } });

    if (!dbRefreshToken) {
      return res.redirect("/login"); // Sahte veya silinmiş token
    }

    // 2. Süresi dolmuş mu?
    if (RefreshToken.verifyExpiration(dbRefreshToken)) {
      RefreshToken.destroy({ where: { id: dbRefreshToken.id } });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.redirect("/login");
    }

    // 3. YENİLEME BAŞARILI! Yeni Access Token üret
    const user = await dbRefreshToken.getUser();
    
    let newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || config.secret, {
      expiresIn: config.jwtExpiration, // Config'den süreyi al
    });

    // 4. Yeni Token'ı Cookie'ye yaz
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false, // Canlıda true
      sameSite: 'strict',
      maxAge: 3600000 // 1 Saat (Config ile uyumlu olmalı)
    });

    // 5. Kullanıcı ID'sini set et ve sayfayı aç
    req.userId = user.id;
    return next();

  } catch (err) {
    console.error("View Refresh Hatası:", err);
    return res.redirect("/login");
  }
};

// --- ROL KONTROLLERİ ---

// Admin Kontrolü
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const role = await Role.findByPk(user.role_id);

    if (role.name === "admin") {
      next();
      return;
    }

    // Yetkisiz ise 404 (Sayfa yokmuş gibi davran)
    res.status(404).send("Sayfa bulunamadı.");
  } catch (error) {
    res.status(500).send({ message: "Rol kontrolü yapılamadı." });
  }
};

// Öğretmen Kontrolü
const isTeacher = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const role = await Role.findByPk(user.role_id);

    if (role.name === "teacher" || role.name === "admin") { // Admin de girebilsin mi? Genelde evet.
      next();
      return;
    }

    res.status(404).send("Sayfa bulunamadı.");
  } catch (error) {
    res.status(500).send({ message: "Rol kontrolü yapılamadı." });
  }
};

// Öğrenci Kontrolü (Profil sayfası için)
const isStudent = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const role = await Role.findByPk(user.role_id);

    if (role.name === "student") { // Sadece öğrenciler girebilir
      next();
      return;
    }

    // Öğretmen ise Teacher Panel'e yönlendir (Opsiyonel ama mantıklı)
    if (role.name === "teacher") {
        return res.redirect("/teacherpanel");
    }
    
    if (role.name === "admin") {
        return res.redirect("/admin");
    }

    res.status(404).send("Sayfa bulunamadı.");
  } catch (error) {
    res.status(500).send({ message: "Rol kontrolü yapılamadı." });
  }
};

// Paketi Hazırla
const authJwt = {
  verifyToken: verifyToken,
  verifyTokenForView: verifyTokenForView,
  isAdmin: isAdmin,
  isTeacher: isTeacher,
  isStudent: isStudent
};

module.exports = authJwt;