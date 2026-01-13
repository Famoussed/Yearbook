const db = require("../models");
const config = require("../config/auth.config");
const User = db.users;
const Role = db.roles;
const Student = db.students;
const Teacher = db.teachers;
const School = db.schools;
const GradeLevel = db.gradeLevels
const RefreshToken = db.refreshToken;

const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  // Transaction Başlat
  const t = await db.sequelize.transaction();

  try {
    // 1. ADIM: Rolü Belirle
    let roleName = req.body.role || "user";

    const role = await Role.findOne({ where: { name: roleName } });

    if (!role) {
      throw new Error("Belirtilen rol sistemde bulunamadı!");
    }

    // 2. ADIM: Şifreyi Hashle
    const passwordHash = bcrypt.hashSync(req.body.password, 8);

    // 3. ADIM: User'ı oluştur
    const user = await User.create({
      role_id: role.id,
      fullname: req.body.fullname,
      email: req.body.email,
      password: passwordHash,
      tckn: req.body.tckn,
      status: true
    }, { transaction: t });

    // 4. ADIM: Profil Tablolarını Doldur
    if (roleName === "student") {
      await Student.create({
        user_id: user.id,
        school_id: req.body.school_id,
        grade_level_id: req.body.grade_level_id,
        student_number: req.body.student_number,
        class_info: req.body.class_info
      }, { transaction: t });

    } else if (roleName === "teacher") {
      await Teacher.create({
        user_id: user.id,
        school_id: req.body.school_id,
        is_verified: false
      }, { transaction: t });
    }

    // 5. Transaction Onayla
    await t.commit();

    res.send({ message: "Kayıt başarıyla tamamlandı!" });

  } catch (error) {
    // Hata durumunda geri al (rollback)
    await t.rollback();
    res.status(500).send({ message: error.message });
  }
};

exports.signin = (req, res) => {
  // Kullanıcıyı ararken tüm akrabalarını da (Role, Student, School, GradeLevel) çağırıyoruz
  User.findOne({
    where: { email: req.body.email },
    include: [
      {
        model: Role,
        as: "role" // User -> Role ilişkisi
      },
      {
        model: Student,
        as: "student_profile", // User -> Student (models/index.js'deki 'as' ile aynı olmalı)
        required: false, // Öğrenci değilse de (Admin/Öğretmen) kullanıcı gelsin diye false yapıyoruz
        include: [
          // Öğrenci tablosunun bağlı olduğu diğer tablolar
          {
            model: School,
            as: "school" // Student -> School ilişkisi
          },
          {
            model: GradeLevel,
            as: "grade_level" // Student -> GradeLevel ilişkisi
          }
        ]
      },

      {
        model: Teacher, // Dosyanın başında const Teacher = db.teachers; dediğine emin ol
        as: "teacher_profile", // index.js'deki isimle AYNI olmak zorunda
        required: false, // ÇOK ÖNEMLİ: Eğer kullanıcı öğretmen değilse (öğrenciyse) sorgu patlamasın diye false yapıyoruz.
        include: [
          // İstersen öğretmenin okulunu da çekebilirsin
          { model: School, as: "school" }
        ]
      }

    ]
  })
    .then(async user => {
      if (!user) {
        return res.status(404).send({ message: "Kullanıcı bulunamadı." });
      }

      // Şifre Doğrulama
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Geçersiz Şifre!"
        });
      }

      // Token Üretimi
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration, // 1 Saat
      });

      let refreshTokenData = await RefreshToken.createToken(user);
      var authority = "ROLE_" + user.role.name.toUpperCase();

      // Cookie Ayarları
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: false, // Canlıda (HTTPS) true olmalı
        sameSite: 'strict',
        maxAge: 3600000 // 1 Saat
      });

      res.cookie('refreshToken', refreshTokenData, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 864000000 // 10 Gün
      });

      // --- CEVAP (RESPONSE) HAZIRLAMA --- 

      // 1. Standart Kullanıcı Bilgileri
      let responseData = {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: authority,
      };

      // 2. Eğer bu kişi bir ÖĞRENCİ ise, detayları ekle
      // user.student_profile verisi geldiyse, bu kişi öğrencidir.
      if (user.student_profile) {
        responseData.student_info = {
          student_number: user.student_profile.student_number,
          class_info: user.student_profile.class_info, // Örn: "A Şubesi"

          // İlişkili tablolardan gelen veriler (?. ile güvenli erişim)
          // Eğer okul veya sınıf silinmişse uygulama çökmesin diye kontrol ediyoruz
          school_name: user.student_profile.school ? user.student_profile.school.name : "Okul Bilgisi Yok",
          grade_name: user.student_profile.grade_level ? user.student_profile.grade_level.name : "Sınıf Bilgisi Yok",

          // İleride lazım olur diye ID'leri de yollayalım
          school_id: user.student_profile.school_id,
          grade_id: user.student_profile.grade_level_id
        };
      }

      if (user.teacher_profile) {
        responseData.teacher_info = {
          school_name: user.teacher_profile.school ? user.teacher_profile.school.name : "Okul Bilgisi Yok",
          school_id: user.teacher_profile.school_id,
        };
      }

      // 3. Frontend'e Paketi Gönder
      res.status(200).send(responseData);
    })
    .catch(err => {
      res.status(500).send({ message: "Giriş hatası: " + err.message });
    });
};



//Çıkış yapma fonksiyonu
exports.signout = async (req, res) => {
  try {
    // 1. Refresh Token'ı Cookie'den okuyoruz (Body'den değil!)
    // Çünkü frontend artık body içinde göndermiyor, cookie ile otomatik geliyor.
    const refreshToken = req.cookies.refreshToken;

    // Eğer cookie içinde token varsa, veritabanından da silelim (Temizlik)
    if (refreshToken) {
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }

    // 2. KRİTİK NOKTA: Tarayıcıya "Cookie'leri Sil" emri veriyoruz 🧹
    // Bu komutlar tarayıcıya "Set-Cookie: accessToken=; Max-Age=0" başlığı yollar.
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    // 3. Cevap Dönüyoruz
    return res.status(200).send({
      message: "Başarıyla çıkış yapıldı! Cookie'ler temizlendi."
    });

  } catch (err) {
    // Hata olsa bile güvenlik için cookie'leri temizlemeye çalışıyoruz
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(500).send({ message: "Çıkış sırasında hata: " + err.message });
  }
};



//cookienin varlığını sürekli teyit eden fonksiyon
//bu fonksiyon sayesinde cookienin süresi dolduğunda frontend buna göre sayfayı düzenleyecek
//bunu yapmasaydık cookieler expired olmasına rağmen userData varlığını korumaya devam ederdi tarayıcı içerisinde
exports.checkSession = (req, res) => {
  // Eğer buraya kadar gelebildiyse, Middleware (verifyToken) zaten onay vermiştir.
  // Yani token sağlamdır.
  res.status(200).send({
    status: "OK",
    userId: req.userId,
    message: "Oturum geçerli."
  });


};

//RefreshToken ile AccesTokeni yenileme fonksiyonu
exports.refreshToken = async (req, res) => {
  const requestToken = req.cookies.refreshToken;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh Token bulunamadı!" });
  }

  try {
    // 1. Veritabanından bu tokenı bul
    let refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh Token veritabanında yok!" });
    }

    // 2. Süresi geçmiş mi kontrol et
    if (RefreshToken.verifyExpiration(refreshToken)) {
      // Geçmişse sil ve hata dön
      RefreshToken.destroy({ where: { id: refreshToken.id } });

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(403).json({
        message: "Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.",
      });
    }

    // 3. Her şey yolunda! Yeni Access Token üret
    const user = await refreshToken.getUser();

    let newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || config.secret, {
      expiresIn: config.jwtExpiration, // 1 Saat
    });

    // 4. Yeni Access Token'ı Cookie'ye yaz
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false, // Canlıda true
      sameSite: 'strict',
      maxAge: 3600000 // 1 Saat
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      message: "Token başarıyla yenilendi!",
    });

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};