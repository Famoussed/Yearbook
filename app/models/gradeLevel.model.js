module.exports = (sequelize, Sequelize) => {
  const GradeLevel = sequelize.define("grade_level", {
    name: {
      type: Sequelize.STRING // Örn: "9. Sınıf", "Hazırlık", "Lise Son"
    }
  });
  return GradeLevel;
};