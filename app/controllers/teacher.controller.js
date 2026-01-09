const db = require("../models");
const User = db.users;
const Teacher = db.teachers;
const Student = db.students;
const Memory = db.memories;
const Yearbook = db.yearbooks;
const Op = db.Sequelize.Op;
const Notification = db.notifications;

// 1. DASHBOARD VERİLERİNİ GETİR
exports.getDashboardData = async (req, res) => {
  try {
    // Öğretmeni ve Okulunu Bul
    const teacher = await Teacher.findOne({ where: { user_id: req.userId } });
    if (!teacher) return res.status(404).send({ message: "Öğretmen kaydı bulunamadı." });

    const schoolId = teacher.school_id;

    // A. Toplam Öğrenci Sayısı
    const totalStudents = await Student.count({ where: { school_id: schoolId } });

    // B. Okulun Yıllığını Bul
    const yearbook = await Yearbook.findOne({ where: { school_id: schoolId } });

    let pendingCount = 0;
    let approvedCount = 0;

    if (yearbook) {
      // C. Onay Bekleyen ve Onaylanmış Anı Sayıları
      pendingCount = await Memory.count({
        where: { yearbook_id: yearbook.id, teacher_status: "pending" }
      });
      approvedCount = await Memory.count({
        where: { yearbook_id: yearbook.id, teacher_status: "approved" }
      });
    }

    res.status(200).send({
      totalStudents: totalStudents,
      pendingMemories: pendingCount,
      approvedMemories: approvedCount
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// 2. ONAY BEKLEYEN ANILARI GETİR
exports.getPendingMemories = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { user_id: req.userId } });
    const yearbook = await Yearbook.findOne({ where: { school_id: teacher.school_id } });

    if (!yearbook) return res.status(200).send([]); // Yıllık yoksa boş döndür

    const pendingMemories = await Memory.findAll({
      where: {
        yearbook_id: yearbook.id,
        teacher_status: "pending"
      },
      include: [
        { model: Student, as: "sender", include: [{ model: User, as: "user", attributes: ["fullname"] }] },
        { model: Student, as: "receiver", include: [{ model: User, as: "user", attributes: ["fullname"] }] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).send(pendingMemories);

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// 3. ANIYI ONAYLA VEYA REDDET
// 3. ANIYI ONAYLA VEYA REDDET
exports.approveMemory = async (req, res) => {
  try {
    const memoryId = req.body.memory_id;
    const decision = req.body.decision; // 'approved' veya 'rejected'

    // 1. ADIM: Önce anıyı ve gönderen öğrenciyi bulalım
    // (Bildirim göndermek için sender.user_id'ye ihtiyacımız var)
    const memory = await Memory.findByPk(memoryId, {
      include: [
        {
          model: Student,
          as: "sender",
          attributes: ['user_id'] // Bize sadece user_id lazım
        },
        {
          model: Student,
          as: "receiver", // Anı kime yazıldı?
          include: [
            { model: User, as: "user", attributes: ["fullname"] } // Arkadaşının ismini al
          ]
        }
      ]
    });

    if (!memory) {
      return res.status(404).send({ message: "Anı bulunamadı." });
    }

    // 2. ADIM: Durumu güncelle
    // Memory.update yerine elimizdeki nesneyi güncelleyip kaydediyoruz
    memory.teacher_status = decision;
    await memory.save();

    // 3. ADIM: Bildirim Mantığı (Hook)
    if (decision === 'rejected') {
      // Artık 'memory' değişkeni tanımlı olduğu için hata vermeyecek
      console.log(`Bildirim Oluşturuluyor: User ${memory.sender.user_id} için.`);

      await Notification.create({
        user_id: memory.sender.user_id, // Anıyı yazan öğrencinin ID'si
        message: `${memory.receiver.fullname} için yazdığınız anı yazısı öğretmen tarafından uygunsuz bulunarak reddedildi.`,
        type: "error", // Frontend'de kırmızı renk için
        is_read: false
      });
    }

    res.status(200).send({ message: `İşlem başarılı: ${decision === 'approved' ? 'Onaylandı' : 'Reddedildi'}` });

  } catch (err) {
    console.error("approveMemory Hatası:", err); // Hatayı konsola yazdıralım ki görelim
    res.status(500).send({ message: "Sunucu hatası oluştu." });
  }
};

// 4. SINIF LİSTESİNİ GETİR
exports.getStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { user_id: req.userId } });

    const students = await Student.findAll({
      where: { school_id: teacher.school_id },
      include: [{ model: User, as: "user", attributes: ["fullname"] }]
    });

    // Her öğrenci için basit bir liste formatı hazırla
    const studentList = students.map(s => ({
      id: s.id,
      number: s.student_number,
      fullname: s.user.fullname,
      // İleride buraya anı sayıları da eklenebilir
    }));

    res.status(200).send(studentList);

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};