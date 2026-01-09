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
db.gradeLevels = require("./gradeLevel.model.js")(sequelize, Sequelize); 
db.users = require("./user.model.js")(sequelize, Sequelize);
db.students = require("./student.model.js")(sequelize, Sequelize);
db.teachers = require("./teacher.model.js")(sequelize, Sequelize);
db.refreshToken = require("../models/refreshToken.model.js")(sequelize, Sequelize);
db.yearbooks = require("./yearbook.model.js")(sequelize, Sequelize);
db.memories = require("./memory.model.js")(sequelize, Sequelize);
db.notifications = require("./notification.model.js")(sequelize, Sequelize);
db.announcements = require("./announcement.model.js")(sequelize, Sequelize);

// --- İLİŞKİLER (ASSOCIATIONS) ---

// 1. Role - User İlişkisi
db.roles.hasMany(db.users, { as: "users", foreignKey: "role_id" });
db.users.belongsTo(db.roles, { foreignKey: "role_id", as: "role" });

// 2. School - Student & Teacher İlişkisi
db.schools.hasMany(db.students, { as: "students", foreignKey: "school_id" });
db.students.belongsTo(db.schools, { foreignKey: "school_id", as: "school" });

db.schools.hasMany(db.teachers, { as: "teachers", foreignKey: "school_id" });
db.teachers.belongsTo(db.schools, { foreignKey: "school_id", as: "school" });

// 3. GradeLevel - Student İlişkisi
db.gradeLevels.hasMany(db.students, { as: "students", foreignKey: "grade_level_id" });
db.students.belongsTo(db.gradeLevels, { foreignKey: "grade_level_id", as: "grade_level" });

// 4. User - Student & Teacher (Profiller - One-to-One)
db.users.hasOne(db.students, { foreignKey: "user_id", as: "student_profile" });
db.students.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

db.users.hasOne(db.teachers, { foreignKey: "user_id", as: "teacher_profile" });
db.teachers.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

// 5. Okul - Yıllık İlişkisi (YENİ - One-to-One) 🚀
// Bir okulun sadece BİR yıllığı olur (hasOne)
// Erişim yaparken: school.yearbook (tekil) şeklinde ulaşacaksın.
db.schools.hasOne(db.yearbooks, { 
    foreignKey: "school_id", 
    as: "yearbook" 
});
db.yearbooks.belongsTo(db.schools, { 
    foreignKey: "school_id", 
    as: "school" 
});

// İlişki: Bir kullanıcının bir (veya çok) refresh token'ı olabilir
db.refreshToken.belongsTo(db.users, {
  foreignKey: "userId",
  targetKey: "id",
});
db.users.hasOne(db.refreshToken, {
  foreignKey: "userId",
  targetKey: "id",
});

//Memories sistemi için gerekli ilişkiler
// A. Bir Anı, Bir Yıllığa Aittir
db.yearbooks.hasMany(db.memories, { as: "memories", foreignKey: "yearbook_id" });
db.memories.belongsTo(db.yearbooks, { foreignKey: "yearbook_id", as: "yearbook" });

// B. Gönderen Öğrenci (Yazan)
db.students.hasMany(db.memories, { as: "sent_memories", foreignKey: "from_student_id" });
db.memories.belongsTo(db.students, { foreignKey: "from_student_id", as: "sender" });

// C. Alıcı Öğrenci (Kendisine Yazılan)
db.students.hasMany(db.memories, { as: "received_memories", foreignKey: "to_student_id" });
db.memories.belongsTo(db.students, { foreignKey: "to_student_id", as: "receiver" });

//Notification system için gerekli ilişkiler
db.users.hasMany(db.notifications, { 
    as: "notifications", 
    foreignKey: "user_id" 
});

// Bir bildirim TEK bir kullanıcıya aittir
db.notifications.belongsTo(db.users, { 
    foreignKey: "user_id", 
    as: "user" 
});

// 1. Okul ve Duyuru İlişkisi (Bir okulun çok duyurusu olur)
db.schools.hasMany(db.announcements, { as: "announcements" });
db.announcements.belongsTo(db.schools, {
  foreignKey: "schoolId",
  as: "school",
});

// Kod içinde kullanmak için sabitler
db.ROLES = ["user", "student", "teacher", "admin"];

module.exports = db;