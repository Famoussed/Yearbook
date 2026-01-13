module.exports = (sequelize, Sequelize) => {
    const Photo = sequelize.define("photo", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING, // 'personal', 'class', 'extra'
        allowNull: false,
        defaultValue: 'personal'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });
  
    return Photo;
  };