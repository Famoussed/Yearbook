// --- TOKEN YENİLEME VE OTURUM KONTROLÜ (GLOBAL) ---

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
});

// 1. Sayfa Yüklendiğinde Oturum Kontrolü
async function checkSession() {
    try {
        // Sadece kontrol amaçlı, cevap içeriği önemli değil
        const response = await fetch('/api/auth/check', { method: 'GET' });
        
        if (response.status === 401 || response.status === 403) {
            console.warn("⚠️ Oturum süresi dolmuş olabilir. Yenileme deneniyor...");
            await refreshToken();
        }
    } catch (error) {
        console.error("Oturum kontrol hatası:", error);
    }
}

// 2. Token Yenileme Fonksiyonu
async function refreshToken() {
    try {
        const response = await fetch('/api/auth/refreshtoken', { method: 'POST' });
        
        if (response.ok) {
            console.log("✅ Token başarıyla yenilendi.");
            return true;
        } else {
            console.error("❌ Token yenilenemedi. Çıkış yapılıyor.");
            logout();
            return false;
        }
    } catch (error) {
        console.error("Token yenileme hatası:", error);
        return false;
    }
}

// 3. Güvenli Fetch Wrapper (Tüm isteklerde bunu kullanın!)
window.fetchWithAuth = async function(url, options = {}) {
    // 1. İlk isteği yap
    let response = await fetch(url, options);

    // 2. Eğer 401 (Unauthorized) veya 403 (Forbidden - Token Yok) dönerse
    if (response.status === 401 || response.status === 403) {
        console.warn(`🔒 ${response.status} Hatası alındı. Token yenileniyor...`);
        
        // 3. Token yenilemeyi dene
        const refreshed = await refreshToken();

        if (refreshed) {
            console.log("🔄 İstek tekrarlanıyor...");
            // 4. Yenileme başarılıysa isteği tekrarla
            response = await fetch(url, options);
        } else {
            // 5. Yenileme başarısızsa login'e at
            // Sadece gerçekten başarısızsa at, belki kullanıcı zaten login sayfasındadır.
            if (!window.location.pathname.includes('/login')) {
                 window.location.href = '/login';
            }
        }
    }

    return response;
};

// 4. Çıkış Fonksiyonu
function logout() {
    localStorage.removeItem('userData');
    window.location.href = '/login';
}