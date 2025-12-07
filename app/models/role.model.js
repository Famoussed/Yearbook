module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("role", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING // user, student, teacher, admin
    }
  });
  return Role;
};