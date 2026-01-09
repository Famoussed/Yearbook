const controller = require("../controllers/memory.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // 1. Sınıf arkadaşlarını listele
  app.get("/api/memory/classmates", [authJwt.verifyToken], controller.getClassmates);

  // 2. Anı yazısı gönder
  app.post("/api/memory/create", [authJwt.verifyToken], controller.createMemory);

  // 3. Bana gelen anıları gör
  app.get("/api/memory/my-memories", [authJwt.verifyToken], controller.getMyMemories);

  // 4. Benim yazdığım anıları gör
  app.get("/api/memory/sent-memories", [authJwt.verifyToken], controller.getSentMemories);

  app.post("/api/memory/approve-student", [authJwt.verifyToken], controller.approveByStudent);

  app.put(
    "/api/memories/:id",
    [authJwt.verifyToken], // Sadece giriş yapmış kullanıcı
    controller.updateMemory
  );
};