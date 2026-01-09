const db = require("../models");
const Memory = db.memories;
const Student = db.students;
const User = db.users; // İsimleri çekmek için lazım

// 1. SINIF ARKADAŞLARINI GETİR (Listeleme İçin)
exports.getClassmates = async (req, res) => {
    try {
        // A. Giriş yapan öğrenciyi bul
        const currentStudent = await Student.findOne({ where: { user_id: req.userId } });

        if (!currentStudent) {
            return res.status(404).send({ message: "Öğrenci profili bulunamadı." });
        }

        // B. Aynı okuldaki DİĞER öğrencileri bul
        const classmates = await Student.findAll({
            where: {
                school_id: currentStudent.school_id, // Aynı okul
                id: { [db.Sequelize.Op.ne]: currentStudent.id } // Kendisi hariç (Not Equal)
            },
            include: [{
                model: User,
                as: "user",
                attributes: ["fullname"] // Sadece ismini al
            }]
        });

        // C. Frontend için temiz bir liste hazırla
        const cleanList = classmates.map(s => ({
            student_id: s.id,
            fullname: s.user.fullname,
            student_number: s.student_number,
            class_info: s.class_info
        }));

        res.status(200).send(cleanList);

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.createMemory = async (req, res) => {
    try {
        const sender = await Student.findOne({
            where: { user_id: req.userId },
            include: ["school"]
        });

        // A. OKUL/YILLIK KONTROLÜ
        const yearbook = await db.yearbooks.findOne({
            where: { school_id: sender.school_id }
        });
        if (!yearbook) {
            return res.status(400).send({ message: "Okulunuzun aktif bir yıllığı bulunmuyor!" });
        }

        // B. "DAHA ÖNCE YAZMIŞ MI?" KONTROLÜ (YENİ) 🛑
        const existingMemory = await Memory.findOne({
            where: {
                from_student_id: sender.id,
                to_student_id: req.body.to_student_id
            }
        });

        if (existingMemory) {
            return res.status(400).send({ message: "Bu arkadaşına zaten bir anı yazısı yazdın! Sadece 1 hakka sahipsin." });
        }

        // C. KAYIT (Yeni statüslerle)
        await Memory.create({
            content: req.body.content,
            from_student_id: sender.id,
            to_student_id: req.body.to_student_id,
            yearbook_id: yearbook.id,
            teacher_status: "pending", // Öğretmen onayı bekliyor
            student_status: "pending"  // Öğrenci (Alıcı) onayı bekliyor
        });

        res.status(200).send({ message: "Anı yazınız gönderildi! Onay süreçlerinden sonra yayınlanacak." });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// app/controllers/memory.controller.js dosyasının en altına ekle:

// 4. ANIYI GÜNCELLE
exports.updateMemory = async (req, res) => {
  try {
    const memoryId = req.params.id;
    const { content } = req.body;
    const userId = req.userId; // Middleware'den gelen giriş yapmış kullanıcı ID'si

    // 1. Önce anıyı bul ve yetki kontrolü yap
    // Anıyı sadece YAZAN kişi güncelleyebilir.
    const memory = await Memory.findOne({
      where: { 
        id: memoryId
      },
      include: [
        { model: Student, as: "sender", where: { user_id: userId } } 
      ]
    });

    if (!memory) {
      return res.status(404).send({ message: "Anı bulunamadı veya bu anıyı düzenleme yetkiniz yok." });
    }

    // 2. Eğer anı zaten onaylanmışsa (approved) düzenlenmesine izin verelim mi?
    // Genelde onaylanmış yazıların değişmesi istenmez ama senin kuralına göre
    // tekrar onaya düşeceği için sorun yok.
    
    // 3. Güncelleme İşlemi
    memory.content = content;
    
    // KRİTİK NOKTA: Statüleri sıfırlıyoruz ki tekrar onaya düşsün
    memory.teacher_status = "pending"; 
    memory.student_status = "pending";

    await memory.save();

    res.status(200).send({ message: "Anı güncellendi ve tekrar onaya gönderildi." });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// 3. BANA GELEN ANILARI GETİR (GÜNCELLENDİ)
exports.getMyMemories = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { user_id: req.userId } });

        const memories = await Memory.findAll({
            where: {
                to_student_id: student.id,
                // İstersen sadece öğretmenin onayladıklarını göster:
                // teacher_status: "approved" 
            },
            include: [{
                model: Student,
                as: "sender",
                include: [{ model: User, as: "user", attributes: ["fullname"] }]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).send(memories);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 4. BENİM YAZDIKLARIM (GÜNCELLENDİ - Sadece statüs isimleri değişti)
exports.getSentMemories = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { user_id: req.userId } });
        const memories = await Memory.findAll({
            where: { from_student_id: student.id },
            include: [{
                model: Student,
                as: "receiver",
                include: [{ model: User, as: "user", attributes: ["fullname"] }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(memories);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 5. ÖĞRENCİ ONAYI
exports.approveByStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { user_id: req.userId } });
        const memoryId = req.body.memory_id;
        const decision = req.body.decision; // 'approved' veya 'rejected' gelecek

        // Sadece kendine gelen ve o anıyı bul
        const memory = await Memory.findOne({
            where: {
                id: memoryId,
                to_student_id: student.id
            }
        });

        if (!memory) {
            return res.status(404).send({ message: "Anı bulunamadı veya size ait değil." });
        }

        // Güncelle
        memory.student_status = decision;
        await memory.save();

        res.status(200).send({ message: `İşlem başarılı: ${decision === 'approved' ? 'Onaylandı' : 'Reddedildi'}` });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};