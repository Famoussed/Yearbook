const db = require("../models");
const License = db.licenses;
const School = db.schools;
const User = db.users;

// Lisans Oluştur
exports.createLicense = async (req, res) => {
    try {
        const { school_id, count } = req.body;
        const quantity = parseInt(count) || 1;

        if (!school_id) {
            return res.status(400).send({ message: "Okul seçimi zorunludur!" });
        }

        const createdLicenses = [];

        for (let i = 0; i < quantity; i++) {
            // Rastgele Lisans Anahtarı: SCHOOLID-TIMESTAMP-RANDOM
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            const licenseKey = `LIS-${school_id}-${Date.now().toString().slice(-4)}-${randomPart}`;

            const license = await License.create({
                license_key: licenseKey,
                school_id: school_id,
                is_used: false
            });
            createdLicenses.push(license);
        }

        res.status(200).send({ 
            message: `${quantity} adet lisans başarıyla oluşturuldu.`, 
            licenses: createdLicenses 
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Lisansları Listele
exports.getAllLicenses = async (req, res) => {
    try {
        const licenses = await License.findAll({
            include: [
                { model: School, as: "school", attributes: ['name'] },
                { model: User, as: "user", attributes: ['fullname'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).send(licenses);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};