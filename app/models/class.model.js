module.exports = (sequelize, Sequelize) => {
  const Class = sequelize.define("class", {
    YearBookID: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,

    },
    ClassID: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
    }
  });

  return Class;
};