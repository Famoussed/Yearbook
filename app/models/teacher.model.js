module.exports = (sequelize, Sequelize) => {
  const Teacher = sequelize.define("teacher", {
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
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return Teacher;
};