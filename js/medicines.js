let currentCategory = 'all';
let currentSearch = '';
let allProducts = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    displayMedicines();

    document.getElementById('searchBtn').addEventListener('click', function() {
        currentSearch = document.getElementById('searchInput').value.trim();
        displayMedicines();
    });
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            currentSearch = this.value.trim();
            displayMedicines();
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            displayMedicines();
        });
    });
});

async function loadProducts() {
    allProducts = await getProducts();
}

function displayMedicines() {
    let filtered = allProducts;
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) || 
            (p.description && p.description.toLowerCase().includes(searchLower))
        );
    }

    const grid = document.getElementById('medicinesGrid');
    const noResults = document.getElementById('noResults');

    if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    grid.innerHTML = filtered.map(p => `
        <div class="medicine-card">
            <img src="${p.image || 'assets/medicines/default.jpg'}" alt="${p.name}" onerror="this.src='assets/medicines/default.jpg'">
            <p>${p.description || ''}</p>
            <span>GH₵${parseFloat(p.price).toFixed(2)}</span>
            ${p.stock > 0 ? 
                `<button class="add-to-cart" data-product-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>` :
                `<button class="add-to-cart disabled" disabled>Out of Stock</button>`
            }
        </div>
    `).join('');

    grid.querySelectorAll('.add-to-cart:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.productId;
            await addToCart(id, 1);
        });
    });
}