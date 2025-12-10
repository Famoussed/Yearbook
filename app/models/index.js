const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    storage: config.storage, // SQLite için
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- MODELLERİ ÇAĞIR ---
db.roles = require("./role.model.js")(sequelize, Sequelize);
db.schools = require("./school.model.js")(sequelize, Sequelize);
db.gradeLevels = require("./gradeLevel.model.js")(sequelize, Sequelize); // YENİ
db.users = require("./user.model.js")(sequelize, Sequelize);
db.students = require("./student.model.js")(sequelize, Sequelize);
db.teachers = require("./teacher.model.js")(sequelize, Sequelize);
db.refreshToken = require("../models/refreshToken.model.js")(sequelize, Sequelize);

// --- İLİŞKİLER (ASSOCIATIONS) ---

// 1. Role - User İlişkisi
db.roles.hasMany(db.users, { as: "users", foreignKey: "role_id" });
db.users.belongsTo(db.roles, { foreignKey: "role_id", as: "role" });

// 2. School - Student & Teacher İlişkisi
db.schools.hasMany(db.students, { as: "students", foreignKey: "school_id" });
db.students.belongsTo(db.schools, { foreignKey: "school_id", as: "school" });

db.schools.hasMany(db.teachers, { as: "teachers", foreignKey: "school_id" });
db.teachers.belongsTo(db.schools, { foreignKey: "school_id", as: "school" });

// 3. GradeLevel - Student İlişkisi (YENİ)
db.gradeLevels.hasMany(db.students, { as: "students", foreignKey: "grade_level_id" });
db.students.belongsTo(db.gradeLevels, { foreignKey: "grade_level_id", as: "grade_level" });

// 4. User - Student & Teacher (Profiller - One-to-One)
db.users.hasOne(db.students, { foreignKey: "user_id", as: "student_profile" });
db.students.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

db.users.hasOne(db.teachers, { foreignKey: "user_id", as: "teacher_profile" });
db.teachers.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

// İlişki: Bir kullanıcının bir (veya çok) refresh token'ı olabilir
db.refreshToken.belongsTo(db.users, {
  foreignKey: "userId",
  targetKey: "id",
});
db.users.hasOne(db.refreshToken, {
  foreignKey: "userId",
  targetKey: "id",
});

// Kod içinde kullanmak için sabitler
db.ROLES = ["user", "student", "teacher", "admin"];

module.exports = db;