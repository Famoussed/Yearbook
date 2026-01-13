const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/views.controller"); // Controller'ı dahil et

module.exports = function (app) {
    // Ana Sayfa
    app.get("/", (req, res) => res.render("Landing_Page"));
    app.get("/home", (req, res) => res.render("Landing_Page"));
    app.get("/register_router", (req, res) => res.render("register_router"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/register", (req, res) => res.render("register"));
    app.get("/admin", (req, res) => res.render("Admin_Panel"));
    app.get("/teacherpanel", (req, res) => res.render("Teacher_Panel"));


    //Korumalı fonksiyon olduğu için authJwt Fonksiyonu eklendi
    app.get("/profile", [authJwt.verifyTokenForView], (req, res) => res.render("profile"));

    // --- PROFİL İSTATİSTİKLERİ API (Öğrenci & Komite Sayısı) ---
    // Bu endpoint, profile sayfasındaki sağ panelde bulunan Yıllık Özeti kısmını doldurur.
    app.get("/api/view/profile-stats", [authJwt.verifyToken], controller.getProfileStats);
};