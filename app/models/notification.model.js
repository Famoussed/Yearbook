module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notification", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false
            // Bu bildirim kime gidecek? (User tablosundaki ID)
        },
        message: {
            type: Sequelize.STRING,
            allowNull: false
        },
        type: {
            type: Sequelize.STRING,
            defaultValue: "info"
            // Seçenekler: 'info' (mavi), 'success' (yeşil), 'error' (kırmızı)
            // Frontend'de rengi buna göre belirleriz.
        },
        is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
            // Okundu mu? Başlangıçta hayır.
        },
        link: {
            type: Sequelize.STRING,
            allowNull: true
            // İsteğin üzerine burayı BOŞ GEÇİLEBİLİR (NULL) yaptık.
            // İleride "/profile/memories#123" gibi linkler ekleyeceğiz.
        }
    });

    return Notification;
};