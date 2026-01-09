module.exports = (sequelize, Sequelize) => {
  const Memory = sequelize.define("memory", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: Sequelize.TEXT, // Uzun yazılar olabilir o yüzden text kullanacağız.
      allowNull: false
    },
    teacher_status: {
      type: Sequelize.STRING,
      defaultValue: "pending", // pending, approved, rejected
      allowNull: false
    },
    student_status: {
      type: Sequelize.STRING,
      defaultValue: "pending", // pending, approved, rejected
      allowNull: false
    },
    // İlişkiler için FK alanları
    from_student_id: { //Gönderen Kullanıcı
      type: Sequelize.INTEGER,
      allowNull: false
    },
    to_student_id: { //Alan Kullanıcı 
      type: Sequelize.INTEGER,
      allowNull: false
    },
    yearbook_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });

  return Memory;
};