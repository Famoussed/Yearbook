const controller = require("../controllers/photo.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Fotoğraf Yükle
  app.post("/api/photos/upload", [authJwt.verifyToken], controller.uploadPhoto);

  // Fotoğrafları Getir (?category=personal)
  app.get("/api/photos", [authJwt.verifyToken], controller.getMyPhotos);

  // Fotoğraf Sil
  app.delete("/api/photos/:id", [authJwt.verifyToken], controller.deletePhoto);
};