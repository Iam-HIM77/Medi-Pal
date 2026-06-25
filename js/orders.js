let currentOrderFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    renderOrders();

    document.querySelectorAll('.order-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.order-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentOrderFilter = this.dataset.status;
            renderOrders();
        });
    });
});

async function renderOrders() {
    const url = API_BASE + 'api.php?action=orders' + (currentOrderFilter !== 'all' ? '&status=' + currentOrderFilter : '');
    const response = await fetch(url);
    if (!response.ok) {
        showNotification('Failed to load orders', 'error');
        return;
    }
    const orders = await response.json();
    const container = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    if (orders.length === 0) {
        container.innerHTML = '';
        noOrders.style.display = 'block';
        return;
    }
    noOrders.style.display = 'none';

    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${o.order_number}</span>
                <span class="order-date">${new Date(o.created_at).toLocaleString()}</span>
                <span class="order-status status-${o.status}">${o.status}</span>
            </div>
            <div class="order-items">
                ${(o.items || []).map(item => `
                    <div class="order-item">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>GH₵${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <span class="order-total">Total: GH₵${parseFloat(o.total).toFixed(2)}</span>
                <a href="track.html?id=${o.id}" class="track-link">📦 Track Order</a>
            </div>
        </div>
    `).join('');
}