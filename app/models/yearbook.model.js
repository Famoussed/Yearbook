const { toDefaultValue, defaultValueSchemable } = require("sequelize/lib/utils");

module.exports = (sequelize, Sequelize) => {
    const YearBook = sequelize.define("yearbook", {
        EduDate: {
            //Öğrenim Yılı
            type: Sequelize.STRING,
            allowNull: false, //Zorunlu alan
            unique: false  //Benzersiz alan
        },
        YearBookName: {
            //Yıllık Adı
            type: Sequelize.STRING,
            allowNull: false, 
            unique: true 
        },
        YearBookCover: {
            //Kapak Tasarımı
            type: Sequelize.STRING,
            defaultValue: "Belirlenecek",
            allowNull: false,
            unique: false,
        },
        PageSizes: {
            //Sayfa Ebatları
            type: Sequelize.STRING,
            defaultValue: "Kare Yıllık",
            allowNull: false,
            unique: false
        },
        YearBookStatus: {
            //Yıllık Hangi Aşamada (1, 2, 3, 4)
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: false,
            defaultValue: 1, // Varsayılan durum: 1 (Hazırlık)
            validate: {
                isInt: {
                    msg: "Yıllık durumu sadece sayısal bir değer (1-4) olabilir."
                },
                min: 1,
                max: 4
            }
        },
        school_id: {
            //Bu userdaki school_id'nin aynısı aynı zamanda bizim FK'mız olucak
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true
        },
        PaperType: {
            //Kağıt Türü
            type: Sequelize.STRING,
            defaultValue: "Kuşe Kağıt",
            allowNull: false,
            unique: false
        },
        ResponsedPerson: {
            //Yıllık Sorumlusu
            type: Sequelize.STRING,
            defaultValue: "Öğretmen",
            allowNull: false,
            unique: false
        }


    });

    return YearBook;
};