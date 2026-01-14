document.addEventListener("DOMContentLoaded", () => {
    // 1. Güvenlik Kontrolü
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || userData.role !== "ROLE_TEACHER") {
        window.location.href = '/login';
        return;
    }

    const annForm = document.getElementById('announcementForm');
    if (annForm) {
        annForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Form verisini al
            const formData = new FormData(annForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': localStorage.getItem('token')
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (response.ok) {
                    alert("✅ Duyuru başarıyla yayınlandı!");
                    // Modalı kapat ve formu temizle
                    bootstrap.Modal.getInstance(document.getElementById('createAnnouncementModal')).hide();
                    annForm.reset();
                } else {
                    alert("Hata: " + result.message);
                }
            } catch (err) {
                console.error(err);
                alert("Bir hata oluştu.");
            }
        });
    }

    // 2. İsmi Güncelle
    document.getElementById('teacherNameDisplay').innerText = userData.fullname;

    // 3. Menü Geçişlerini Başlat
    setupNavigation();

    // 4. Varsayılan Olarak Dashboard'u Yükle
    loadDashboardStats();
});

// --- MENÜ GEÇİŞLERİ ---
function setupNavigation() {
    const triggers = document.querySelectorAll('.nav-trigger');
    const panels = document.querySelectorAll('.content-section');

    triggers.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            // Aktif sınıfını değiştir
            triggers.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Panelleri değiştir
            const targetId = button.getAttribute('data-target');
            panels.forEach(panel => panel.classList.add('d-none'));

            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('d-none');

                // Panele özel verileri yükle
                if (targetId === 'panel-dashboard') loadDashboardStats();
                if (targetId === 'panel-approvals') loadPendingMemories();
                if (targetId === 'panel-students') loadStudents();
            }
        });
    });
}

// --- 1. DASHBOARD İSTATİSTİKLERİ ---
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/teacher/dashboard', { credentials: 'include' });
        const data = await response.json();

        document.getElementById('statTotalStudents').innerText = data.totalStudents;
        document.getElementById('statPendingMemories').innerText = data.pendingMemories;
        document.getElementById('statApprovedMemories').innerText = data.approvedMemories;

        // Bildirim rozeti
        const badge = document.getElementById('pendingCountBadge');
        if (data.pendingMemories > 0) {
            badge.innerText = data.pendingMemories;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }

    } catch (error) {
        console.error("Dashboard yüklenirken hata:", error);
    }
}

// --- 2. ONAY BEKLEYEN ANILAR (MODERN & TEMİZ HALİ) ---
async function loadPendingMemories() {
    const listContainer = document.getElementById('pendingMemoriesList');
    const template = document.getElementById('memoryCardTemplate'); // Şablonu seç

    // Yükleniyor animasyonu
    listContainer.innerHTML = '<div class="text-center py-5 text-white-50"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Yükleniyor...</p></div>';

    try {
        const response = await fetch('/api/teacher/pending-memories', { credentials: 'include' });
        const memories = await response.json();

        listContainer.innerHTML = ''; // Listeyi temizle

        if (memories.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-5 text-white-50"><i class="fas fa-check-circle fa-3x mb-3"></i><p>Onay bekleyen yazı yok. Harika!</p></div>';
            return;
        }

        memories.forEach(memory => {
            // 1. Şablonun bir kopyasını oluştur (Clone)
            const clone = template.content.cloneNode(true);

            // 2. Kopyanın içindeki elemanları bul ve veriyi doldur
            clone.querySelector('.sender-name').textContent = memory.sender.user.fullname;
            clone.querySelector('.receiver-name').textContent = memory.receiver.user.fullname;
            clone.querySelector('.memory-content').textContent = `"${memory.content}"`;

            // 3. Butonlara olay (click event) ekle
            // Not: onclick="..." yerine addEventListener daha modern ve güvenlidir
            const btnReject = clone.querySelector('.btn-reject');
            const btnApprove = clone.querySelector('.btn-approve');

            btnReject.onclick = () => decideMemory(memory.id, 'rejected');
            btnApprove.onclick = () => decideMemory(memory.id, 'approved');

            // 4. Hazırlanan kartı sayfaya ekle
            listContainer.appendChild(clone);
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="text-center text-danger">Bağlantı hatası!</div>';
    }
}

// ... (Diğer fonksiyonlar aynı) ...

// --- 3. ONAY/RED FONKSİYONU ---
async function decideMemory(memoryId, decision) {
    if (!confirm(decision === 'approved' ? "Bu yazıyı onaylıyor musun?" : "Bu yazıyı reddediyor musun?")) return;

    try {
        const response = await fetch('/api/teacher/approve-memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memory_id: memoryId, decision: decision }),
            credentials: 'include'
        });

        if (response.ok) {
            // Listeyi yenile
            loadPendingMemories();
            loadDashboardStats(); // İstatistikleri de güncelle
        } else {
            alert("Bir hata oluştu.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}

// --- GÜVENLİK FONKSİYONU ---
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

// --- 4. ÖĞRENCİ LİSTESİ ---
async function loadStudents() {
    const tableBody = document.getElementById('studentListTable');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-white-50">Yükleniyor...</td></tr>';

    try {
        const response = await fetch('/api/teacher/students', { credentials: 'include' });
        const students = await response.json();

        tableBody.innerHTML = '';

        if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-white-50">Öğrenci bulunamadı.</td></tr>';
            return;
        }

        students.forEach((student, index) => {
            const safeFullname = escapeHTML(student.fullname);
            const safeNumber = escapeHTML(student.number || "-");

            const row = document.createElement('tr');
            row.innerHTML = `
                <th scope="row" class="text-white">${index + 1}</th>
                <td class="text-white">${safeFullname}</td>
                <td class="text-white-50">${safeNumber}</td>
                <td><span class="badge bg-success rounded-pill">Aktif</span></td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Veri çekilemedi.</td></tr>';
    }
}

// Çıkış Fonksiyonu (Global)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '/login';
}