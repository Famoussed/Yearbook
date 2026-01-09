const controller = require("../controllers/teacher.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // 1. Dashboard Verileri
  app.get("/api/teacher/dashboard", [authJwt.verifyToken], controller.getDashboardData);

  // 2. Onay Bekleyenler
  app.get("/api/teacher/pending-memories", [authJwt.verifyToken], controller.getPendingMemories);

  // 3. Onaylama İşlemi (POST)
  app.post("/api/teacher/approve-memory", [authJwt.verifyToken], controller.approveMemory);

  // 4. Öğrenci Listesi
  app.get("/api/teacher/students", [authJwt.verifyToken], controller.getStudents);
};