const controller = require("../controllers/school.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Okul Ekleme Rotası (Sadece giriş yapmış kullanıcılar/Admin)
    app.post("/api/school/create", controller.createSchool);
};