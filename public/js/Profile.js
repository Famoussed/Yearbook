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

    // 4. BİLDİRİM SİSTEMİNİ BAŞLAT
    const btnNotifications = document.getElementById('btnNotifications');
    if (btnNotifications) {
        btnNotifications.addEventListener('click', loadNotifications);
    }

    // Sayfa açılır açılmaz okunmamış sayısı var mı bak
    checkUnreadCount();

    // Duyurular için gerkeli fonksiyon
    loadAnnouncements();

    // 5. ARKADAŞ ARAMA İÇİN EVENT LISTENER (YENİ)
    const searchInput = document.getElementById('searchFriend');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            filterStudents(searchTerm);
        });
    }
    
    // Arkadaş listesini çek (Sayfa yüklendiğinde arka planda çeksin, panel açılınca hazır olsun)
    fetchClassmates();
});

// --- GLOBAL DEĞİŞKENLER (PAGINATION İÇİN) ---
let allStudents = []; // Tüm öğrenci listesi burada tutulacak
let currentFilteredStudents = []; // Arama yapıldığında filtrelenmiş liste
const ITEMS_PER_PAGE = 5; // Sayfa başına kaç kişi?
let currentPage = 1;

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

// --- ARKADAŞ LİSTESİ VE PAGINATION ---

async function fetchClassmates() {
    try {
        const response = await fetch('/api/yearbook/classmates', {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (response.ok) {
            allStudents = await response.json();
            currentFilteredStudents = allStudents; // Başlangıçta hepsi
            currentPage = 1;
            renderPagination();
        } else {
            document.getElementById('classmatesList').innerHTML = '<div class="text-danger text-center">Liste yüklenemedi.</div>';
        }
    } catch (error) {
        console.error("Liste hatası:", error);
    }
}

function filterStudents(term) {
    const lowerTerm = term.toLowerCase();
    currentFilteredStudents = allStudents.filter(s => 
        s.user.fullname.toLowerCase().includes(lowerTerm)
    );
    currentPage = 1; // Arama yapınca ilk sayfaya dön
    renderPagination();
}

function renderPagination() {
    const listContainer = document.getElementById('classmatesList');
    const paginationContainer = document.getElementById('pagination-controls');
    
    listContainer.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (currentFilteredStudents.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-muted p-4">Öğrenci bulunamadı.</div>';
        return;
    }

    // Toplam Sayfa Sayısı
    const totalPages = Math.ceil(currentFilteredStudents.length / ITEMS_PER_PAGE);

    // Hangi aralıktaki öğrencileri göstereceğiz?
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = currentFilteredStudents.slice(start, end);

    // 1. LİSTEYİ OLUŞTUR
    pageItems.forEach(student => {
        const item = document.createElement('div');
        item.className = "glass-card p-3 mb-0 d-flex align-items-center justify-content-between";
        item.style.borderLeft = "4px solid var(--accent-color)";
        
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style="width:45px; height:45px; color:var(--accent-color); font-weight:bold;">
                    ${student.user.fullname.charAt(0)}
                </div>
                <div>
                    <h6 class="mb-0 fw-bold">${student.user.fullname}</h6>
                    <small class="text-muted">Öğrenci</small>
                </div>
            </div>
            <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="openWriteModal(${student.id}, '${student.user.fullname}')">
                <i class="fas fa-pen me-1"></i> Yaz
            </button>
        `;
        listContainer.appendChild(item);
    });

    // 2. SAYFALANDIRMA BUTONLARI (Eğer 1 sayfadan fazlaysa)
    if (totalPages > 1) {
        // Önceki Butonu
        const prevBtn = document.createElement('button');
        prevBtn.className = `btn btn-sm btn-light border rounded-circle ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = () => changePage(currentPage - 1);
        paginationContainer.appendChild(prevBtn);

        // Sayfa Numaraları
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm rounded-circle ${currentPage === i ? 'btn-primary' : 'btn-light border'}`;
            pageBtn.style.width = "32px";
            pageBtn.style.height = "32px";
            pageBtn.innerText = i;
            pageBtn.onclick = () => changePage(i);
            paginationContainer.appendChild(pageBtn);
        }

        // Sonraki Butonu
        const nextBtn = document.createElement('button');
        nextBtn.className = `btn btn-sm btn-light border rounded-circle ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => changePage(currentPage + 1);
        paginationContainer.appendChild(nextBtn);
    }
}

function changePage(newPage) {
    const totalPages = Math.ceil(currentFilteredStudents.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    renderPagination();
}

function openWriteModal(studentId, studentName) {
    document.getElementById('modalTargetId').value = studentId;
    document.getElementById('modalTargetName').innerText = studentName;
    
    const modal = new bootstrap.Modal(document.getElementById('writeMemoryModal'));
    modal.show();
}


// --- EKSİK OLAN BİLDİRİM FONKSİYONLARI ---

// 1. KIRMIZI BADGE KONTROLÜ
async function checkUnreadCount() {
    try {
        const response = await fetch('/api/notifications', {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (response.ok) {
            const notifs = await response.json();
            const unreadCount = notifs.length;

            const badge = document.getElementById('notificationBadge');

            if (unreadCount > 0 && badge) {
                badge.innerText = unreadCount;
                badge.style.display = 'inline-block';

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

            item.addEventListener('click', async () => {
                item.style.transition = "all 0.3s";
                item.style.opacity = "0";
                item.style.transform = "translateX(20px)";

                setTimeout(() => {
                    item.remove();
                    if (listContainer.children.length === 0) {
                        listContainer.innerHTML = '<div class="text-center p-4 text-muted">Tüm bildirimleri okudunuz.</div>';
                        updateBadgeCount(0);
                    } else {
                        decreaseBadgeCount();
                    }
                }, 300);

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

async function loadAnnouncements() {
    const container = document.querySelector('#panel-announcements');
    const header = container.querySelector('h4');
    container.innerHTML = '';
    container.appendChild(header);

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
            card.className = "alert alert-light border shadow-sm mb-3";
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
