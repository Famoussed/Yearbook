const controller = require("../controllers/license.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Lisans Oluştur (Sadece Admin)
    app.post("/api/licenses/create", [authJwt.verifyToken, authJwt.isAdmin], controller.createLicense);

    // Lisansları Listele (Sadece Admin)
    app.get("/api/licenses", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllLicenses);

    // Lisans Sil (Sadece Admin)
    app.delete("/api/licenses/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteLicense);
};