module.exports = (sequelize, Sequelize) => {
  const Tutorial = sequelize.define("tutorial", {
    // ID sütununu tanımlamaya gerek yok, Sequelize otomatik 'id' atar!
    
    title: {
      type: Sequelize.STRING 
    },
    description: {
      type: Sequelize.STRING
    },
    published: {
      type: Sequelize.BOOLEAN 
    }
  });

  return Tutorial;
};