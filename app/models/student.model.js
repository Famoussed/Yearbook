module.exports = (sequelize, Sequelize) => {
  const Student = sequelize.define("student", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    school_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    grade_level_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    // Diğer bilgiler
    student_number: {
      type: Sequelize.STRING
    },
    class_info: {
      type: Sequelize.STRING
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false // Varsayılan: Onaysız
    }
  });

  return Student;
};