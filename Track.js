// ==================== TRACKING PAGE FUNCTIONS ====================

// Get order by ID
function getOrderById(orderId) {
    const orders = JSON.parse(localStorage.getItem('medipalOrders')) || [];
    return orders.find(order => order.id === orderId);
}

// Get all orders
function getAllOrders() {
    return JSON.parse(localStorage.getItem('medipalOrders')) || [];
}

// Update order status (for demo/admin purposes)
function updateOrderStatus(orderId, newStatus) {
    let orders = getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        
        const statusMap = {
            'pending': 'Order Placed',
            'confirmed': 'Order Confirmed',
            'processing': 'Preparing for Shipment',
            'shipped': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        
        orders[orderIndex].trackingStatus = statusMap[newStatus] || newStatus;
        localStorage.setItem('medipalOrders', JSON.stringify(orders));
        return true;
    }
    return false;
}

// Display tracking information
function displayTracking(orderId) {
    const order = getOrderById(orderId);
    const resultDiv = document.getElementById('trackResult');
    
    if (!resultDiv) return;
    
    if (!order) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="error-message">
                <p>❌ Order not found. Please check your Order ID and try again.</p>
            </div>
        `;
        return;
    }
    
    const statusSteps = ['Order Placed', 'Order Confirmed', 'Preparing for Shipment', 'Out for Delivery', 'Delivered'];
    const currentStatus = order.trackingStatus || 'Order Placed';
    const currentStepIndex = statusSteps.indexOf(currentStatus);
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="order-info">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Delivery Address:</strong> ${order.deliveryAddress}, ${order.deliveryCity}</p>
            <p><strong>Total Amount:</strong> GH₵${order.total.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod === 'mobile' ? 'Mobile Money' : 'Credit/Debit Card'}</p>
        </div>
        
        <div class="tracking-steps">
            ${statusSteps.map((step, index) => `
                <div class="step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'active' : ''}">
                    <div class="step-icon">${index <= currentStepIndex ? '✓' : index + 1}</div>
                    <div class="step-label">${step}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="order-status-note">
            <p><strong>Current Status:</strong> ${currentStatus}</p>
            ${order.status === 'delivered' ? '<p>✅ Your order has been delivered. Thank you for shopping with MediPal!</p>' : ''}
        </div>
    `;
}

// Get order ID from URL parameter
function getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('order');
}

// Setup track button
function setupTracking() {
    const trackBtn = document.getElementById('trackBtn');
    const orderInput = document.getElementById('orderId');
    
    if (trackBtn) {
        trackBtn.addEventListener('click', function() {
            const orderId = orderInput?.value.trim();
            if (orderId) {
                displayTracking(orderId);
            } else {
                showNotification('Please enter an Order ID', 'error');
            }
        });
    }
    
    if (orderInput) {
        orderInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const orderId = this.value.trim();
                if (orderId) displayTracking(orderId);
            }
        });
    }
}

// Initialize tracking page
document.addEventListener('DOMContentLoaded', function() {
    setupTracking();
    
    // Check if order ID was passed via URL
    const orderIdFromUrl = getOrderIdFromUrl();
    if (orderIdFromUrl) {
        const orderInput = document.getElementById('orderId');
        if (orderInput) orderInput.value = orderIdFromUrl;
        displayTracking(orderIdFromUrl);
    }
});