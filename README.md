# MezunSoft — Dijital Yıllık Platformu (MVP)

> Geleneksel okul yıllığı hazırlama sürecini uçtan uca dijitalleştiren açık kaynak platform.
> Bu depo projenin **ilk sürümüdür (MVP)** — Node.js + Express ile yazıldı.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?logo=sequelize&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-B4CA65?logo=ejs&logoColor=black)

🎥 **Tanıtım videosu:** [YouTube](https://www.youtube.com/@ahmetselimcicek4327)

---

## Problem

Okulların mezuniyet yıllığı hazırlama süreci hâlâ büyük ölçüde manuel yürüyor: fotoğraflar
WhatsApp gruplarında toplanıyor, anılar kâğıtta yazılıyor, öğretmen hepsini tek tek derleyip
matbaaya gönderiyor. Süreç yavaş, takibi zor ve hata payı yüksek.

MezunSoft bu akışın tamamını tek bir platforma taşır: okul kaydolur, öğretmen yıllığı açar,
öğrenciler kendi fotoğraflarını ve birbirlerine yazdıkları anıları sisteme girer, öğretmen
onaylar, yıllık aşama aşama tamamlanır.

---

## Öne Çıkan Özellikler

| Alan | Ne yapıyor |
|---|---|
| **Rol tabanlı erişim** | `student` · `teacher` · `admin` — her rol kendi paneline düşer |
| **JWT + refresh token** | Access token httpOnly cookie'de; her istekte sessizce yenileniyor |
| **Lisans sistemi** | Öğretmen hesapları okula tanımlı lisans koduyla açılıyor |
| **Yıllık durum makinesi** | Her yıllık 4 aşamadan geçiyor (hazırlık → toplama → onay → baskı) |
| **Anı akışı** | Öğrenci sınıf arkadaşına anı yazar → öğretmen onaylar → yıllığa girer |
| **Fotoğraf yükleme** | `multer` ile sunucuya yükleme, öğrenciye bağlı fotoğraf kaydı |
| **Duyuru & bildirim** | Okul içi duyurular ve kullanıcı bildirimleri |
| **Okul & sınıf seviyesi** | İlkokul / Ortaokul / Lise / Üniversite / Kurumlar |

---

## Teknoloji Yığını

- **Runtime:** Node.js
- **Framework:** Express 5
- **ORM:** Sequelize 6 — SQLite
- **Görünüm:** EJS (sunucu taraflı render) + vanilla JS
- **Kimlik doğrulama:** `jsonwebtoken` + `bcryptjs` + `cookie-parser`
- **Dosya yükleme:** `multer`

---

## Kurulum

```bash
git clone https://github.com/Famoussed/Yearbook.git
cd Yearbook
npm install
```

`.env` dosyası oluştur:

```env
PORT=8080
```

İlk çalıştırmada varsayılan roller, sınıf seviyeleri ve örnek okul kaydı gerekir —
`server.js` içindeki `initial()` çağrısının yorumunu **bir kez** kaldırıp sunucuyu başlat,
sonra tekrar yorum satırına al.

```bash
npm start        # nodemon ile
```

Uygulama `http://localhost:8080` adresinde çalışır.

---

## Proje Yapısı

```
app/
├── config/         # veritabanı ve JWT ayarları
├── controllers/    # istek işleyicileri (auth, yearbook, memory, photo, ...)
├── middlewares/    # authJwt — token doğrulama ve rol kontrolü
├── models/         # Sequelize modelleri ve ilişkiler
└── routes/         # rota tanımları
public/             # statik dosyalar (css, js, yüklenen fotoğraflar)
views/              # EJS şablonları (panel sayfaları)
server.js           # uygulama girişi
```

---

## API Uç Noktaları (özet)

**Kimlik doğrulama**
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/refreshtoken
POST   /api/auth/logout
GET    /api/auth/check
```

**Yıllık & okul**
```
POST   /api/yearbook/create
GET    /api/yearbooks
POST   /api/school/create
GET    /api/schools
POST   /api/licenses/create
GET    /api/licenses
```

**Anılar**
```
GET    /api/memory/classmates
POST   /api/memory/create
GET    /api/memory/my-memories
GET    /api/memory/sent-memories
POST   /api/memory/approve-student
```

**Öğretmen paneli**
```
GET    /api/teacher/dashboard
GET    /api/teacher/pending-memories
POST   /api/teacher/approve-memory
GET    /api/teacher/students
```

**Fotoğraflar**
```
POST   /api/photos/upload
GET    /api/photos
DELETE /api/photos/:id
```

---

## Veri Modeli

```
School ──< GradeLevel
School ──< License ──> User
Role ──< User ──< Student ──< Photo
                  └──< Memory (yazan / alıcı)
School ──1 Yearbook
User ──< Notification, Announcement
```

---

## Bu Sürümün Yeri

Bu MVP, ürünün ne olması gerektiğini öğrenmek için yazıldı. Buradaki deneyim sonraki
sürümün mimari kararlarını belirledi:

| MVP'de öğrenilen | v2'de yapılan |
|---|---|
| Controller'lar iş mantığıyla şişti | Ayrı bir **Service** katmanı |
| Okul izolasyonu elle kontrol ediliyordu | Zorunlu `school_id` scope'u + kompozit indeksler |
| Sunucu taraflı EJS, mobil uygulamayı zorlaştırıyordu | Tek bir versiyonlu `/api/v1` yüzeyi + React SPA |
| Test yoktu | Servis, policy, API ve E2E test katmanları |

Devam sürümü Laravel 12 + React 19 + TypeScript ile yeniden yazıldı; incelemek isterseniz
[iletişime geçebilirsiniz](mailto:ahsecek@gmail.com).

---

## Lisans

Kişisel/eğitim amaçlı açık kaynak proje.

## İletişim

**Ahmet Selim Çiftci** — [GitHub](https://github.com/Famoussed) · [LinkedIn](https://www.linkedin.com/in/ahmet-selim-çiftci-51472035b) · [YouTube](https://www.youtube.com/@ahmetselimcicek4327)
