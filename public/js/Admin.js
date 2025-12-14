document.addEventListener("DOMContentLoaded", () => {
    
    // 1. DASHBOARD VERİLERİNİ YÜKLE 🚀
    loadDashboardData();

    // 2. MENÜ GEÇİŞ SİSTEMİ (Mevcut kodun)
    setupNavigation();

    // 3. YILLIK OLUŞTURMA (Mevcut kodun)
    setupCreateYearbook();
    // 4. OKUL EKLEME 
    setupCreateSchool();
});

// --- YENİ EKLENEN: TABLOYU DOLDURMA FONKSİYONU ---
function loadDashboardData() {
    const tableBody = document.getElementById('yearbooksTableBody');
    if (!tableBody) return;

    fetch('/api/yearbooks')
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ''; // "Yükleniyor..." yazısını temizle

            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-3">Henüz hiç yıllık oluşturulmamış.</td></tr>';
                return;
            }

            data.forEach(yearbook => {
                const row = document.createElement('tr');
                
                // Tarihi güzel formatla (Örn: 14 Ara 2025)
                const date = new Date(yearbook.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

                // Duruma göre renk ver
                let statusBadge = `<span class="status-badge status-pending">${yearbook.YearBookStatus}</span>`;
                if (yearbook.YearBookStatus === 'Yayında') {
                    statusBadge = `<span class="status-badge status-active">${yearbook.YearBookStatus}</span>`;
                }

                // Okul Adı Kontrolü (Silinmiş okul hatası vermesin diye)
                const schoolName = yearbook.school ? yearbook.school.name : '<span class="text-danger">Okul Silinmiş</span>';

                row.innerHTML = `
                    <td class="fw-bold">${schoolName}</td>
                    <td>${yearbook.ResponsedPerson}</td>
                    <td>${date}</td>
                    <td>${statusBadge}</td>
                    <td class="fw-bold text-primary">${yearbook.YearBookName}</td> 
                `;
                // 👆 Son sütuna Yıllık Adını koyduk
                
                tableBody.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Veri hatası:', err);
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Veriler yüklenemedi.</td></tr>';
        });
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
                const response = await fetch('/api/yearbook/create', {
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
                const response = await fetch('/api/school/create', {
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