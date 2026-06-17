// ==================== CHECKOUT PAGE FUNCTIONS ====================

// Display order summary on checkout page
function displayOrderSummary() {
    const orderItemsDiv = document.getElementById('orderItems');
    const subtotalSpan = document.getElementById('summarySubtotal');
    const totalSpan = document.getElementById('summaryTotal');
    
    if (!orderItemsDiv) return;
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    orderItemsDiv.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>GH₵${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const subtotal = getCartTotal();
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;
    
    if (subtotalSpan) subtotalSpan.textContent = subtotal.toFixed(2);
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

// Generate random order ID
function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Save order to localStorage
function saveOrder(orderData) {
    let orders = JSON.parse(localStorage.getItem('medipalOrders')) || [];
    
    const newOrder = {
        id: orderData.orderId,
        date: new Date().toISOString(),
        customerName: orderData.fullName,
        customerEmail: orderData.email,
        customerPhone: orderData.phone,
        deliveryAddress: orderData.address,
        deliveryCity: orderData.city,
        paymentMethod: orderData.paymentMethod,
        items: [...cart],
        subtotal: getCartTotal(),
        deliveryFee: 5.00,
        total: getCartTotal() + 5.00,
        status: 'pending',
        trackingStatus: 'Order Placed'
    };
    
    orders.unshift(newOrder);
    localStorage.setItem('medipalOrders', JSON.stringify(orders));
}

// Place order
function placeOrder() {
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const address = document.getElementById('address')?.value;
    const city = document.getElementById('city')?.value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    // Validation
    if (!fullName || !email || !phone || !address || !city) {
        showNotification('Please fill all fields', 'error');
        return false;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showNotification('Please enter valid email', 'error');
        return false;
    }
    
    if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
        showNotification('Please enter valid phone number', 'error');
        return false;
    }
    
    const orderId = generateOrderId();
    
    const orderData = {
        orderId: orderId,
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
        city: city,
        paymentMethod: paymentMethod || 'cash'
    };
    
    saveOrder(orderData);
    
    // Clear cart
    cart = [];
    saveCart();
    
    showNotification('Order placed successfully!', 'success');
    
    // Redirect to tracking page
    setTimeout(() => {
        window.location.href = `track.html?order=${orderId}`;
    }, 1500);
    
    return true;
}

// Setup place order button
function setupPlaceOrder() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }
}

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    displayOrderSummary();
    setupPlaceOrder();
});