 document.addEventListener('DOMContentLoaded', async function() {

            // ---- Search ----
            const searchInput = document.getElementById('homeSearchInput');
            const searchBtn = document.getElementById('homeSearchBtn');
            function doSearch() {
                const term = searchInput.value.trim();
                if (term) {
                    window.location.href = 'medicines.html?search=' + encodeURIComponent(term);
                } else {
                    showNotification('Please enter a medicine name', 'error');
                }
            }
            searchBtn.addEventListener('click', doSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') doSearch();
            });

            // ---- Category clicks ----
            document.querySelectorAll('.category-grid .card').forEach(card => {
                card.addEventListener('click', function() {
                    const cat = this.dataset.category;
                    if (cat) window.location.href = 'medicines.html?category=' + encodeURIComponent(cat);
                });
            });

            // ---- Fetch products and display only the first 8 ----
            const container = document.getElementById('homepageMedicines');
            try {
                const allProducts = await getProducts();
                // Sort by ID to keep consistent ordering
                const sorted = allProducts.sort((a, b) => a.id - b.id);
                // Take first 8 products only
                const featured = sorted.slice(0, 8);

                if (featured.length === 0) {
                    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#7F8C8D;">No featured products available. Add products via admin panel.</p>';
                } else {
                    container.innerHTML = featured.map(p => `
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

                    container.querySelectorAll('.add-to-cart:not(.disabled)').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const id = this.dataset.productId;
                            await addToCart(id, 1);
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading featured products:', error);
                container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#F44336;">Failed to load products. Please refresh.</p>';
            }
        });