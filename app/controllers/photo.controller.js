const db = require("../models");
const Photo = db.photos;
const Student = db.students;
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// --- MULTER AYARLARI (Dosya Yükleme) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads/photos');
        // Klasör yoksa oluştur
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Dosya ismini benzersiz yap: timestamp + orijinal isim
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|heic/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir (jpeg, jpg, png)!'));
    }
}).single('photo'); // Frontend'de form name="photo" olmalı

// 1. FOTOĞRAF YÜKLEME
exports.uploadPhoto = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).send({ message: "Lütfen bir dosya seçin." });
        }

        try {
            const userId = req.userId;
            const category = req.body.category || 'personal'; // personal, class, extra

            // Öğrenciyi bul
            const student = await Student.findOne({ where: { user_id: userId } });
            if (!student) {
                // Dosyayı sil (boşa yer kaplamasın)
                fs.unlinkSync(req.file.path);
                return res.status(404).send({ message: "Öğrenci profili bulunamadı." });
            }

            // LİMİT KONTROLÜ
            const count = await Photo.count({ 
                where: { 
                    student_id: student.id, 
                    category: category 
                } 
            });

            let limit = 0;
            if (category === 'personal') limit = 4;
            else if (category === 'class') limit = 20;
            else if (category === 'extra') limit = 100; // Şimdilik yüksek verelim

            if (count >= limit) {
                // Dosyayı sil
                fs.unlinkSync(req.file.path);
                return res.status(400).send({ message: `Bu kategori için yükleme limitine ulaştınız (${limit} adet).` });
            }

            // Veritabanına kaydet
            // URL olarak public klasöründen sonraki kısmı kaydediyoruz
            const photoUrl = '/uploads/photos/' + req.file.filename;

            await Photo.create({
                student_id: student.id,
                url: photoUrl,
                category: category,
                description: req.body.description || ""
            });

            res.status(200).send({ message: "Fotoğraf başarıyla yüklendi.", url: photoUrl });

        } catch (error) {
            // Hata durumunda yüklenen dosyayı temizle
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).send({ message: error.message });
        }
    });
};

// 2. FOTOĞRAFLARI GETİR
exports.getMyPhotos = async (req, res) => {
    try {
        const category = req.query.category || 'personal';
        const student = await Student.findOne({ where: { user_id: req.userId } });
        
        if (!student) return res.status(404).send({ message: "Öğrenci bulunamadı." });

        const photos = await Photo.findAll({
            where: {
                student_id: student.id,
                category: category
            },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).send(photos);

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 3. FOTOĞRAF SİL
exports.deletePhoto = async (req, res) => {
    try {
        const photoId = req.params.id;
        const student = await Student.findOne({ where: { user_id: req.userId } });

        const photo = await Photo.findOne({
            where: { id: photoId, student_id: student.id }
        });

        if (!photo) return res.status(404).send({ message: "Fotoğraf bulunamadı." });

        // 1. Dosya sisteminden sil
        // photo.url: "/uploads/photos/xyz.jpg" -> Tam yolunu bulmalıyız
        const filePath = path.join(__dirname, '../../public', photo.url);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 2. Veritabanından sil
        await photo.destroy();

        res.status(200).send({ message: "Fotoğraf silindi." });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};