document.addEventListener('DOMContentLoaded', function() {
    const user = getUser();
    if (!user) {
        showNotification('Please login to view dashboard', 'error');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userEmail').textContent = user.email || '';

    loadDashboardStats();

    // Tab switching
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'logout') {
                logout();
                return;
            }
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
            if (tab === 'orders') loadUserOrders('all');
        });
    });

    // Profile form - updates server
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('profileName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();

        if (!name) {
            showNotification('Name is required', 'error');
            return;
        }

        try {
            const response = await fetch(API_BASE + 'auth.php?action=update_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });
            const data = await response.json();
            if (data.success) {
                // Update local storage and UI
                setUser(data.user);
                document.getElementById('userName').textContent = data.user.name;
                showNotification('Profile updated successfully', 'success');
            } else {
                showNotification(data.message || 'Update failed', 'error');
            }
        } catch (e) {
            showNotification('Network error', 'error');
        }
    });

    // Pre-fill profile
    if (user) {
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
    }
});

async function loadDashboardStats() {
    const orders = await getUserOrders();
    const total = orders.length;
    const spent = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('totalSpent').textContent = 'GH₵' + spent.toFixed(2);
    document.getElementById('activeOrders').textContent = active;

    const recent = orders.slice(0, 3);
    const container = document.getElementById('recentOrders');
    if (recent.length === 0) {
        container.innerHTML = '<p style="color:#7F8C8D;">No orders yet</p>';
    } else {
        container.innerHTML = recent.map(o => `
            <div class="order-item-mini" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0F0F0;">
                <span class="order-id-mini" style="font-weight:bold;">#${o.order_number}</span>
                <span class="order-status-mini status-${o.status}" style="font-size:12px;padding:2px 8px;border-radius:20px;background:${o.status === 'pending' ? '#FFF3E0' : o.status === 'processing' ? '#E3F2FD' : o.status === 'shipped' ? '#E0F2F1' : o.status === 'delivered' ? '#E8F5E9' : '#FFEBEE'};color:${o.status === 'pending' ? '#FF9800' : o.status === 'processing' ? '#2196F3' : o.status === 'shipped' ? '#009688' : o.status === 'delivered' ? '#4CAF50' : '#F44336'};">${o.status}</span>
                <span style="font-weight:bold;">GH₵${parseFloat(o.total).toFixed(2)}</span>
                <a href="track.html?id=${o.id}" style="background:#4CAF50;color:white;padding:4px 12px;border-radius:4px;text-decoration:none;font-size:12px;">📦 Track</a>
            </div>
        `).join('');
    }
}

async function getUserOrders() {
    const response = await fetch(API_BASE + 'api.php?action=orders');
    if (!response.ok) return [];
    return await response.json();
}

async function loadUserOrders(status = 'all') {
    let orders = await getUserOrders();
    if (status !== 'all') {
        orders = orders.filter(o => o.status === status);
    }
    const container = document.getElementById('dashboardOrders');
    if (orders.length === 0) {
        container.innerHTML = '<p style="color:#7F8C8D;">No orders found</p>';
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-item-mini" style="border-bottom:1px solid #F0F0F0; padding:12px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <span class="order-id-mini" style="font-weight:bold;">#${o.order_number}</span>
                <span class="order-status-mini status-${o.status}" style="margin-left:10px;font-size:12px;padding:2px 8px;border-radius:20px;background:${o.status === 'pending' ? '#FFF3E0' : o.status === 'processing' ? '#E3F2FD' : o.status === 'shipped' ? '#E0F2F1' : o.status === 'delivered' ? '#E8F5E9' : '#FFEBEE'};color:${o.status === 'pending' ? '#FF9800' : o.status === 'processing' ? '#2196F3' : o.status === 'shipped' ? '#009688' : o.status === 'delivered' ? '#4CAF50' : '#F44336'};">${o.status}</span>
            </div>
            <div>
                <span style="font-weight:bold;">GH₵${parseFloat(o.total).toFixed(2)}</span>
                <span style="font-size:12px;color:#7F8C8D;margin-left:10px;">${new Date(o.created_at).toLocaleDateString()}</span>
            </div>
            <a href="track.html?id=${o.id}" style="background:#4CAF50;color:white;padding:4px 12px;border-radius:4px;text-decoration:none;font-size:12px;">📦 Track</a>
        </div>
    `).join('');
}