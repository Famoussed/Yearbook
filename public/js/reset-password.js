document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const messageDiv = document.getElementById('message');
    const token = document.getElementById('token').value;

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = resetPasswordForm.password.value;
        const confirmPassword = resetPasswordForm.confirmPassword.value;
        const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        if (password !== confirmPassword) {
            messageDiv.className = 'mt-3 text-center fw-bold text-danger';
            messageDiv.innerText = 'Şifreler eşleşmiyor!';
            return;
        }

        // Butonu devre dışı bırak ve yükleniyor göster
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Güncelleniyor...';
        messageDiv.innerText = '';
        messageDiv.className = 'mt-3 text-center fw-bold';

        try {
            const response = await fetch(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.className += ' text-success';
                messageDiv.innerText = data.message;
                
                // Başarılıysa 2 saniye sonra login sayfasına yönlendir
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);

            } else {
                messageDiv.className += ' text-danger';
                messageDiv.innerText = data.message || 'Bir hata oluştu.';
            }

        } catch (error) {
            console.error('Error:', error);
            messageDiv.className += ' text-danger';
            messageDiv.innerText = 'Sunucu hatası, lütfen daha sonra tekrar deneyin.';
        } finally {
            // Butonu eski haline getir
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
});