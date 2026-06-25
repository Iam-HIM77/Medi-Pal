document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Checkout page loaded');

    // Get cart
    const cart = await getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        window.location.href = 'cart.html';
        return;
    }

    // Display order items
    const orderItemsContainer = document.getElementById('orderItems');
    let html = '';
    let subtotal = 0;
    cart.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;
        html += `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>GH₵${total.toFixed(2)}</span>
            </div>
        `;
    });
    orderItemsContainer.innerHTML = html;

    const delivery = 5;
    const totalAmount = subtotal + delivery;

    document.getElementById('summarySubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('summaryTotal').textContent = totalAmount.toFixed(2);

    // Update the mobile money amount displayed
    const mobileAmountSpan = document.getElementById('mobileAmount');
    if (mobileAmountSpan) {
        mobileAmountSpan.textContent = 'GH₵' + totalAmount.toFixed(2);
    }

    // Populate user info
    const user = getUser();
    if (user) {
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
    }

    // ========== PAYMENT METHOD TOGGLE ==========
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const mobileDetails = document.getElementById('mobileMoneyDetails');
    const cardDetails = document.getElementById('cardDetails');
    const cashDetails = document.getElementById('cashDetails');

    function togglePaymentDetails() {
        const selected = document.querySelector('input[name="payment"]:checked');
        console.log('📌 Selected payment:', selected ? selected.value : 'none');

        // Hide all
        mobileDetails.style.display = 'none';
        cardDetails.style.display = 'none';
        cashDetails.style.display = 'none';

        if (selected) {
            if (selected.value === 'mobile') {
                mobileDetails.style.display = 'block';
            } else if (selected.value === 'card') {
                cardDetails.style.display = 'block';
            } else {
                cashDetails.style.display = 'block';
            }
        }
    }

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', togglePaymentDetails);
        console.log('📎 Attached change listener to:', radio.value);
    });

    // Set initial state
    togglePaymentDetails();

    // ========== PLACE ORDER ==========
    document.getElementById('placeOrderBtn').addEventListener('click', async function(e) {
        e.preventDefault();

        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const payment = document.querySelector('input[name="payment"]:checked');

        if (!name || !email || !phone || !address || !city) {
            showNotification('Please fill in all delivery details', 'error');
            return;
        }
        if (!payment) {
            showNotification('Please select a payment method', 'error');
            return;
        }

        // Validate payment-specific fields
        if (payment.value === 'mobile') {
            const mobileNumber = document.getElementById('mobileNumber').value.trim();
            const mobileName = document.getElementById('mobileName').value.trim();
            if (!mobileNumber || !mobileName) {
                showNotification('Please fill in all mobile money details', 'error');
                return;
            }
            if (mobileNumber.length < 10) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }
        }

        if (payment.value === 'card') {
            const cardNumber = document.getElementById('cardNumber').value.trim().replace(/\s/g, '');
            const cardExpiry = document.getElementById('cardExpiry').value.trim();
            const cardCvv = document.getElementById('cardCvv').value.trim();
            const cardName = document.getElementById('cardName').value.trim();
            
            if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
                showNotification('Please fill in all card details', 'error');
                return;
            }
            if (cardNumber.length < 16) {
                showNotification('Please enter a valid card number (16 digits)', 'error');
                return;
            }
            if (cardCvv.length < 3) {
                showNotification('Please enter a valid CVV (3-4 digits)', 'error');
                return;
            }
        }

        const payload = {
            fullName: name,
            email: email,
            phone: phone,
            address: address,
            city: city,
            payment: payment.value
        };

        if (payment.value === 'mobile') {
            payload.mobileNetwork = document.getElementById('mobileNetwork').value;
            payload.mobileNumber = document.getElementById('mobileNumber').value.trim();
            payload.mobileName = document.getElementById('mobileName').value.trim();
        }
        if (payment.value === 'card') {
            payload.cardLast4 = document.getElementById('cardNumber').value.trim().replace(/\s/g, '').slice(-4);
            payload.cardholderName = document.getElementById('cardName').value.trim();
        }

        try {
            const btn = document.getElementById('placeOrderBtn');
            btn.disabled = true;
            btn.textContent = 'Processing...';

            const response = await fetch(API_BASE + 'api.php?action=orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            btn.disabled = false;
            btn.textContent = 'Place Order';

            if (data.success) {
                showNotification('Order placed successfully!', 'success');
                window.location.href = 'orders.html';
            } else {
                showNotification(data.error || 'Order failed', 'error');
            }
        } catch (e) {
            document.getElementById('placeOrderBtn').disabled = false;
            document.getElementById('placeOrderBtn').textContent = 'Place Order';
            console.error('Error placing order:', e);
            showNotification('Network error', 'error');
        }
    });
});