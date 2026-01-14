const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.users;
const Role = db.roles;

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

// 2. YENİ EKLENEN FONKSİYON (Sayfa/View Koruması İçin)
const verifyTokenForView = (req, res, next) => {
  let token = req.cookies.accessToken;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, process.env.JWT_SECRET || config.secret, (err, decoded) => {
    if (err) {
      return res.redirect("/login");
    }
    
    req.userId = decoded.id;
    next();
  });
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