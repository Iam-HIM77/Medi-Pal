let adminOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        showNotification('Admin access required', 'error');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('adminName').textContent = user.name || 'Admin';
    document.getElementById('adminEmail').textContent = user.email || '';

    // Tab switching
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'logout') {
                logout();
                return;
            }
            document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
            if (tab === 'overview') loadAdminOverview();
            else if (tab === 'orders') loadAdminOrders('all');
            else if (tab === 'products') loadAdminProducts();
            else if (tab === 'customers') loadAdminCustomers();
            else if (tab === 'messages') loadAdminMessages();
        });
    });

    // Default load
    loadAdminOverview();

    // Product modal
    const productModal = document.getElementById('productModal');
    document.getElementById('addProductBtn').addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';
        productModal.classList.add('show');
    });
    document.getElementById('closeProductModal').addEventListener('click', function() {
        productModal.classList.remove('show');
    });
    window.addEventListener('click', function(e) {
        if (e.target === productModal) productModal.classList.remove('show');
    });

    // Product form submit
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('prodName').value.trim();
        const description = document.getElementById('prodDescription').value.trim();
        const price = parseFloat(document.getElementById('prodPrice').value);
        const category = document.getElementById('prodCategory').value;
        const stock = parseInt(document.getElementById('prodStock').value);
        const image = document.getElementById('prodImage').value.trim() || 'assets/medicines/default.jpg';

        if (!name || !price || stock < 0) {
            showNotification('Please fill all fields correctly', 'error');
            return;
        }

        const payload = { name, description, price, category, stock, image };
        let url = API_BASE + 'admin_api.php?action=admin_products';
        let method = 'POST';
        if (id) {
            payload.id = parseInt(id);
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
                productModal.classList.remove('show');
                showNotification('Product saved successfully', 'success');
                loadAdminProducts();
            } else {
                showNotification(data.error || 'Save failed', 'error');
            }
        } catch (e) {
            showNotification('Network error while saving', 'error');
        }
    });

    // Product search
    document.getElementById('productSearchBtn').addEventListener('click', function() {
        loadAdminProducts();
    });
    document.getElementById('productSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loadAdminProducts();
    });

    // Order filters
    document.querySelectorAll('#ordersTab .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#ordersTab .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadAdminOrders(this.dataset.status);
        });
    });
});

// ---------- LOAD FUNCTIONS ----------

async function loadAdminOverview() {
    try {
        const response = await fetch(API_BASE + 'admin_api.php?action=stats');
        if (!response.ok) {
            showNotification('Failed to load stats', 'error');
            return;
        }
        const data = await response.json();
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalRevenue').textContent = 'GH₵' + parseFloat(data.totalRevenue).toFixed(2);
        document.getElementById('totalCustomers').textContent = data.totalCustomers;
        document.getElementById('totalProducts').textContent = data.totalProducts;

        const recent = data.recentOrders || [];
        const container = document.getElementById('adminRecentOrders');
        container.innerHTML = recent.length === 0 ? '<p style="color:#7F8C8D;">No orders</p>' :
            recent.map(o => `
                <div class="order-item-mini">
                    <span>#${o.order_number}</span>
                    <span class="order-status-mini status-${o.status}">${o.status}</span>
                    <span>GH₵${parseFloat(o.total).toFixed(2)}</span>
                </div>
            `).join('');

        const lowStock = data.lowStock || [];
        const alertContainer = document.getElementById('lowStockAlert');
        alertContainer.innerHTML = lowStock.length === 0 ?
            '<p style="color:#4CAF50;">✅ All products have sufficient stock</p>' :
            lowStock.map(p => `
                <div style="padding:5px 0;border-bottom:1px solid #F0F0F0;">
                    <span>${p.name}</span>
                    <span style="color:#F44336;font-weight:bold;float:right;">Stock: ${p.stock}</span>
                </div>
            `).join('');
    } catch (e) {
        console.error('Overview error:', e);
        showNotification('Error loading overview', 'error');
    }
}

async function loadAdminOrders(status) {
    try {
        const url = API_BASE + 'admin_api.php?action=admin_orders' + (status !== 'all' ? '&status=' + status : '');
        const response = await fetch(url);
        if (!response.ok) {
            showNotification('Failed to load orders', 'error');
            return;
        }
        const orders = await response.json();
        const container = document.getElementById('adminOrdersList');
        if (orders.length === 0) {
            container.innerHTML = '<p style="color:#7F8C8D;">No orders found</p>';
            return;
        }
        container.innerHTML = orders.map(o => `
            <div class="admin-order-card">
                <div class="admin-order-header">
                    <span class="admin-order-id">#${o.order_number}</span>
                    <span class="admin-order-status status-${o.status}">${o.status}</span>
                    <span style="font-size:12px;color:#7F8C8D;">${new Date(o.created_at).toLocaleString()}</span>
                </div>
                <div class="admin-order-items">
                    ${(o.items || []).map(item => `${item.name} × ${item.quantity}`).join(', ')}
                </div>
                <div class="admin-order-footer">
                    <span class="admin-order-total">GH₵${parseFloat(o.total).toFixed(2)}</span>
                    <div class="admin-order-actions">
                        ${['pending','processing','shipped','delivered','cancelled'].map(s => `
                            <button class="status-btn ${s}" data-order-id="${o.id}" data-status="${s}">${s}</button>
                        `).join('')}
                        <button class="delete-order-btn" data-order-id="${o.id}" style="background:#F44336; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Status update
        container.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const orderId = this.dataset.orderId;
                const newStatus = this.dataset.status;
                try {
                    const response = await fetch(API_BASE + 'admin_api.php?action=admin_orders', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: orderId, status: newStatus })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showNotification(`Order status updated to ${newStatus}`, 'success');
                        loadAdminOrders(status);
                    } else {
                        showNotification(data.error || 'Update failed', 'error');
                    }
                } catch (e) {
                    showNotification('Network error', 'error');
                }
            });
        });

        // Delete order
        container.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm('Delete this order?')) {
                    const id = this.dataset.orderId;
                    const response = await fetch(API_BASE + 'admin_api.php?action=delete_order&id=' + id, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        showNotification('Order deleted', 'success');
                        loadAdminOrders(status);
                    } else {
                        showNotification(data.error || 'Delete failed', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Orders error:', e);
        showNotification('Error loading orders', 'error');
    }
}

async function loadAdminProducts() {
    try {
        const search = document.getElementById('productSearch').value.trim();
        const url = API_BASE + 'admin_api.php?action=admin_products' + (search ? '&search=' + encodeURIComponent(search) : '');
        console.log('🔍 Loading products from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            showNotification('Failed to load products', 'error');
            return;
        }
        const products = await response.json();
        console.log('📦 Products loaded:', products);
        const container = document.getElementById('adminProductsList');
        if (products.length === 0) {
            container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#7F8C8D;">No products found. Add some using the + button.</p>';
            return;
        }
        container.innerHTML = products.map(p => `
            <div class="admin-product-card">
                <img src="${p.image || 'assets/medicines/default.jpg'}" alt="${p.name}" onerror="this.src='assets/medicines/default.jpg'">
                <h4>${p.name}</h4>
                <div class="price">GH₵${parseFloat(p.price).toFixed(2)}</div>
                <div class="stock ${p.stock < 10 ? 'low' : ''}">Stock: ${p.stock}</div>
                <div class="admin-product-actions">
                    <button class="edit-product-btn" data-product-id="${p.id}">Edit</button>
                    <button class="delete-product-btn" data-product-id="${p.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // ===== EDIT BUTTON (FIXED) =====
        container.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.productId;
                console.log('🔍 Editing product ID:', id);

                const url = API_BASE + 'admin_api.php?action=admin_products&search=' + id;
                console.log('🌐 Fetching:', url);

                fetch(url)
                    .then(response => {
                        console.log('📨 Response status:', response.status);
                        return response.json();
                    })
                    .then(data => {
                        console.log('📦 Response data:', data);
                        // data should be an array, find the product with matching ID
                        const product = Array.isArray(data) ? data.find(p => p.id == id) : null;
                        if (product) {
                            document.getElementById('modalTitle').textContent = 'Edit Product';
                            document.getElementById('editProductId').value = product.id;
                            document.getElementById('prodName').value = product.name;
                            document.getElementById('prodDescription').value = product.description || '';
                            document.getElementById('prodPrice').value = product.price;
                            document.getElementById('prodCategory').value = product.category || 'Pain Relief';
                            document.getElementById('prodStock').value = product.stock;
                            document.getElementById('prodImage').value = product.image || '';
                            document.getElementById('productModal').classList.add('show');
                        } else {
                            showNotification('Product not found', 'error');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Edit error:', err);
                        showNotification('Error loading product details', 'error');
                    });
            });
        });

        // ===== DELETE BUTTON =====
        container.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.productId;
                if (confirm('Delete this product?')) {
                    try {
                        const response = await fetch(API_BASE + 'admin_api.php?action=admin_products&id=' + id, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (data.success) {
                            showNotification('Product deleted', 'info');
                            loadAdminProducts();
                        } else {
                            showNotification(data.error || 'Delete failed', 'error');
                        }
                    } catch (e) {
                        showNotification('Network error', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Products error:', e);
        showNotification('Error loading products', 'error');
    }
}

async function loadAdminCustomers() {
    try {
        const response = await fetch(API_BASE + 'admin_api.php?action=admin_customers');
        if (!response.ok) {
            showNotification('Failed to load customers', 'error');
            return;
        }
        const customers = await response.json();
        const container = document.getElementById('adminCustomersList');
        if (customers.length === 0) {
            container.innerHTML = '<p style="color:#7F8C8D;">No customers registered</p>';
            return;
        }
        container.innerHTML = customers.map(u => `
            <div class="admin-customer-card">
                <div class="admin-customer-info">
                    <h4>${u.name}</h4>
                    <p>${u.email} | ${u.phone || ''}</p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="delete-user-btn" data-user-id="${u.id}" style="background:#F44336; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">Delete User</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.dataset.userId;
                if (confirm('Delete this user and all their orders?')) {
                    const response = await fetch(API_BASE + 'admin_api.php?action=delete_user&id=' + userId, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        showNotification('User deleted', 'success');
                        loadAdminCustomers();
                    } else {
                        showNotification(data.error || 'Delete failed', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Customers error:', e);
        showNotification('Error loading customers', 'error');
    }
}

async function loadAdminMessages() {
    try {
        const response = await fetch(API_BASE + 'admin_api.php?action=messages');
        if (!response.ok) {
            showNotification('Failed to load messages', 'error');
            return;
        }
        const messages = await response.json();
        const container = document.getElementById('adminMessagesList');
        if (messages.length === 0) {
            container.innerHTML = '<p style="color:#7F8C8D;">No messages yet</p>';
            return;
        }
        container.innerHTML = messages.map(m => `
            <div class="admin-message-card" style="background:${m.read_status ? '#F8F9FA' : '#FFF8E1'}; padding:15px; border-radius:8px; margin-bottom:10px; border-left:4px solid ${m.read_status ? '#4CAF50' : '#FF9800'};">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                    <strong>${m.name}</strong>
                    <span style="font-size:12px;color:#7F8C8D;">${new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p style="font-size:14px;color:#555;">${m.email} ${m.subject ? '| ' + m.subject : ''}</p>
                <p style="margin-top:5px;">${m.message}</p>
                <div style="margin-top:10px; display:flex; gap:8px;">
                    ${!m.read_status ? `<button class="mark-read-btn" data-id="${m.id}" style="background:#4CAF50; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">Mark as Read</button>` : ''}
                    <button class="delete-msg-btn" data-id="${m.id}" style="background:#F44336; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                await fetch(API_BASE + 'admin_api.php?action=messages', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                loadAdminMessages();
            });
        });

        container.querySelectorAll('.delete-msg-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm('Delete this message?')) {
                    const id = this.dataset.id;
                    await fetch(API_BASE + 'admin_api.php?action=messages&id=' + id, { method: 'DELETE' });
                    loadAdminMessages();
                }
            });
        });
    } catch (e) {
        console.error('Messages error:', e);
        showNotification('Error loading messages', 'error');
    }
}