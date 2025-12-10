document.addEventListener('DOMContentLoaded', () => {

    // Form elemanını ID'sine göre seç
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                // 1. Sayfanın yenilenmesini engelle
                e.preventDefault();

                // Gönder butonunu bul ve kilitle (Çift tıklamayı önlemek için)
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';

                // 2. Form verilerini topla (TCKN ve Password)
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                try {
                    // 3. Backend API'ye İstek Gönder
                    const response = await fetch('/api/auth/signin', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // ✅ BAŞARILI GİRİŞ

                        // A. Token'ı kaydet (Anahtarımız bu!)
                        localStorage.setItem('userToken', result.accessToken);

                        //Refresh Tokenide kaydediyoruz
                        localStorage.setItem('refreshToken', result.refreshToken);

                        // B. Kullanıcı bilgilerini kaydet (İsim, Rol vb. ekranda göstermek için)
                        localStorage.setItem('userData', JSON.stringify(result));

                        // C. Kullanıcıya bilgi ver ve yönlendir
                        // alert("Giriş Başarılı!"); // İstersen alert'i kaldırabilirsin
                        window.location.href = "/"; // Ana Sayfaya Yönlendir
                    } else {
                        // ❌ HATA DURUMU
                        alert("Giriş Başarısız: " + (result.message || "Bilinmeyen bir hata oluştu."));

                        // Butonu eski haline getir
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }

                } catch (error) {
                    console.error('Login Hatası:', error);
                    alert("Sunucuyla bağlantı kurulamadı!");

                    // Butonu eski haline getir
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            });
        }
});