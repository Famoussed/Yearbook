document.addEventListener("DOMContentLoaded", () => {
    const userDataString = localStorage.getItem('userData');
    const signinButton = document.getElementById("signinButton");
    const registerButton = document.getElementById("registerButton");
    const navbarItems = document.getElementById("navbarItems");
    const profileIcon = document.getElementById('userProfileContainer');
    const exitButton = document.getElementById("exitButton");

    // --- LANDING PAGE AYARLARI ---
    if (userDataString) {
        if (signinButton) signinButton.style.display = 'none';
        if (registerButton) registerButton.style.display = 'none';
        
        if (profileIcon) {
            profileIcon.classList.remove("d-none");
            profileIcon.style.marginLeft = "auto";
        }
    }

    // --- PROFILE PAGE AYARLARI ---
    if (userDataString) {
        try {
            const user = JSON.parse(userDataString);
            if (user.role_id == 1) {
                // Öğrenciye özel işlemler...
            }
        } catch (e) {
            console.error("User parse hatası:", e);
        }
    }

    // ÇIKIŞ YAPMA İŞLEMİ
    if (exitButton) {
        exitButton.addEventListener("click", async (e) => {
            console.log("Çıkış butonuna tıklandı");
            e.preventDefault(); 

            if (!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;

            try {
                // ARTIK COOKIE KULLANIYORUZ
                // Body içinde refreshToken göndermeye gerek yok.
                // credentials: 'include' yeterli.
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include' 
                });
            } catch (error) {
                console.error("Çıkış hatası (Backend):", error);
            } finally {
                // Temizlik
                localStorage.removeItem('userData'); // Asıl önemli olan bu
                

                window.location.href = "/login";
            }
        });
    }

    // --- ZOMBİ OTURUM VE SESSİZ YENİLEME (BURASI DEĞİŞTİ 🚀) ---
    if (userDataString) {
        console.log("🔄 Oturum kontrol ediliyor...");

        fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include' // Cookie gönder
        })
        .then(async response => {
            // 1. Her şey yolundaysa (200 OK)
            if (response.ok) {
                return response.json();
            }

            // 2. Access Token Bitmişse (401 veya 403)
            // Hemen pes etme! Refresh Token şansını dene.
            if (response.status === 401 || response.status === 403) {
                console.warn("⚠️ Access Token geçersiz! Refresh Token ile yenileme deneniyor...");

                const refreshResponse = await fetch('/api/auth/refreshtoken', {
                    method: 'POST',
                    credentials: 'include' // Refresh Cookie'yi götürür
                });

                if (refreshResponse.ok) {
                    console.log("✅ BAŞARILI! Yeni Access Token alındı. Oturum kurtarıldı.");
                    return { status: "restored" }; // Başarılı sayıyoruz
                }
            }

            // 3. Eğer buraya geldiysek, Refresh Token da işe yaramadı demektir.
            throw new Error("Oturum tamamen sonlandı.");
        })
        .then(data => {
            // Oturum sağlam veya yenilendi
            // console.log("Oturum durumu:", data);
        })
        .catch(err => {
            console.error("❌ Oturum kurtarılamadı:", err);

            // Temizlik ve Yönlendirme
            localStorage.removeItem('userData');
            alert("Oturum süreniz doldu, lütfen tekrar giriş yapın.");
            window.location.href = "/login";
        });
    }

});