console.log('✅ register.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('registerForm');
    if (!form) {
        console.error('❌ Register form not found!');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        // Validation
        if (!name || !email || !password || !confirm) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        if (password !== confirm) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        const btn = document.getElementById('registerBtn');
        btn.disabled = true;
        btn.textContent = 'Registering...';

        try {
            // 1. Register the user
            const registerResponse = await fetch(API_BASE + 'auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, confirm })
            });

            // Read raw response
            const rawText = await registerResponse.text();
            console.log('📄 Raw register response:', rawText);

            let registerData;
            try {
                registerData = JSON.parse(rawText);
            } catch (e) {
                console.error('❌ Invalid JSON:', e);
                showNotification('Server returned invalid response. Please try again.', 'error');
                btn.disabled = false;
                btn.textContent = 'Register';
                return;
            }

            if (!registerData.success) {
                showNotification(registerData.message || 'Registration failed', 'error');
                btn.disabled = false;
                btn.textContent = 'Register';
                return;
            }

            // 2. Auto‑login after successful registration
            const loginResponse = await fetch(API_BASE + 'auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const loginText = await loginResponse.text();
            console.log('📄 Raw login response:', loginText);

            let loginData;
            try {
                loginData = JSON.parse(loginText);
            } catch (e) {
                console.error('❌ Invalid login JSON:', e);
                // Registration succeeded but auto-login failed – show message and redirect to login page
                showNotification('Registration successful! Please login.', 'success');
                btn.disabled = false;
                btn.textContent = 'Register';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            if (loginData.success) {
                setUser(loginData.user);
                updateNavForAuth();
                // Show success notification with user's name
                showNotification('✅ Registration successful! Welcome, ' + loginData.user.name + '!', 'success');
                btn.disabled = false;
                btn.textContent = 'Register';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showNotification('Registration successful! Please login.', 'success');
                btn.disabled = false;
                btn.textContent = 'Register';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            showNotification('Network error. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Register';
        }
    });
});