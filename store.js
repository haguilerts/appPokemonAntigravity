// store.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        // Not logged in, redirect to login page
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

    // 2. Product Data (Fetched from PokeAPI)
    let products = [];
    let currentOffset = 0;
    const limit = 8;
    let totalCount = 0;
    let currentView = 'grid'; // 'grid' or 'list'

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const totalCountBadge = document.getElementById('total-count-badge');
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');

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

    async function fetchProducts(offset = 0) {
        const productContainer = document.getElementById('product-container');
        if (productContainer) {
            productContainer.innerHTML = '<div class="col-12 text-center my-5"><div class="spinner-border text-secondary" role="status"></div><p class="mt-2 text-muted">Cargando cartas...</p></div>';
        }
        
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
            const data = await response.json();
            
            totalCount = data.count;
            if (totalCountBadge) {
                totalCountBadge.textContent = `${totalCount} en total`;
            }
            
            const fetchPromises = data.results.map(async (pokemon, index) => {
                const pokeRes = await fetch(pokemon.url);
                const pokeData = await pokeRes.json();
                
                // Generamos un precio y stock aleatorio para la tienda
                const basePrice = (pokeData.base_experience || 100) * 1000;
                const type = pokeData.types.length > 0 ? pokeData.types[0].type.name : 'normal';
                
                return {
                    id: pokeData.id,
                    title: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1) + " Card",
                    description: `Excelente carta tipo ${type}.`,
                    date: "Disponible el " + new Date().toLocaleDateString('es-AR'),
                    priceOriginal: basePrice,
                    priceCash: Math.floor(basePrice * 0.9), // 10% discount
                    stock: Math.floor(Math.random() * 20) + 1,
                    image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                    sale: Math.random() > 0.7
                };
            });
            
            products = await Promise.all(fetchPromises);
            renderProducts();
            renderCarousel();
            
            if (btnPrev) btnPrev.disabled = offset === 0;
            if (btnNext) btnNext.disabled = offset + limit >= totalCount;

        } catch (error) {
            console.error("Error fetching from PokeAPI", error);
            const productContainer = document.getElementById('product-container');
            if (productContainer) {
                productContainer.innerHTML = '<div class="col-12 text-center text-danger my-5">Error cargando cartas. Por favor, intenta de nuevo.</div>';
            }
        }
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentOffset >= limit) {
                currentOffset -= limit;
                fetchProducts(currentOffset);
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentOffset + limit < totalCount) {
                currentOffset += limit;
                fetchProducts(currentOffset);
            }
        });
    }

    // 3. Render Products
    const productContainer = document.getElementById('product-container');
    
    function renderCarousel() {
        const carouselInner = document.getElementById('carousel-inner-container');
        if (!carouselInner) return;
        
        carouselInner.innerHTML = '';
        
        products.forEach((product, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            itemDiv.innerHTML = `
                <img src="${product.image}" class="d-block w-100" alt="${product.title}">
                <div class="carousel-caption-custom">
                    <h3 class="fw-bold mb-0">${product.title}</h3>
                    <p class="mb-0 fs-5 text-warning">¡Destacado!</p>
                </div>
            `;
            carouselInner.appendChild(itemDiv);
        });
    }

    function renderProducts() {
        if (!productContainer) return;
        productContainer.innerHTML = '';

        if (currentView === 'grid') {
            productContainer.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4';
            products.forEach(product => {
                const col = document.createElement('div');
                col.className = 'col';

                const originalPriceHtml = product.priceOriginal && product.priceOriginal !== product.priceCash 
                    ? `<div class="price-original">$ ${product.priceOriginal.toLocaleString('es-AR')}</div>` 
                    : '';
                    
                const saleBadgeHtml = product.sale ? `<div class="sale-badge">¡Oferta!</div>` : '';

                col.innerHTML = `
                    <div class="card product-card">
                        <div class="product-img-container">
                            ${saleBadgeHtml}
                            <img src="${product.image}" alt="${product.title}">
                        </div>
                        <div class="card-body">
                            <div class="product-date">${product.date}</div>
                            <div class="product-title">${product.title}</div>
                            <div class="product-description text-muted small mb-2">${product.description}</div>
                            ${originalPriceHtml}
                            <div class="price-cash">En efectivo: $ ${product.priceCash.toLocaleString('es-AR')}</div>
                            <div class="stock-info">Stock disponible: ${product.stock}</div>
                            
                            <div class="d-flex align-items-center mb-2 mt-auto">
                                <button class="btn btn-qty btn-minus" data-id="${product.id}">-</button>
                                <input type="number" class="form-control qty-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}">
                                <button class="btn btn-qty btn-plus" data-id="${product.id}">+</button>
                            </div>
                            <button class="btn btn-preorder w-100" data-id="${product.id}">Precómpralo ahora</button>
                        </div>
                    </div>
                `;
                productContainer.appendChild(col);
            });
        } else {
            // List View
            productContainer.className = 'table-responsive w-100';
            
            const table = document.createElement('table');
            table.className = 'table table-bordered table-hover align-middle bg-white shadow-sm';
            
            let tbodyHtml = '';
            products.forEach(product => {
                tbodyHtml += `
                    <tr>
                        <td class="text-center fw-bold text-muted">${10000 + product.id}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${product.image}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: contain;" class="me-3">
                                <div>
                                    <div class="fw-bold fs-6">${product.title}</div>
                                    <small class="text-muted">${product.description} | Stock: ${product.stock}</small>
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
                                <button class="btn btn-sm btn-dark btn-preorder" data-id="${product.id}">Agregar</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            table.innerHTML = `
                <thead style="background-color: #f6c08e;">
                    <tr>
                        <th class="text-center">CODIGO</th>
                        <th>DESCRIPCION</th>
                        <th>P. UNITARIO</th>
                        <th class="text-end">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    ${tbodyHtml}
                </tbody>
            `;
            
            productContainer.appendChild(table);
        }

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

        // Add event listeners for "Precompralo ahora" (Add to cart)
        document.querySelectorAll('.btn-preorder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const qty = parseInt(document.getElementById(`qty-${id}`).value);
                addToCart(id, qty);
            });
        });
    }

    // 4. Cart Logic
    const cartStorageKey = `tcg_cart_${currentUser.email}`;
    let cart = JSON.parse(localStorage.getItem(cartStorageKey)) || [];

    function saveCart() {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        updateCartUI();
    }

    function addToCart(productId, qty) {
        const product = products.find(p => p.id === productId);
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

    // 5. Update UI
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

    // Initial render
    fetchProducts();
    updateCartUI();
});
