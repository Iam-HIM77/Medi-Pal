// ==================== CART PAGE FUNCTIONS ====================

// Display cart items on cart page
function displayCartItems() {
    const cartContainer = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const subtotalSpan = document.getElementById('subtotal');
    const totalSpan = document.getElementById('total');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        if (emptyCartDiv) emptyCartDiv.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }
    
    if (emptyCartDiv) emptyCartDiv.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image || 'assets/medicines/default.jpg'}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>GH&#8373;${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
                <button class="qty-btn" data-action="decrease">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-action="increase">+</button>
            </div>
            <div class="item-total">
                GH&#8373;${(item.price * item.quantity).toFixed(2)}
            </div>
            <button class="remove-btn" data-id="${item.id}">Remove</button>
        </div>
    `).join('');
    
    const subtotal = getCartTotal();
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;
    
    if (subtotalSpan) subtotalSpan.textContent = subtotal.toFixed(2);
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
    
    // Attach quantity button events
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const id = cartItem.dataset.id;
            const currentItem = cart.find(i => i.id === id);
            const action = this.dataset.action;
            
            if (action === 'increase') {
                updateQuantity(id, currentItem.quantity + 1);
            } else if (action === 'decrease') {
                updateQuantity(id, currentItem.quantity - 1);
            }
        });
    });
    
    // Attach remove button events
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            removeFromCart(id);
        });
    });
}

// Setup checkout button
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'error');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    displayCartItems();
    setupCheckout();
});