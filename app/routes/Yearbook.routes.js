const controller = require("../controllers/yearbook.controller");

module.exports = function(app) {
  app.post("/api/yearbook/create", controller.createYearBook);
};