const bcrypt = require("bcryptjs");
const db = require("../models");
const User = db.users;
const config = require("../config/auth.config")
const jwt = require("jsonwebtoken");

exports.register = (req, res) => {
  // 1. Şifreleme İşlemi (Hashing)
  // bcrypt.hashSync(sifre, zorluk_seviyesi)
  // 8: Tuzlama (Salting) döngüsü. Sayı artarsa güvenlik artar ama işlem yavaşlar.
  const passwordHash = bcrypt.hashSync(req.body.password, 8);

  // 2. Kullanıcıyı Oluşturma
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: passwordHash //Passwordun hashli değeri buraya eklenir.
  })
    .then(user => {
      res.send({ message: "Kullanıcı başarıyla kaydedildi!" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//3. Kullanıcı giriş yapma fonksiyonu
exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(user => {
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

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 saat
      });

      res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken: token
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};