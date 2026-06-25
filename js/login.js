console.log('✅ login.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready');

    const form = document.getElementById('loginForm');
    if (!form) {
        console.error('❌ Login form not found!');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('✅ Form submitted');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!email || !password) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        const url = API_BASE + 'auth.php?action=login';
        console.log('🌐 Fetching URL:', url);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(async response => {
            const text = await response.text();
            console.log('📄 Raw response:', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON response');
            }
        })
        .then(data => {
            console.log('📦 Parsed data:', data);
            btn.disabled = false;
            btn.textContent = 'Login';
            if (data.success) {
                setUser(data.user);
                updateNavForAuth();
                // Show success notification before redirect
                showNotification('✅ Login successful! Welcome back, ' + data.user.name, 'success');
                setTimeout(() => {
                    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
                }, 2000); // slight delay so notification is seen
            } else {
                showNotification(data.message || 'Invalid credentials', 'error');
            }
        })
        .catch(err => {
            console.error('❌ Fetch error:', err);
            btn.disabled = false;
            btn.textContent = 'Login';
            showNotification('Connection error: ' + err.message, 'error');
        });
    });
});