const controller = require("../controllers/views.controller");

module.exports = function (app) {
    // Ana Sayfa
    app.get("/", (req, res) => res.render("Landing_Page"));
    app.get("/home", (req, res) => res.render("Landing_Page"));
    app.get("/register", (req, res) => res.render("register_router"));
    app.get("/login", (req, res) => res.render("login"));

};