// ==================== DASHBOARD PAGE FUNCTIONS ====================

let currentUser = null;
let userOrders = [];

// Load user data
function loadUserData() {
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Display user info
    const userNameSpan = document.getElementById('userName');
    const userEmailSpan = document.getElementById('userEmail');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    
    if (userNameSpan) userNameSpan.textContent = currentUser.fullName || currentUser.name || 'User';
    if (userEmailSpan) userEmailSpan.textContent = currentUser.email;
    if (profileName) profileName.value = currentUser.fullName || currentUser.name || '';
    if (profileEmail) profileEmail.value = currentUser.email;
    if (profilePhone) profilePhone.value = currentUser.phone || '';
    
    return true;
}

// Load user orders
function loadUserOrders() {
    const allOrders = JSON.parse(localStorage.getItem('medipalOrders')) || [];
    userOrders = allOrders.filter(order => order.customerEmail === currentUser?.email);
    return userOrders;
}

// Update dashboard stats
function updateStats() {
    loadUserOrders();
    
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const activeOrders = userOrders.filter(order => 
        !['delivered', 'cancelled'].includes(order.status)
    ).length;
    
    const totalOrdersSpan = document.getElementById('totalOrders');
    const totalSpentSpan = document.getElementById('totalSpent');
    const activeOrdersSpan = document.getElementById('activeOrders');
    
    if (totalOrdersSpan) totalOrdersSpan.textContent = totalOrders;
    if (totalSpentSpan) totalSpentSpan.textContent = `GH₵${totalSpent.toFixed(2)}`;
    if (activeOrdersSpan) activeOrdersSpan.textContent = activeOrders;
}

// Display recent orders on dashboard
function displayRecentOrders() {
    const recentOrdersDiv = document.getElementById('recentOrders');
    const dashboardOrdersDiv = document.getElementById('dashboardOrders');
    
    loadUserOrders();
    const recentOrders = userOrders.slice(0, 3);
    
    if (recentOrdersDiv) {
        if (recentOrders.length === 0) {
            recentOrdersDiv.innerHTML = '<p>No orders yet. <a href="medicines.html">Start shopping</a></p>';
        } else {
            recentOrdersDiv.innerHTML = recentOrders.map(order => `
                <div class="order-item-mini">
                    <span class="order-id-mini">${order.id}</span>
                    <span class="order-status-mini status-${order.status}">${order.status}</span>
                    <a href="track.html?order=${order.id}">Track</a>
                </div>
            `).join('');
        }
    }
    
    if (dashboardOrdersDiv) {
        if (userOrders.length === 0) {
            dashboardOrdersDiv.innerHTML = '<p>No orders found. <a href="medicines.html">Browse Medicines</a></p>';
        } else {
            dashboardOrdersDiv.innerHTML = userOrders.map(order => `
                <div class="order-card" style="margin-bottom: 15px;">
                    <div class="order-header">
                        <div>
                            <div class="order-id">${order.id}</div>
                            <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                        </div>
                        <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
                    </div>
                    <div class="order-items">
                        ${order.items.slice(0, 2).map(item => `
                            <div class="order-item">
                                <span>${item.name} x ${item.quantity}</span>
                                <span>GH₵${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        ${order.items.length > 2 ? `<div class="order-item">... and ${order.items.length - 2} more items</div>` : ''}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">Total: GH₵${order.total.toFixed(2)}</div>
                        <a href="track.html?order=${order.id}" class="track-link">Track Order →</a>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Tab switching
function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = ['overviewTab', 'ordersTab', 'profileTab'];
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            if (tabName === 'logout') {
                logoutUser();
                return;
            }
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            // Show active tab
            tabs.forEach(tabId => {
                const tab = document.getElementById(tabId);
                if (tab) tab.classList.remove('active');
            });
            
            const activeTab = document.getElementById(`${tabName}Tab`);
            if (activeTab) activeTab.classList.add('active');
            
            // Refresh data if needed
            if (tabName === 'orders') {
                displayRecentOrders();
            }
        });
    });
}

// Update profile
function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('profileName')?.value;
            const email = document.getElementById('profileEmail')?.value;
            const phone = document.getElementById('profilePhone')?.value;
            
            if (currentUser) {
                currentUser.fullName = fullName;
                currentUser.email = email;
                currentUser.phone = phone;
                localStorage.setItem('medipalUser', JSON.stringify(currentUser));
                
                // Update orders with new email
                let orders = JSON.parse(localStorage.getItem('medipalOrders')) || [];
                orders = orders.map(order => {
                    if (order.customerEmail === currentUser.email) {
                        order.customerName = fullName;
                    }
                    return order;
                });
                localStorage.setItem('medipalOrders', JSON.stringify(orders));
                
                showNotification('Profile updated successfully!', 'success');
                
                // Update display
                const userNameSpan = document.getElementById('userName');
                if (userNameSpan) userNameSpan.textContent = fullName;
            }
        });
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (loadUserData()) {
        updateStats();
        displayRecentOrders();
        setupTabs();
        setupProfileForm();
    }
});