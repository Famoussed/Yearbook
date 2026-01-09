const db = require("../models");
const Notification = db.notifications;

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.userId }, // Sadece giriş yapan kullanıcının bildirimleri
      order: [['createdAt', 'DESC']] // En yeniden eskiye sırala
    });

    res.status(200).send(notifications);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// (Opsiyonel) Bildirimi okundu olarak işaretleme
exports.deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    // Sadece bildirimin sahibi silebilir! (Güvenlik)
    const num = await Notification.destroy({
      where: { id: id, user_id: userId }
    });

    if (num == 1) {
      res.send({ message: "Bildirim silindi." });
    } else {
      res.send({ message: "Bildirim silinemedi veya zaten yok." });
    }
  } catch (err) {
    res.status(500).send({ message: "Sunucu hatası." });
  }
};