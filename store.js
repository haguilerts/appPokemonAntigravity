// store.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        window.location.href = 'index.html';
        return;
    }
    const currentUser = JSON.parse(currentUserStr);
    
    // Display user name
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        userNameDisplay.textContent = `Hola, ${currentUser.name}`;
    }

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // 2. Product Data & State
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    const itemsPerPage = 8;
    let currentView = 'grid'; // 'grid' or 'list'

    const totalCountBadge = document.getElementById('total-count-badge');
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    const sortSelect = document.getElementById('sort-select');
    const productContainer = document.getElementById('product-container');

    if (viewGridBtn) {
        viewGridBtn.addEventListener('change', () => {
            currentView = 'grid';
            renderProducts();
        });
    }

    if (viewListBtn) {
        viewListBtn.addEventListener('change', () => {
            currentView = 'list';
            renderProducts();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            applySort();
            renderProducts();
        });
    }

    async function fetchAllProducts() {
        if (productContainer) {
            productContainer.innerHTML = '<div class="col-12 text-center my-5"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">Cargando catálogo...</p></div>';
        }

        try {
            // Fetch 80 products for the local catalog
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=80`);
            const data = await response.json();
            
            const fetchPromises = data.results.map(async (pokemon) => {
                const pokeRes = await fetch(pokemon.url);
                const pokeData = await pokeRes.json();
                
                const basePrice = (pokeData.base_experience || 100) * 1;
                const type = pokeData.types.length > 0 ? pokeData.types[0].type.name : 'normal';
                const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
                
                return {
                    id: pokeData.id,
                    titleEn: name + " Card",
                    titleEs: name + " Carta",
                    descEn: `Excellent ${type} type card.`,
                    descEs: `Excelente carta tipo ${type}.`,
                    dateEn: "Available June 26, 2026 at 00:00",
                    dateEs: "Disponible el 26 de junio de 2026 a las 00:00",
                    priceOriginal: basePrice,
                    priceCash: Math.floor(basePrice * 0.9), // 10% discount
                    stock: (pokeData.id % 20) + 1,
                    image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                    sale: (pokeData.id % 3) === 0
                };
            });
            
            allProducts = await Promise.all(fetchPromises);
            
            // Initial render flow
            applyFilters();
            renderCarousel();

        } catch (error) {
            console.error("Error fetching from PokeAPI", error);
            if (productContainer) {
                productContainer.innerHTML = '<div class="col-12 text-center text-danger my-5">Error cargando cartas. Por favor, intenta de nuevo.</div>';
            }
        }
    }

    // Filters Logic
    function applyFilters() {
        const langSwitch = document.getElementById('lang-switch');
        const isEsp = langSwitch ? langSwitch.checked : false;
        const minPrice = parseFloat(document.getElementById('filter-price-min')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('filter-price-max')?.value) || 9999999;
        const searchTerm = document.getElementById('sidebar-search')?.value.toLowerCase() || '';

        filteredProducts = allProducts.filter(p => {
            const activeTitle = isEsp ? p.titleEs : p.titleEn;

            // Search
            if (searchTerm && !activeTitle.toLowerCase().includes(searchTerm)) return false;

            // Price
            if (p.priceCash < minPrice || p.priceCash > maxPrice) return false;
            
            return true;
        });

        currentPage = 1;
        applySort();
        renderProducts();
        updateActiveFiltersUI();
    }

    function applySort() {
        const sortVal = document.getElementById('sort-select')?.value || 'default';
        const langSwitch = document.getElementById('lang-switch');
        const isEsp = langSwitch ? langSwitch.checked : false;
        
        filteredProducts.sort((a, b) => {
            const aTitle = isEsp ? a.titleEs : a.titleEn;
            const bTitle = isEsp ? b.titleEs : b.titleEn;

            switch(sortVal) {
                case 'price-asc': return a.priceCash - b.priceCash;
                case 'price-desc': return b.priceCash - a.priceCash;
                case 'name-asc': return aTitle.localeCompare(bTitle);
                case 'name-desc': return bTitle.localeCompare(aTitle);
                default: return a.id - b.id; // 'default' / Más vendidos
            }
        });
    }

    function updateActiveFiltersUI() {
        const container = document.getElementById('active-filters-container');
        const clearBtn = document.getElementById('btn-clear-filters');
        if (!container || !clearBtn) return;
        
        // Remove existing chips
        container.querySelectorAll('.filter-chip').forEach(e => e.remove());
        
        let hasFilters = false;

        const addChip = (text, callback) => {
            hasFilters = true;
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.innerHTML = `${text} <span class="close-chip">&times;</span>`;
            chip.querySelector('.close-chip').addEventListener('click', callback);
            container.insertBefore(chip, clearBtn);
        };
        
        const minPrice = document.getElementById('filter-price-min')?.value;
        const maxPrice = document.getElementById('filter-price-max')?.value;
        if (minPrice || maxPrice) {
            let txt = '';
            if (minPrice && maxPrice) txt = `$${minPrice} - $${maxPrice}`;
            else if (minPrice) txt = `Desde $${minPrice}`;
            else if (maxPrice) txt = `Hasta $${maxPrice}`;
            
            addChip(txt, () => { 
                document.getElementById('filter-price-min').value = '';
                document.getElementById('filter-price-max').value = '';
                applyFilters(); 
            });
        }

        clearBtn.classList.toggle('d-none', !hasFilters);
    }

    // Event listeners for filters
    const langSwitch = document.getElementById('lang-switch');
    const labelEn = document.getElementById('label-en');
    const labelEs = document.getElementById('label-es');
    
    if (langSwitch) {
        langSwitch.addEventListener('change', () => {
            if (langSwitch.checked) {
                labelEs.classList.add('active');
                labelEn.classList.remove('active');
            } else {
                labelEn.classList.add('active');
                labelEs.classList.remove('active');
            }
            applyFilters();
        });
    }

    document.getElementById('btn-apply-price')?.addEventListener('click', applyFilters);
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        document.getElementById('filter-price-min').value = '';
        document.getElementById('filter-price-max').value = '';
        const searchInput = document.getElementById('sidebar-search');
        if (searchInput) searchInput.value = '';
        applyFilters();
    });

    // Sidebar Autocomplete Search
    const sidebarSearch = document.getElementById('sidebar-search');
    const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

    if (sidebarSearch && autocompleteDropdown) {
        sidebarSearch.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const langSwitch = document.getElementById('lang-switch');
            const isEsp = langSwitch ? langSwitch.checked : false;
            autocompleteDropdown.innerHTML = '';
            
            if (val.length === 0) {
                autocompleteDropdown.style.display = 'none';
                applyFilters();
                return;
            }

            const matches = allProducts.filter(p => {
                const activeTitle = isEsp ? p.titleEs : p.titleEn;
                return activeTitle.toLowerCase().includes(val);
            });
            const topMatches = matches.slice(0, 6);

            if (topMatches.length > 0) {
                topMatches.forEach(match => {
                    const activeTitle = isEsp ? match.titleEs : match.titleEn;
                    const li = document.createElement('li');
                    li.innerHTML = `<div class="autocomplete-item"><i class="bi bi-search"></i> ${activeTitle}</div>`;
                    li.addEventListener('click', () => {
                        sidebarSearch.value = activeTitle;
                        autocompleteDropdown.style.display = 'none';
                        applyFilters();
                    });
                    autocompleteDropdown.appendChild(li);
                });
                autocompleteDropdown.style.display = 'block';
            } else {
                autocompleteDropdown.style.display = 'none';
            }
            
            applyFilters();
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebarSearch.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                autocompleteDropdown.style.display = 'none';
            }
        });
    }

    // Top navbar search (fallback)
    const topSearchInput = document.querySelector('.search-form input[type="search"]');
    if (topSearchInput) {
        topSearchInput.addEventListener('input', (e) => {
            if (sidebarSearch) sidebarSearch.value = e.target.value;
            applyFilters();
        });
    }


    // 3. Render Views
    function renderCarousel() {
        const carouselInner = document.getElementById('carousel-inner-container');
        if (!carouselInner) return;
        
        carouselInner.innerHTML = '';
        
        // Use top 5 products for carousel
        const topProducts = allProducts.slice(0, 5);
        const langSwitch = document.getElementById('lang-switch');
        const isEsp = langSwitch ? langSwitch.checked : false;
        const txtDestacado = isEsp ? "¡Destacado!" : "Featured!";
        
        topProducts.forEach((product, index) => {
            const activeTitle = isEsp ? product.titleEs : product.titleEn;
            const itemDiv = document.createElement('div');
            itemDiv.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            itemDiv.innerHTML = `
                <img src="${product.image}" class="d-block w-100" alt="${activeTitle}">
                <div class="carousel-caption-custom">
                    <h3 class="fw-bold mb-0">${activeTitle}</h3>
                    <p class="mb-0 fs-5 text-warning">${txtDestacado}</p>
                </div>
            `;
            carouselInner.appendChild(itemDiv);
        });
    }

    function renderProducts() {
        if (!productContainer) return;
        productContainer.innerHTML = '';

        if (totalCountBadge) {
            totalCountBadge.textContent = filteredProducts.length;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentProducts = filteredProducts.slice(startIndex, endIndex);

        const langSwitch = document.getElementById('lang-switch');
        const isEsp = langSwitch ? langSwitch.checked : false;

        if (currentProducts.length === 0) {
            const noResultsTxt = isEsp ? "No se encontraron productos con estos filtros." : "No products found with these filters.";
            productContainer.innerHTML = `<div class="col-12 text-center my-5 text-muted">${noResultsTxt}</div>`;
            renderPagination();
            return;
        }

        if (currentView === 'grid') {
            productContainer.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4 mb-5';
            currentProducts.forEach(product => {
                const activeTitle = isEsp ? product.titleEs : product.titleEn;
                const activeDesc = isEsp ? product.descEs : product.descEn;
                const activeDate = isEsp ? product.dateEs : product.dateEn;
                const txtCash = isEsp ? "En efectivo" : "Cash";
                const txtStock = isEsp ? "Stock disponible" : "Available Stock";
                const txtBuy = isEsp ? "Precómpralo ahora" : "Pre-order now";
                const txtSale = isEsp ? "¡Oferta!" : "Sale!";
                
                const col = document.createElement('div');
                col.className = 'col';

                const originalPriceHtml = product.priceOriginal && product.priceOriginal !== product.priceCash 
                    ? `<div class="price-original">$ ${product.priceOriginal.toLocaleString('es-AR')}</div>` 
                    : '';
                    
                const saleBadgeHtml = product.sale ? `<div class="sale-badge">${txtSale}</div>` : '';

                col.innerHTML = `
                    <div class="card product-card">
                        <div class="product-img-container">
                            ${saleBadgeHtml}
                            <a href="product.html?id=${product.id}">
                                <img src="${product.image}" alt="${activeTitle}">
                            </a>
                        </div>
                        <div class="card-body">
                            <div class="product-date">${activeDate}</div>
                            <div class="product-title"><a href="product.html?id=${product.id}" class="text-decoration-none text-dark">${activeTitle}</a></div>
                            <div class="product-description text-muted small mb-2">${activeDesc}</div>
                            ${originalPriceHtml}
                            <div class="price-cash">${txtCash}: $ ${product.priceCash.toLocaleString('es-AR')}</div>
                            <div class="stock-info">${txtStock}: ${product.stock}</div>
                            
                            <div class="d-flex align-items-center mb-2 mt-auto">
                                <button class="btn btn-qty btn-minus" data-id="${product.id}">-</button>
                                <input type="number" class="form-control qty-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}">
                                <button class="btn btn-qty btn-plus" data-id="${product.id}">+</button>
                            </div>
                            <button class="btn btn-preorder w-100" data-id="${product.id}">${txtBuy}</button>
                        </div>
                    </div>
                `;
                productContainer.appendChild(col);
            });
        } else {
            // List View
            productContainer.className = 'table-responsive w-100 mb-5';
            
            const table = document.createElement('table');
            table.className = 'table table-bordered table-hover align-middle bg-white shadow-sm';
            
            const txtCode = isEsp ? "CÓDIGO" : "CODE";
            const txtDesc = isEsp ? "DESCRIPCIÓN" : "DESCRIPTION";
            const txtUnit = isEsp ? "P. UNITARIO" : "UNIT PRICE";
            const txtAction = isEsp ? "ACCIONES" : "ACTIONS";
            const txtStock = isEsp ? "Stock" : "Stock";
            const txtAdd = isEsp ? "Agregar" : "Add";
            
            let tbodyHtml = '';
            currentProducts.forEach(product => {
                const activeTitle = isEsp ? product.titleEs : product.titleEn;
                const activeDesc = isEsp ? product.descEs : product.descEn;

                tbodyHtml += `
                    <tr>
                        <td class="text-center fw-bold text-muted">${10000 + product.id}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <a href="product.html?id=${product.id}">
                                    <img src="${product.image}" alt="${activeTitle}" style="width: 50px; height: 50px; object-fit: contain;" class="me-3">
                                </a>
                                <div>
                                    <div class="fw-bold fs-6"><a href="product.html?id=${product.id}" class="text-decoration-none text-dark">${activeTitle}</a></div>
                                    <small class="text-muted">${activeDesc} | ${txtStock}: ${product.stock}</small>
                                </div>
                            </div>
                        </td>
                        <td class="fw-bold text-success">$ ${product.priceCash.toLocaleString('es-AR')}</td>
                        <td>
                            <div class="d-flex align-items-center justify-content-end">
                                <div class="d-flex align-items-center me-3">
                                    <button class="btn btn-sm btn-light border btn-minus" data-id="${product.id}">-</button>
                                    <input type="number" class="form-control form-control-sm text-center mx-1 qty-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}" style="width: 55px;">
                                    <button class="btn btn-sm btn-light border btn-plus" data-id="${product.id}">+</button>
                                </div>
                                <button class="btn btn-sm btn-dark btn-preorder" data-id="${product.id}">${txtAdd}</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            table.innerHTML = `
                <thead style="background-color: #f6c08e;">
                    <tr>
                        <th class="text-center">${txtCode}</th>
                        <th>${txtDesc}</th>
                        <th>${txtUnit}</th>
                        <th class="text-end">${txtAction}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tbodyHtml}
                </tbody>
            `;
            
            productContainer.appendChild(table);
        }

        renderPagination();

        // Add event listeners for quantity buttons
        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const input = document.getElementById(`qty-${id}`);
                if (parseInt(input.value) > 1) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });

        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const input = document.getElementById(`qty-${id}`);
                const max = parseInt(input.getAttribute('max'));
                if (parseInt(input.value) < max) {
                    input.value = parseInt(input.value) + 1;
                }
            });
        });

        // Add event listeners for "Precompralo ahora"
        document.querySelectorAll('.btn-preorder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const qty = parseInt(document.getElementById(`qty-${id}`).value);
                addToCart(id, qty);
            });
        });
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (totalPages <= 1) return;

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<button class="page-link">&larr;</button>`;
        prevLi.addEventListener('click', () => { 
            if (currentPage > 1) { 
                currentPage--; 
                renderProducts(); 
                document.getElementById('product-container').scrollIntoView({behavior: "smooth"}); 
            }
        });
        paginationContainer.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<button class="page-link">${i}</button>`;
            li.addEventListener('click', () => { 
                currentPage = i; 
                renderProducts(); 
                document.getElementById('product-container').scrollIntoView({behavior: "smooth"}); 
            });
            paginationContainer.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<button class="page-link">&rarr;</button>`;
        nextLi.addEventListener('click', () => { 
            if (currentPage < totalPages) { 
                currentPage++; 
                renderProducts(); 
                document.getElementById('product-container').scrollIntoView({behavior: "smooth"}); 
            }
        });
        paginationContainer.appendChild(nextLi);
    }

    // 4. Cart Logic
    const cartStorageKey = `tcg_cart_${currentUser.email}`;
    let cart = JSON.parse(localStorage.getItem(cartStorageKey)) || [];

    function saveCart() {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        updateCartUI();
    }

    function addToCart(productId, qty) {
        // Use allProducts as the source of truth
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.product.id === productId);
        
        if (existingItem) {
            // Check stock limit
            if (existingItem.qty + qty > product.stock) {
                alert(`No puedes agregar más de ${product.stock} unidades de este producto.`);
                existingItem.qty = product.stock;
            } else {
                existingItem.qty += qty;
            }
        } else {
            cart.push({ product: product, qty: qty });
        }
        
        saveCart();
        
        // Open the offcanvas automatically when adding an item
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.product.id !== productId);
        saveCart();
    }

    // 5. Update UI (Cart)
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartTotalBadge = document.getElementById('cart-total-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartTotalPriceEl = document.getElementById('cart-total-price');

    function updateCartUI() {
        // Calculate totals
        let totalQty = 0;
        let totalPrice = 0;
        
        cart.forEach(item => {
            totalQty += item.qty;
            totalPrice += (item.product.priceCash * item.qty);
        });

        // Update Nav Badges
        cartCountBadge.textContent = totalQty;
        cartTotalBadge.textContent = totalPrice.toLocaleString('es-AR');
        cartTotalPriceEl.textContent = totalPrice.toLocaleString('es-AR');

        // Update Cart Offcanvas List
        if (cart.length === 0) {
            emptyCartMsg.style.display = 'block';
            cartItemsContainer.innerHTML = '';
            cartItemsContainer.appendChild(emptyCartMsg);
        } else {
            emptyCartMsg.style.display = 'none';
            cartItemsContainer.innerHTML = '';
            
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item d-flex align-items-center';
                itemEl.innerHTML = `
                    <img src="${item.product.image}" class="cart-item-img me-3" alt="${item.product.title}">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fs-6" style="font-size: 0.9rem !important;">${item.product.title}</h6>
                        <small class="text-muted">${item.qty} x $${item.product.priceCash.toLocaleString('es-AR')}</small>
                    </div>
                    <div class="ms-2 text-end">
                        <div class="fw-bold">$${(item.qty * item.product.priceCash).toLocaleString('es-AR')}</div>
                        <button class="btn-remove-cart small" data-id="${item.product.id}">Eliminar</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            // Add event listeners to remove buttons
            document.querySelectorAll('.btn-remove-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    removeFromCart(id);
                });
            });
        }
    }

    // Initial load
    fetchAllProducts();
    updateCartUI();
});
