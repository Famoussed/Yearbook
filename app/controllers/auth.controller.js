const db = require("../models");
const config = require("../config/auth.config");
const User = db.users;
const Role = db.roles;
const Student = db.students;
const Teacher = db.teachers;
const School = db.schools;
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
  // Giriş için bilgileri sorgula
  User.findOne({
    where: { email: req.body.email },
    include: ["role"]
  })
    .then(async user => {
      if (!user) {
        return res.status(404).send({ message: "Kullanıcı bulunamadı." });
      }

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

      // 1. Access Token (Kısa ömürlü)
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration,
      });

      // 2. Refresh Token (Uzun ömürlü)
      // DÜZELTME 2: En tepede tanımladğimiz 'RefreshToken' modelini kullanıyoruz.
      let refreshTokenData = await RefreshToken.createToken(user);

      var authority = "ROLE_" + user.role.name.toUpperCase();

      // 1. Access Token Cookie Ayarı
      res.cookie('accessToken', token, {
        httpOnly: true, // JS okuyamaz (Güvenlik)
        secure: false,  // Localhost'ta false, Canlıda (HTTPS) true olmalı
        sameSite: 'strict', // CSRF koruması için
        maxAge: 3600000 // 1 Saat (Milisaniye) 
      });

      // 2. Refresh Token Cookie Ayarı
      res.cookie('refreshToken', refreshTokenData, { // createToken fonksiyonunun dönüş değerine dikkat et
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 864000000 // 240 Saat 
      });

      res.status(200).send({
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: authority,
        // accessToken: token,
        // refreshToken: refreshTokenData
        // tokenleri yukarıda cookie içerisine aldım test aşaması bitene kadar bu yorum satırı kalsın
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
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

