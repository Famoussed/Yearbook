const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/views.controller"); // Controller'ı dahil et

module.exports = function (app) {
    // Ana Sayfa
    app.get("/", (req, res) => res.render("Landing_Page"));
    app.get("/home", (req, res) => res.render("Landing_Page"));
    app.get("/register_router", (req, res) => res.render("register_router"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/register", (req, res) => res.render("register"));

    // Şifremi Unuttum Sayfası
    app.get("/forgot-password", (req, res) => res.render("forgot-password"));
    
    // Şifre Sıfırlama Sayfası (Token ile)
    app.get("/reset-password/:token", (req, res) => res.render("reset-password", { token: req.params.token }));
    
    // YÖNETİCİ PANELİ (Sadece Admin)
    app.get("/admin", [authJwt.verifyTokenForView, authJwt.isAdmin], (req, res) => res.render("Admin_Panel"));
    
    // ÖĞRETMEN PANELİ (Sadece Öğretmen)
    app.get("/teacherpanel", [authJwt.verifyTokenForView, authJwt.isTeacher], (req, res) => res.render("Teacher_Panel"));

    // ÖĞRENCİ PROFİLİ (Sadece Öğrenci - Öğretmen girerse kendi paneline yönlenir)
    app.get("/profile", [authJwt.verifyTokenForView, authJwt.isStudent], (req, res) => res.render("profile"));

    // --- PROFİL İSTATİSTİKLERİ API (Öğrenci & Komite Sayısı) ---
    // Bu endpoint, profile sayfasındaki sağ panelde bulunan Yıllık Özeti kısmını doldurur.
    app.get("/api/view/profile-stats", [authJwt.verifyToken], controller.getProfileStats);
};