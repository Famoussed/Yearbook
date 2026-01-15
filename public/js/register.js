document.addEventListener("DOMContentLoaded", () => {
    // 1. URL'den 'role' parametresini al
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const roleInput = document.getElementById('roleInput');
    
    const pageTitle = document.getElementById('pageTitle');
    const headerIcon = document.getElementById('headerIcon');
    const studentFields = document.getElementById('studentFields');
    const teacherFields = document.getElementById('teacherInfo'); // ID Düzeltildi

    // OKULLARI YÜKLE
    loadSchools();

    // 2. Rol Kontrolü ve Arayüz Ayarı
    if (role === 'student') {
        roleInput.value = 'student';

        if (pageTitle) pageTitle.innerText = 'Öğrenci Kaydı';
        if (headerIcon) headerIcon.innerHTML = '<i class="fas fa-user-graduate"></i>';

        if (studentFields) studentFields.classList.remove('hidden');
        if (teacherFields) teacherFields.classList.add('hidden');
    }
    else if (role === 'teacher') {
        roleInput.value = 'teacher';

        if (pageTitle) pageTitle.innerText = 'Öğretmen Kaydı';
        if (headerIcon) headerIcon.innerHTML = '<i class="fas fa-chalkboard-teacher"></i>';

        if (teacherFields) teacherFields.classList.remove('hidden');
        if (studentFields) studentFields.classList.add('hidden');
    }
    else {
        // Eğer rol parametresi yoksa veya hatalıysa seçim ekranına geri at
        window.location.href = '/register';
        return; // Kodun geri kalanını çalıştırma
    }

    // 3. Üniversite Seçimi Mantığı (Şube Gizleme)
    const gradeSelect = document.getElementById('grade_level_id');
    const classInput = document.getElementById('classInput');

    if (gradeSelect && classInput) {
        gradeSelect.addEventListener('change', function () {
            if (this.value === '4') {
                // 🔒 KİLİTLE
                classInput.disabled = true;      // Tıklanmasını ve yazılmasını engeller
                classInput.value = '';           // İçinde yazı varsa temizler
                classInput.placeholder = "Üniversite için gerekli değil"; // İpucu verir
                classInput.style.backgroundColor = "#e9ecef"; // Griye boya (Görsel geri bildirim)
                classInput.style.cursor = "not-allowed";      // Üzerine gelince 'yasak' işareti çıksın
            } else {
                // 🔓 KİLİDİ AÇ
                classInput.disabled = false;
                classInput.placeholder = "Şube (Örn: A, B, C vb.)"; // Eski haline getir
                classInput.style.backgroundColor = ""; // Rengi sıfırla
                classInput.style.cursor = "text";      // İmleci düzelt
            }
        });
    }

    // 4. Form Gönderme İşlemi (Submit)
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            // e olayı temsil eder. preventDefault olay tetiklendiğinde sayfanın yenilenmesini engeller
            e.preventDefault(); 

            const formData = new FormData(e.target); //Formdaki tüm verileri tarar
            const data = Object.fromEntries(formData.entries()); //formData'daki verileri JSON'a çevirir

            // Sayısal Dönüşümler
            if (data.school_id) data.school_id = parseInt(data.school_id);

            if (data.role === 'student' && data.grade_level_id) {
                data.grade_level_id = parseInt(data.grade_level_id);
            }

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('✅ Kayıt Başarılı! Giriş ekranına yönlendiriliyorsunuz.');
                    window.location.href = '/login';
                } else {
                    alert('❌ Hata: ' + result.message);
                }
            } catch (err) {
                console.error("Kayıt Hatası:", err);
                alert('Sunucuyla bağlantı kurulamadı!');
            }
        });
    }
});

// --- YARDIMCI FONKSİYONLAR ---

async function loadSchools() {
    const select = document.getElementById('schoolSelect');
    if (!select) return;

    try {
        const response = await fetch('/api/schools');
        const schools = await response.json();

        select.innerHTML = '<option value="" selected disabled>Okulunuzu Seçin</option>';

        if (schools.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.innerText = "Kayıtlı okul bulunamadı.";
            select.appendChild(opt);
            return;
        }

        schools.forEach(school => {
            const opt = document.createElement('option');
            opt.value = school.id;
            opt.innerText = `${school.name} (${school.city})`;
            select.appendChild(opt);
        });

    } catch (error) {
        console.error("Okullar yüklenemedi:", error);
        select.innerHTML = '<option value="" disabled>Okullar yüklenemedi!</option>';
    }
}