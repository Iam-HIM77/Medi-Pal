// ==================== MEDIPAL - GLOBAL FUNCTIONS ====================

// Cart Management
let cart = JSON.parse(localStorage.getItem('medipalCart')) || [];

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('medipalCart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count badge on all pages
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadges = document.querySelectorAll('.cart-count');
    cartBadges.forEach(badge => {
        if (badge) badge.textContent = totalItems;
    });
}

// Add item to cart
function addToCart(productId, productName, productPrice, productImage) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(productPrice),
            image: productImage || 'assets/medicines/default.jpg',
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`${productName} added to cart!`, 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    if (typeof displayCartItems === 'function') displayCartItems();
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
        }
    }
    if (typeof displayCartItems === 'function') displayCartItems();
}

// Get cart total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#F44336'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        font-family: 'Poppins', sans-serif;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// User Authentication Functions
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('medipalUser'));
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function logoutUser() {
    localStorage.removeItem('medipalUser');
    localStorage.removeItem('medipalCart');
    window.location.href = 'Home.html';
}

function updateNavForUser() {
    const user = getCurrentUser();
    const navLinks = document.querySelector('.nav-links');
    
    if (!navLinks) return;
    
    const loginLink = Array.from(navLinks.children).find(li => li.querySelector('a')?.textContent === 'Login');
    const registerLink = Array.from(navLinks.children).find(li => li.querySelector('a')?.textContent === 'Register');
    
    if (user) {
        // User is logged in - show Dashboard and hide Login/Register
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        
        // Check if dashboard link already exists
        const dashboardExists = Array.from(navLinks.children).find(li => li.querySelector('a')?.textContent === 'Dashboard');
        if (!dashboardExists) {
            const dashboardLi = document.createElement('li');
            dashboardLi.className = 'nav-item';
            dashboardLi.innerHTML = '<a href="dashboard.html">Dashboard</a>';
            navLinks.appendChild(dashboardLi);
        }
    } else {
        // User is logged out
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        
        const dashboardLink = Array.from(navLinks.children).find(li => li.querySelector('a')?.textContent === 'Dashboard');
        if (dashboardLink) dashboardLink.remove();
    }
}

// Product Data
const products = [
    { id: '1', name: 'Paracetamol 500mg', description: 'Used for fever and pain relief', price: 10.00, category: 'Pain Relief', image: "C:\\Users\\King Theo\\Downloads\\para.webp", stock: 100 },
    { id: '2', name: 'Vitamin C 1000mg', description: 'Boosts immune system', price: 15.00, category: 'Vitamins', image: "C:\\Users\\King Theo\\Downloads\\vitamin c.avif", stock: 85 },
    { id: '3', name: 'Amoxicillin 500mg', description: 'Antibiotic for infections', price: 25.00, category: 'Antibiotics', image: "C:\\Users\\King Theo\\Downloads\\Amoxicillin.jpeg", stock: 50 },
    { id: '4', name: 'Gebedol', description: 'Used for pain relief', price: 15.00, category: 'Pain Relief', image: "C:\\Users\\King Theo\\Downloads\\gebedol.jpg", stock: 75 },
    { id: '5', name: 'Amuzu Herbal', description: 'Improve blood circulation', price: 50.00, category: 'Herbal', image: "C:\\Users\\King Theo\\Downloads\\amuzu.jpg", stock: 30 },
    { id: '6', name: 'Agbeve Mixture', description: 'Boosts immune system', price: 70.00, category: 'Herbal', image: "C:\\Users\\King Theo\\Downloads\\agbeve.jpg", stock: 25 },
    { id: '7', name: 'Time Artesunate', description: 'Malaria treatment', price: 32.00, category: 'Antimalarial', image: "C:\\Users\\King Theo\\Downloads\\time.jpg", stock: 40 },
    { id: '8', name: 'Kwik Action', description: 'Immediate symptom relief', price: 60.00, category: 'Pain Relief', image: "C:\\Users\\King Theo\\Downloads\\kwik.jpg", stock: 0 }
];
    
// Get product by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateNavForUser();
    
    // Add CSS animation for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});