document.addEventListener('DOMContentLoaded', async function() {
    await renderCart();
});

async function renderCart() {
    const cart = await getCart();
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    const cartItems = document.getElementById('cartItems');

    if (!cart || cart.length === 0) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartContent.style.display = 'block';
    emptyCart.style.display = 'none';

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;
        html += `
            <div class="cart-item" data-product-id="${item.product_id}">
                <img src="${item.image || 'assets/medicines/default.jpg'}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>GH₵${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="item-quantity">
                    <button class="qty-dec">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-inc">+</button>
                </div>
                <div class="item-total">GH₵${total.toFixed(2)}</div>
                <button class="remove-btn" data-product-id="${item.product_id}">Remove</button>
            </div>
        `;
    });

    cartItems.innerHTML = html;

    // Event listeners
    cartItems.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = this.closest('.cart-item').dataset.productId;
            const cart = await getCart();
            const item = cart.find(i => i.product_id == productId);
            if (item) {
                const newQty = item.quantity - 1;
                if (newQty <= 0) {
                    await removeFromCart(productId);
                } else {
                    await updateCartQuantity(productId, newQty);
                }
                await renderCart();
            }
        });
    });

    cartItems.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = this.closest('.cart-item').dataset.productId;
            const cart = await getCart();
            const item = cart.find(i => i.product_id == productId);
            if (item) {
                const newQty = item.quantity + 1;
                await updateCartQuantity(productId, newQty);
                await renderCart();
            }
        });
    });

    cartItems.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            await removeFromCart(productId);
            await renderCart();
        });
    });

    // Update totals
    const delivery = 5;
    const total = subtotal + delivery;
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

// Checkout button
document.getElementById('checkoutBtn')?.addEventListener('click', function() {
    getCart().then(cart => {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        if (!isLoggedIn()) {
            showNotification('Please login to checkout', 'error');
            window.location.href = 'login.html';
            return;
        }
        window.location.href = 'checkout.html';
    });
});