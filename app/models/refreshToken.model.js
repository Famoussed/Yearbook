const config = require("../config/auth.config");
const { v4: uuidv4 } = require("uuid"); // npm install uuid yapman gerekebilir

module.exports = (sequelize, Sequelize) => {
  const RefreshToken = sequelize.define("refreshToken", {
    token: {
      type: Sequelize.STRING,
    },
    expiryDate: {
      type: Sequelize.DATE,
    }
  });

  // Token oluşturma metodu
  RefreshToken.createToken = async function (user) {
    let expiredAt = new Date();
    
    // Süre: Şu anki zaman + Config'deki süre (saniye cinsinden)
    // Örnek: 86400 saniye (24 saat) veya 30 gün
    expiredAt.setSeconds(expiredAt.getSeconds() + config.jwtRefreshExpiration);

    let _token = uuidv4(); // Rastgele eşsiz bir string üretir

    let refreshToken = await this.create({
      token: _token,
      userId: user.id,
      expiryDate: expiredAt.getTime(),
    });

    return refreshToken.token;
  };

  // Süresi dolmuş mu kontrolü
  RefreshToken.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
  };

  return RefreshToken;
};