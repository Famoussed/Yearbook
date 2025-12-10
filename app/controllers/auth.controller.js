const db = require("../models");
const config = require("../config/auth.config");
const User = db.users;
const Role = db.roles;
const Student = db.students;
const Teacher = db.teachers;
const School = db.schools;
// DÜZELTME 1: Model ismini Büyük Harfle (PascalCase) başlattık ki aşağıda karışmasın
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

      res.status(200).send({
        id: user.id,
        email: user.email,
        tckn: user.tckn,
        role: authority,
        accessToken: token,
        refreshToken: refreshTokenData // Oluşturulan token verisi
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};