module.exports = (sequelize, Sequelize) => {
    const License = sequelize.define("license", {
      license_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      used_by: {
        type: Sequelize.INTEGER, // User ID
        allowNull: true
      }
    });
  
    return License;
  };