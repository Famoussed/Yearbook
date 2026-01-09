const db = require("../models");
const Announcement = db.announcements;
const Teacher = db.teachers;
const Student = db.students;

// 1. DUYURU OLUŞTUR (Sadece Öğretmen)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Öğretmeni ve Okulunu Bul
    const teacher = await Teacher.findOne({ where: { user_id: req.userId } });
    if (!teacher) {
      return res.status(404).send({ message: "Öğretmen profili bulunamadı." });
    }

    // Duyuruyu Kaydet
    await Announcement.create({
      title: title,
      content: content,
      schoolId: teacher.school_id // Öğretmenin okuluyla ilişkilendir
    });

    res.status(200).send({ message: "Duyuru başarıyla yayınlandı." });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// 2. DUYURULARI GETİR (Öğrenci ve Öğretmen Görebilir)
exports.getAnnouncements = async (req, res) => {
  try {
    let schoolId;

    // İstek yapan kim? Öğrenci mi Öğretmen mi?
    // (Bunu anlamak için önce öğretmende ara, yoksa öğrencide ara)
    const teacher = await Teacher.findOne({ where: { user_id: req.userId } });
    
    if (teacher) {
        schoolId = teacher.school_id;
    } else {
        const student = await Student.findOne({ where: { user_id: req.userId } });
        if (student) schoolId = student.school_id;
    }

    if (!schoolId) {
        return res.status(403).send({ message: "Herhangi bir okula kaydınız yok." });
    }

    // O okula ait duyuruları getir (En yeni en üstte)
    const announcements = await Announcement.findAll({
      where: { schoolId: schoolId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).send(announcements);

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};