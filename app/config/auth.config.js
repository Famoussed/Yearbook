require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET,
  jwtExpiration: 3600,           // 1 Saat (Access Token ömrü - Kısa)
  jwtRefreshExpiration: 86400    // 24 Saat (Refresh Token ömrü - Uzun)
  /* Beni hatırla seçilirse bunu 30 gün yapabiliriz */
};