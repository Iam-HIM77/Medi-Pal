// ==================== ORDERS PAGE FUNCTIONS ====================

let currentFilter = 'all';
let userOrders = [];

// Load orders from localStorage
function loadOrders() {
    const allOrders = JSON.parse(localStorage.getItem('medipalOrders')) || [];
    const currentUser = getCurrentUser();
    
    // If user is logged in, filter orders by email
    if (currentUser) {
        userOrders = allOrders.filter(order => order.customerEmail === currentUser.email);
    } else {
        userOrders = allOrders;
    }
    
    return userOrders;
}

// Display orders
function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    const noOrdersDiv = document.getElementById('noOrders');
    
    if (!ordersList) return;
    
    loadOrders();
    
    let filteredOrders = [...userOrders];
    
    if (currentFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === currentFilter);
    }
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '';
        if (noOrdersDiv) noOrdersDiv.style.display = 'block';
        return;
    }
    
    if (noOrdersDiv) noOrdersDiv.style.display = 'none';
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">${order.id}</div>
                    <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>GH₵${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div class="order-total">Total: GH₵${order.total.toFixed(2)}</div>
                <a href="track.html?order=${order.id}" class="track-link">Track Order →</a>
            </div>
        </div>
    `).join('');
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            displayOrders();
        });
    });
}

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    displayOrders();
    setupFilters();
});