const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
    // Ana Sayfa
    app.get("/", (req, res) => res.render("Landing_Page"));
    app.get("/home", (req, res) => res.render("Landing_Page"));
    app.get("/register_router", (req, res) => res.render("register_router"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/register", (req, res) => res.render("register"));
    app.get("/admin", (req, res) => res.render("Admin_Panel"));

    //Korumalı fonksiyon olduğu için authJwt Fonksiyonu eklendi
    app.get("/profile", [authJwt.verifyTokenForView], (req, res) => res.render("profile"));

};