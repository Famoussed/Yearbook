module.exports = app => {
  const tutorials = require("../controllers/tutorial.controller.js");

  var router = require("express").Router();

  router.post("/", tutorials.create);
  router.get("/", tutorials.findAll);
  app.use('/api/tutorials', router);

};