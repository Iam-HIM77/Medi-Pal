document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    // If an order ID is provided in URL, auto-track AND display it in the search box
    if (orderId) {
        const searchInput = document.getElementById('orderId');
        if (searchInput) {
            searchInput.value = orderId; // <-- This puts the order ID in the search box
        }
        trackOrder(orderId);
    }

    // Track button
    document.getElementById('trackBtn').addEventListener('click', function() {
        const id = document.getElementById('orderId').value.trim();
        if (id) {
            trackOrder(id);
        } else {
            showNotification('Please enter an order ID', 'error');
        }
    });
});

async function trackOrder(identifier) {
    const resultDiv = document.getElementById('trackResult');

    // Show loading
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p style="text-align:center;color:#7F8C8D;">⏳ Loading order details...</p>';

    try {
        const response = await fetch(API_BASE + 'api.php?action=track&id=' + encodeURIComponent(identifier));

        if (response.status === 401) {
            showNotification('Please login to track orders', 'error');
            resultDiv.innerHTML = `
                <div class="error-message">
                    <p>You need to be logged in to track orders.</p>
                    <a href="login.html" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#4CAF50;color:white;border-radius:5px;text-decoration:none;">Login Now</a>
                </div>
            `;
            return;
        }

        if (!response.ok) {
            resultDiv.innerHTML = `<div class="error-message">Order not found. Please check the ID.</div>`;
            return;
        }

        const order = await response.json();
        displayTrackResult(order, resultDiv);
    } catch (error) {
        console.error('Track error:', error);
        resultDiv.innerHTML = `<div class="error-message">Network error. Please try again.</div>`;
        showNotification('Failed to load order', 'error');
    }
}

function displayTrackResult(order, container) {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(order.status);
    const statusMap = {
        'pending': 'Order Placed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };

    // Get status display text
    const statusDisplay = order.status.charAt(0).toUpperCase() + order.status.slice(1);

    let html = `
        <div class="order-info">
            <p><strong>Order #${order.order_number}</strong></p>
            <p>Status: <span class="order-status status-${order.status}" style="text-transform:capitalize;font-weight:bold;padding:4px 12px;border-radius:20px;background:${order.status === 'pending' ? '#FFF3E0' : order.status === 'processing' ? '#E3F2FD' : order.status === 'shipped' ? '#E0F2F1' : order.status === 'delivered' ? '#E8F5E9' : '#FFEBEE'};color:${order.status === 'pending' ? '#FF9800' : order.status === 'processing' ? '#2196F3' : order.status === 'shipped' ? '#009688' : order.status === 'delivered' ? '#4CAF50' : '#F44336'};">${statusDisplay}</span></p>
            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
            <p>Total: GH₵${parseFloat(order.total).toFixed(2)}</p>
            <p>Delivery Address: ${order.delivery_address}, ${order.city}</p>
            <p>Phone: ${order.phone}</p>
        </div>
        <div class="tracking-steps">
    `;

    if (order.status === 'cancelled') {
        html += `<div class="step" style="flex:1;text-align:center;"><div class="step-icon" style="background:#F44336;color:white;">✖</div><div class="step-label">Cancelled</div></div>`;
    } else {
        steps.forEach((step, index) => {
            let statusClass = '';
            if (index < currentIndex) statusClass = 'completed';
            else if (index === currentIndex) statusClass = 'active';
            html += `
                <div class="step ${statusClass}">
                    <div class="step-icon">${index + 1}</div>
                    <div class="step-label">${statusMap[step]}</div>
                </div>
            `;
        });
    }

    html += `</div>`;

    // Items list
    if (order.items && order.items.length > 0) {
        html += `<div style="margin-top:20px;border-top:1px solid #F0F0F0;padding-top:15px;">
            <h4 style="margin-bottom:10px;">Order Items</h4>`;
        order.items.forEach(item => {
            html += `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F8F8F8;">
                <span>${item.name} × ${item.quantity}</span>
                <span>GH₵${(item.price * item.quantity).toFixed(2)}</span>
            </div>`;
        });
        html += `</div>`;
    }

    container.style.display = 'block';
    container.innerHTML = html;
}