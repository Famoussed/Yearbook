document.addEventListener("DOMContentLoaded", () => {
    // Öğrenci bilgilerini çeken kısım
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
        window.location.href = "/login";
        return;
    }
    const user = JSON.parse(userDataString);

    // Yıllık Verilerini çeken kısım

    // 2. VERİLERİ DOLDUR (Render)
    fillUserData(user);

    // 3. MENÜ GEÇİŞ SİSTEMİ (Tab Switching) 🚀
    setupNavigation();
});

// Kullanıcı Bilgilerini Ekrana Yazan Fonksiyon
function fillUserData(user) {
    const username = document.getElementById('username');
    const schoolName = document.getElementById('schoolName');
    const userRole = document.getElementById('rolePanel');
    const gradeInfo = document.getElementById('gradeInfo');
    
    // Profilim sekmesindeki inputlar
    const inputFullname = document.getElementById('inputFullname');
    const inputEmail = document.getElementById('inputEmail');
    const inputStudentNumber = document.getElementById('inputStudentNumber');
    const inputClassInfo = document.getElementById('inputClassInfo');

    if(username) username.innerText = user.fullname;
    if(inputFullname) inputFullname.value = user.fullname;
    if(inputEmail) inputEmail.value = user.email;

    // Rol Kontrolü ve Metin Ayarlama
    let roleText = "Kullanıcı";
    if (user.role === "ROLE_STUDENT") roleText = "Öğrenci Paneli 🎓";
    else if (user.role === "ROLE_TEACHER") roleText = "Öğretmen Paneli 🍎";
    else if (user.role === "ROLE_ADMIN") roleText = "Yönetici Paneli 🛡️";
    if(userRole) userRole.innerText = roleText;

    // Öğrenciye Özel Bilgiler
    if (user.student_info) {
        if(schoolName) schoolName.innerText = user.student_info.school_name;
        if(gradeInfo) gradeInfo.innerText = `${user.student_info.grade_name || ""} / 2025-2026`;
        if(inputStudentNumber) inputStudentNumber.value = user.student_info.student_number || "-";
        if(inputClassInfo) inputClassInfo.value = user.student_info.class_info || "-";
    }

    // Yıllık Bilgileri Bölümü 

}

// Menü Tıklamalarını Yöneten Fonksiyon
function setupNavigation() {
    const triggers = document.querySelectorAll('.nav-trigger');
    const panels = document.querySelectorAll('.content-section');

    triggers.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Sayfanın en tepeye zıplamasını engelle

            // 1. Aktif Sınıfını Değiştir (Menü Rengi)
            triggers.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. Hedef Paneli Bul
            const targetId = button.getAttribute('data-target');
            
            // 3. Tüm Panelleri Gizle
            panels.forEach(panel => {
                panel.classList.add('d-none');
                panel.classList.remove('fade-in-active'); // Animasyon sınıfını sil
            });

            // 4. Hedef Paneli Göster
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.remove('d-none');
                // Minik bir gecikmeyle animasyon ekle (Opsiyonel)
                setTimeout(() => targetPanel.classList.add('fade-in-active'), 10);
            }
        });
    });
}