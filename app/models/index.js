const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

// 1. Bağlantıyı Başlatıyoruz (New Sequelize)
const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  pool: dbConfig.pool
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 2. Modelleri sisteme tanıtıyoruz
// "tutorial.model.js" dosyasını çağırıp içine (sequelize, Sequelize) parametrelerini atıyoruz.
db.tutorials = require("./tutorial.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);
db.yearbook = require("./yearbook.model.js")(sequelize, Sequelize);
db.class = require("./class.model.js")(sequelize, Sequelize);

module.exports = db;