document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const messageDiv = document.getElementById('message');

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = forgotPasswordForm.email.value;
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Butonu devre dışı bırak ve yükleniyor göster
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gönderiliyor...';
        messageDiv.innerText = '';
        messageDiv.className = 'mt-3 text-center fw-bold';

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.className += ' text-success';
                messageDiv.innerText = data.message;
                forgotPasswordForm.reset();
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