const db = require("../models");
const Student = db.students;
const Teacher = db.teachers;
const Yearbook = db.yearbooks; // Yearbook modelini ekle

// PROFİL SAYFASI İÇİN İSTATİSTİKLERİ GETİR
exports.getProfileStats = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Öğrenciyi bul (Okul ID'sini almak için)
        const student = await Student.findOne({ where: { user_id: userId } });
        
        if (!student) {
            return res.status(404).send({ message: "Öğrenci profili bulunamadı." });
        }

        const schoolId = student.school_id;

        // Okuldaki toplam öğrenci sayısı
        const studentCount = await Student.count({ where: { school_id: schoolId } });

        // Okuldaki toplam öğretmen (Komite) sayısı
        const teacherCount = await Teacher.count({ where: { school_id: schoolId } });

        // Okulun Yıllığını Bul ve Durumunu Al
        const yearbook = await Yearbook.findOne({ where: { school_id: schoolId } });
        let yearbookStatus = 1; // Varsayılan: 1 (Hazırlık)
        
        if (yearbook && yearbook.YearBookStatus) {
            yearbookStatus = parseInt(yearbook.YearBookStatus);
        }

        res.status(200).send({
            studentCount: studentCount,
            teacherCount: teacherCount,
            yearbookStatus: yearbookStatus
        });

    } catch (err) {
        console.error("İstatistik Hatası:", err);
        res.status(500).send({ message: "İstatistikler alınamadı." });
    }
};