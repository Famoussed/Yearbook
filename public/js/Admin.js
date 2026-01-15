document.addEventListener("DOMContentLoaded", () => {
    
    // 1. DASHBOARD VERİLERİNİ YÜKLE 🚀
    loadDashboardData();

    // 2. MENÜ GEÇİŞ SİSTEMİ (Mevcut kodun)
    setupNavigation();

    // 3. YILLIK OLUŞTURMA (Mevcut kodun)
    setupCreateYearbook();
    // 4. OKUL EKLEME 
    setupCreateSchool();
    // 5. LİSANS YÖNETİMİ 
    setupLicenseManagement();
});

// ... (Mevcut Fonksiyonlar) ...

// --- LİSANS YÖNETİMİ ---
function setupLicenseManagement() {
    const form = document.getElementById('createLicenseForm');
    
    // Okulları Yükle
    loadSchoolsForLicense();

    // Lisansları Yükle (Panel açıldığında yüklenmesi daha iyi olur ama şimdilik burada çağıralım)
    loadLicenses();

    // Buton Dinleyici (Panel açıldığında yüklemesi için)
    const btnLicense = document.querySelector('[data-target="panel-licenses"]');
    if (btnLicense) {
        btnLicense.addEventListener('click', () => {
            loadSchoolsForLicense();
            loadLicenses();
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.count = parseInt(data.count);
            data.school_id = parseInt(data.school_id);

            try {
                const response = await fetchWithAuth('/api/licenses/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (response.ok) {
                    alert("✅ " + result.message);
                    loadLicenses(); // Listeyi yenile
                } else {
                    alert("Hata: " + result.message);
                }
            } catch (error) {
                console.error(error);
                alert("Hata oluştu.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
}

async function loadSchoolsForLicense() {
    const select = document.getElementById('licenseSchoolSelect');
    if (!select) return;

    try {
        const response = await fetch('/api/schools'); // Public endpoint
        const schools = await response.json();

        select.innerHTML = '<option value="" disabled selected>Okul Seçin</option>';
        schools.forEach(school => {
            const opt = document.createElement('option');
            opt.value = school.id;
            opt.innerText = school.name;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error("Okullar yüklenemedi", error);
    }
}

async function loadLicenses() {
    const tbody = document.getElementById('licenseTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><i class="fas fa-spinner fa-spin"></i></td></tr>';

    try {
        const response = await fetchWithAuth('/api/licenses');
        const licenses = await response.json();

        tbody.innerHTML = '';
        if (licenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Kayıtlı lisans yok.</td></tr>';
            return;
        }

        licenses.forEach(lic => {
            const statusBadge = lic.is_used 
                ? '<span class="badge bg-danger">Kullanıldı</span>' 
                : '<span class="badge bg-success">Boşta</span>';
            
            const userText = lic.user ? escapeHTML(lic.user.fullname) : '-';
            const schoolName = lic.school ? escapeHTML(lic.school.name) : '-';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="font-monospace small">${lic.license_key}</td>
                <td>${schoolName}</td>
                <td>${statusBadge}</td>
                <td>${userText}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Hata oluştu.</td></tr>';
    }
}
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"/]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

// DASHBOARD VERİLERİNİ TOPLU YÜKLEME FONKSİYONU
async function loadDashboardData() {
    console.log("Dashboard verileri yükleniyor...");
    await loadYearbooks();
    // İleride buraya loadStats() gibi fonksiyonlar da eklenebilir.
}

// 1. MEVCUT YILLIKLARI LİSTELE
async function loadYearbooks() {
    const tableBody = document.getElementById('yearbookTableBody');
    tableBody.innerHTML = ''; // "Yükleniyor..." yazısını temizle

    try {
        const response = await fetchWithAuth('/api/yearbooks');
        const data = await response.json();

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-3">Henüz hiç yıllık oluşturulmamış.</td></tr>';
            return;
        }

        data.forEach((yb, index) => {
            const date = new Date(yb.createdAt).toLocaleDateString('tr-TR');
            const safeSchoolName = escapeHTML(yb.school ? yb.school.name : "Okul Bilgisi Yok");
            const safeYearbookName = escapeHTML(yb.YearBookName);
            const safeStatus = escapeHTML(yb.YearBookStatus || "Aktif");

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${safeSchoolName}</td>
                <td>${safeYearbookName}</td>
                <td><span class="badge bg-success">${safeStatus}</span></td>
                <td>${date}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Yıllıklar yüklenemedi:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Veriler yüklenemedi.</td></tr>';
    }
}

// --- MEVCUT NAVİGASYON KODLARIN (Değişmedi, sadece fonksiyon içine aldım düzenli olsun diye) ---
function setupNavigation() {
    const triggers = document.querySelectorAll('.nav-trigger');
    const panels = document.querySelectorAll('.content-section');

    triggers.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            triggers.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetId = button.getAttribute('data-target');
            panels.forEach(panel => {
                panel.classList.add('d-none');
                panel.classList.remove('fade-in-active'); 
            });
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('d-none');
                setTimeout(() => targetPanel.classList.add('fade-in-active'), 10);
            }
        });
    });
}

function setupCreateYearbook() {
    const createForm = document.getElementById('createYearbookForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const submitBtn = createForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

            const formData = new FormData(createForm);
            const data = Object.fromEntries(formData.entries());
            if(data.school_id) data.school_id = parseInt(data.school_id);

            try {
                const response = await fetchWithAuth('/api/yearbook/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });
                const result = await response.json();
                if (response.ok) {
                    alert("🎉 " + result.message);
                    createForm.reset();
                    loadDashboardData(); // 🚀 YENİ EKLENDİ: Tabloyu anında güncelle!
                } else {
                    alert("Hata: " + (result.message || "Bir sorun oluştu."));
                }
            } catch (error) {
                console.error("Hata:", error);
                alert("Sunucu hatası!");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

//OKUL OLUŞTURMA FONKSİYONU
function setupCreateSchool() {
    const createForm = document.getElementById('createSchoolForm');
    
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Butonu Kilitle
            const submitBtn = createForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';

            // Verileri Al
            const formData = new FormData(createForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetchWithAuth('/api/school/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });

                const result = await response.json();

                if (response.ok) {
                    // Başarılı Mesajı (ID'yi de gösterelim ki admin bilsin)
                    alert(`🎉 ${result.message}\nYeni Okul ID: ${result.school.id}`);
                    createForm.reset();
                } else {
                    alert("Hata: " + (result.message || "Bir sorun oluştu."));
                }

            } catch (error) {
                console.error("Hata:", error);
                alert("Sunucu hatası!");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}