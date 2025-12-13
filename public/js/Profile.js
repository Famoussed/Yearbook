document.addEventListener("DOMContentLoaded", () => {
    // 1. Veriyi Oku
    const userDataString = localStorage.getItem('userData');
    
    if (!userDataString) {
        // Veri yoksa login'e at (Güvenlik)
        window.location.href = "/login";
        return;
    }

    const user = JSON.parse(userDataString);

    // 2. HTML Elemanlarını Bul
    const username = document.getElementById('username');
    const schoolName = document.getElementById('schoolName');
    const userRole = document.getElementById('rolePanel');

    // 3. Verileri Yerleştir
    if(username) username.innerText = user.fullname;

    if(schoolName) schoolName.innerText = user

    // 4. Rolü Güzelleştir (ROLE_STUDENT -> Öğrenci)
    if(userRole) {
        let roleText = "Kullanıcı";
        if (user.role === "ROLE_STUDENT") roleText = "Öğrenci Paneli 🎓";
        if (user.role === "ROLE_TEACHER") roleText = "Öğretmen Paneli 🍎";
        if (user.role === "ROLE_ADMIN") roleText = "Yönetici Paneli 🛡️";
        
        userRole.innerText = roleText;
    }
});