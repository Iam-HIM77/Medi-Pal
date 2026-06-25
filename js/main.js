// ========== API BASE ==========
const API_BASE = '/medipal/backend/';

// ========== HELPERS ==========
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `custom-notification ${type}`;
    div.textContent = message;
    div.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white; border-radius: 8px; font-weight: 500; z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 350px;
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

if (!document.getElementById('notificationStyle')) {
    const style = document.createElement('style');
    style.id = 'notificationStyle';
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// ========== USER / AUTH ==========
function getUser() {
    return JSON.parse(localStorage.getItem('medipal_user'));
}
function setUser(user) {
    localStorage.setItem('medipal_user', JSON.stringify(user));
}
function clearUser() {
    localStorage.removeItem('medipal_user');
}
function isLoggedIn() {
    return !!getUser();
}

async function logout() {
    if (!confirm('Are you sure you want to log out?')) return;
    await fetch(API_BASE + 'auth.php?action=logout');
    clearUser();
    updateCartCount();
    updateNavForAuth();
    window.location.href = 'login.html';
}

// ========== PRODUCTS ==========
async function getProducts() {
    try {
        const response = await fetch(API_BASE + 'api.php?action=products');
        if (!response.ok) {
            if (response.status === 401) return [];
            showNotification('Failed to load products', 'error');
            return [];
        }
        return await response.json();
    } catch (e) {
        console.error('Products fetch error:', e);
        return [];
    }
}
async function getProductById(id) {
    const products = await getProducts();
    return products.find(p => p.id == id);
}

// ========== CART ==========
async function getCart() {
    const response = await fetch(API_BASE + 'api.php?action=cart');
    if (!response.ok) {
        if (response.status === 401) return [];
        showNotification('Failed to load cart', 'error');
        return [];
    }
    return await response.json();
}
async function addToCart(productId, quantity = 1) {
    const response = await fetch(API_BASE + 'api.php?action=cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity })
    });
    const data = await response.json();
    if (data.success) {
        updateCartCount();
        showNotification('Added to cart', 'success');
    } else {
        showNotification(data.error || 'Failed to add', 'error');
    }
    return data;
}
async function updateCartQuantity(productId, quantity) {
    const response = await fetch(API_BASE + 'api.php?action=cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity })
    });
    const data = await response.json();
    if (data.success) updateCartCount();
    return data;
}
async function removeFromCart(productId) {
    const response = await fetch(API_BASE + 'api.php?action=cart&product_id=' + productId, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
        updateCartCount();
        showNotification('Item removed', 'info');
    }
    return data;
}
async function clearCart() {
    const cart = await getCart();
    for (let item of cart) await removeFromCart(item.product_id);
    updateCartCount();
}
async function updateCartCount() {
    const cart = await getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
}

// ========== NAVBAR AUTH LINKS (FIXED) ==========
function updateNavForAuth() {
    const user = getUser();
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) {
        console.warn('⚠️ Navbar with id="navLinks" not found.');
        return;
    }

    console.log('🔄 Updating navbar, user:', user ? 'logged in' : 'logged out');

    // Get all list items
    const items = navLinks.querySelectorAll('li');

    // Hide/Show Login & Register
    let loginLi = null, registerLi = null, dashboardLi = null, logoutLi = null;

    items.forEach(li => {
        const link = li.querySelector('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href === 'login.html') loginLi = li;
        else if (href === 'register.html') registerLi = li;
        else if (href === 'dashboard.html' || href === 'admin.html') dashboardLi = li;
        else if (link.classList.contains('logout-link')) logoutLi = li;
    });

    if (user) {
        // Hide Login & Register
        if (loginLi) loginLi.style.display = 'none';
        if (registerLi) registerLi.style.display = 'none';

        // Show or create Dashboard link
        if (!dashboardLi) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            a.textContent = 'Dashboard';
            li.appendChild(a);
            // Insert before logout if exists, else append
            if (logoutLi) {
                navLinks.insertBefore(li, logoutLi);
            } else {
                navLinks.appendChild(li);
            }
            dashboardLi = li;
        } else {
            dashboardLi.style.display = '';
            // Ensure href points to correct dashboard
            const link = dashboardLi.querySelector('a');
            if (link) link.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        }

        // Create Logout link if not exists
        if (!logoutLi) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'logout-link';
            a.textContent = 'Logout';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            li.appendChild(a);
            navLinks.appendChild(li);
            logoutLi = li;
        } else {
            logoutLi.style.display = '';
        }
    } else {
        // Show Login & Register
        if (loginLi) loginLi.style.display = '';
        if (registerLi) registerLi.style.display = '';

        // Hide Dashboard if exists
        if (dashboardLi) dashboardLi.style.display = 'none';

        // Hide Logout if exists
        if (logoutLi) logoutLi.style.display = 'none';
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateNavForAuth();
});