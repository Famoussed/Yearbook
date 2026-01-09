module.exports = (sequelize, Sequelize) => {
  const Announcement = sequelize.define("announcements", {
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    // Hangi okul için olduğu (school_id) ilişki ile eklenecek
    // Hangi öğretmenin yazdığı (teacher_id) ilişki ile eklenecek (opsiyonel ama iyi olur)
  });

  return Announcement;
};