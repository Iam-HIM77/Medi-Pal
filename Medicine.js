// ==================== MEDICINES PAGE FUNCTIONS ====================

let currentProducts = [...products];
let currentCategory = 'all';
let currentSearch = '';

// Display medicines in grid
function displayMedicines() {
    const grid = document.getElementById('medicinesGrid');
    const noResults = document.getElementById('noResults');
    
    if (!grid) return;
    
    let filtered = [...currentProducts];
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // Filter by search
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    grid.innerHTML = filtered.map(product => `
        <div class="medicine-card">
            <img src="${product.image}" alt="${product.name}">
            <p>${product.description}</p>
            <span>GH₵${product.price.toFixed(2)}</span>
            ${product.stock > 0 ? 
                `<button class="add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>` :
                `<button class="add-to-cart disabled" disabled>Out of Stock</button>`
            }
        </div>
    `).join('');
    
    // Attach event listeners to add-to-cart buttons
    document.querySelectorAll('.add-to-cart:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            const price = parseFloat(this.dataset.price);
            const product = getProductById(id);
            addToCart(id, name, price, product?.image);
        });
    });
}

// Setup filters
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            currentSearch = searchInput?.value || '';
            displayMedicines();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                currentSearch = this.value;
                displayMedicines();
            }
        });
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            displayMedicines();
        });
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    displayMedicines();
    setupFilters();
});