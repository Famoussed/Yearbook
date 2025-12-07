module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    // ID en başta
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullname: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false
    },
    role_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    tckn: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  });

  return User;
};