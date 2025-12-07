module.exports = (sequelize, Sequelize) => {
  const School = sequelize.define("school", {
    name: {
      type: Sequelize.STRING
    },
    city: {
      type: Sequelize.STRING
    }
  });
  return School;
};