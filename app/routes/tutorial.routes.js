module.exports = app => {
  const tutorials = require("../controllers/tutorial.controller.js");

  var router = require("express").Router();

  // Yeni bir Tutorial oluştur
  router.post("/", tutorials.create);

  app.use('/api/tutorials', router);
};