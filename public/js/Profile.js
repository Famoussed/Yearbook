document.addEventListener("DOMContentLoaded", () => {
    // 1. KULLANICI KONTROLÜ
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
        window.location.href = "/login";
        return;
    }
    const user = JSON.parse(userDataString);

    // 2. VERİLERİ DOLDUR
    fillUserData(user);

    // 3. MENÜ GEÇİŞ SİSTEMİ
    setupNavigation();

    // 4. BİLDİRİM SİSTEMİNİ BAŞLAT (YENİ EKLENEN KISIM) 🔔
    const btnNotifications = document.getElementById('btnNotifications');
    if (btnNotifications) {
        btnNotifications.addEventListener('click', loadNotifications);
    }

    // Sayfa açılır açılmaz okunmamış sayısı var mı bak
    checkUnreadCount();

    // Duyurular için gerkeli fonksiyon
    loadAnnouncements();
});

// --- MEVCUT FONKSİYONLARIN (AYNI KALDI) ---
function fillUserData(user) {
    const username = document.getElementById('username');
    const schoolName = document.getElementById('schoolName');
    const userRole = document.getElementById('rolePanel');
    const gradeInfo = document.getElementById('gradeInfo');

    const inputFullname = document.getElementById('inputFullname');
    const inputEmail = document.getElementById('inputEmail');
    const inputStudentNumber = document.getElementById('inputStudentNumber');
    const inputClassInfo = document.getElementById('inputClassInfo');

    if (username) username.innerText = user.fullname;
    if (inputFullname) inputFullname.value = user.fullname;
    if (inputEmail) inputEmail.value = user.email;

    let roleText = "Kullanıcı";
    if (user.role === "ROLE_STUDENT") roleText = "Öğrenci Paneli 🎓";
    else if (user.role === "ROLE_TEACHER") roleText = "Öğretmen Paneli 🍎";
    else if (user.role === "ROLE_ADMIN") roleText = "Yönetici Paneli 🛡️";
    if (userRole) userRole.innerText = roleText;

    if (user.student_info) {
        if (schoolName) schoolName.innerText = user.student_info.school_name;
        if (gradeInfo) gradeInfo.innerText = `${user.student_info.grade_name || ""} / 2025-2026`;
        if (inputStudentNumber) inputStudentNumber.value = user.student_info.student_number || "-";
        if (inputClassInfo) inputClassInfo.value = user.student_info.class_info || "-";
    }
}

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

// --- EKSİK OLAN BİLDİRİM FONKSİYONLARI (BURAYI EKLEDİK) ---

// 1. KIRMIZI BADGE KONTROLÜ
async function checkUnreadCount() {
    try {
        const response = await fetch('/api/notifications', {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (response.ok) {
            const notifs = await response.json();
            // Okunmamış (is_read: false veya 0) olanları say
            // Not: SQLite 0/1 döndürür, bu yüzden (!n.is_read) ikisini de yakalar
            const unreadCount = notifs.length; // Bizim sistemde "Listede varsa okunmamıştır" mantığı kurmuştuk.

            const badge = document.getElementById('notificationBadge');

            if (unreadCount > 0 && badge) {
                badge.innerText = unreadCount;
                badge.style.display = 'inline-block'; // Görünür yap

                // İkonu salla (Animasyon)
                const icon = document.querySelector('#btnNotifications i');
                if (icon) icon.classList.add('fa-shake');
            } else if (badge) {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        console.log("Bildirim sayısı alınamadı.");
    }
}

// 2. BİLDİRİMLERİ LİSTELE VE SİL
async function loadNotifications() {
    const modalElement = document.getElementById('notificationModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Animasyonu durdur
    const icon = document.querySelector('#btnNotifications i');
    if (icon) icon.classList.remove('fa-shake');

    const listContainer = document.getElementById('notificationList');
    listContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetch('/api/notifications', {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (!response.ok) throw new Error('Hata');

        const notifications = await response.json();
        listContainer.innerHTML = '';

        if (notifications.length === 0) {
            listContainer.innerHTML = '<div class="text-center p-4 text-muted">Hiç bildiriminiz yok.</div>';
            updateBadgeCount(0);
            return;
        }

        notifications.forEach(notif => {
            let icon = notif.type === 'error' ? 'fa-exclamation-circle text-danger' : 'fa-info-circle text-primary';
            const date = new Date(notif.createdAt).toLocaleDateString('tr-TR');
            const time = new Date(notif.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = `list-group-item list-group-item-action border-0 mb-2 shadow-sm bg-light`;
            item.style.cursor = "pointer";

            item.innerHTML = `
                <div class="d-flex w-100 align-items-center p-2">
                    <div class="me-3"><i class="fas ${icon} fa-2x"></i></div>
                    <div class="flex-grow-1">
                        <p class="mb-1 fw-bold small">${notif.message}</p>
                        <small class="text-muted" style="font-size:0.7rem">
                            <i class="far fa-clock me-1"></i>${date} - ${time}
                        </small>
                        <div class="text-end text-muted" style="font-size: 0.6rem;">
                            <i class="fas fa-trash-alt me-1"></i>Okudum, sil
                        </div>
                    </div>
                </div>
            `;

            // TIKLAYINCA SİLME İŞLEMİ
            item.addEventListener('click', async () => {
                // Görsel silme
                item.style.transition = "all 0.3s";
                item.style.opacity = "0";
                item.style.transform = "translateX(20px)";

                setTimeout(() => {
                    item.remove();
                    // Listeyi kontrol et, boşsa badge'i sıfırla
                    if (listContainer.children.length === 0) {
                        listContainer.innerHTML = '<div class="text-center p-4 text-muted">Tüm bildirimleri okudunuz.</div>';
                        updateBadgeCount(0);
                    } else {
                        decreaseBadgeCount();
                    }
                }, 300);

                // API silme
                try {
                    await fetch(`/api/notifications/${notif.id}`, {
                        method: 'DELETE',
                        headers: { 'x-access-token': localStorage.getItem('token') }
                    });
                } catch (err) { console.error("Silinemedi", err); }
            });

            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="text-center text-danger p-3">Bağlantı hatası.</div>';
    }
}

// Badge Yardımcıları
function updateBadgeCount(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function decreaseBadgeCount() {
    const badge = document.getElementById('notificationBadge');
    if (badge && badge.innerText) {
        let current = parseInt(badge.innerText);
        if (current > 0) updateBadgeCount(current - 1);
    }
}

// Announcement fonksiyonu
async function loadAnnouncements() {
    const container = document.querySelector('#panel-announcements');
    // Başlık (H4) kalsın, altındaki içerikleri temizleyip dolduracağız.
    // Ancak senin HTML yapında başlık panelin içinde. O yüzden sadece listeyi ekleyeceğimiz bir div oluştursan daha iyi olurdu.
    // Mevcut yapına göre şöyle yapalım:

    // Başlığı koru, içeriği temizle (biraz riskli ama pratik çözüm)
    const header = container.querySelector('h4'); // Başlığı al
    container.innerHTML = '';
    container.appendChild(header); // Başlığı geri koy

    try {
        const response = await fetch('/api/announcements', {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });
        const announcements = await response.json();

        if (announcements.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = "alert alert-light border text-center text-muted";
            emptyMsg.innerText = "Henüz yayınlanmış bir duyuru yok.";
            container.appendChild(emptyMsg);
            return;
        }

        announcements.forEach(ann => {
            const date = new Date(ann.createdAt).toLocaleDateString('tr-TR');

            const card = document.createElement('div');
            card.className = "alert alert-light border shadow-sm mb-3"; // Tasarımın aynısı
            card.innerHTML = `
                <small class="text-muted"><i class="far fa-calendar-alt me-1"></i>${date}</small>
                <h6 class="fw-bold mt-1 text-primary">${ann.title}</h6>
                <p class="small mb-0 text-dark">${ann.content}</p>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Duyurular yüklenemedi:", error);
        container.innerHTML += '<div class="text-danger small">Duyurular yüklenirken hata oluştu.</div>';
    }
}