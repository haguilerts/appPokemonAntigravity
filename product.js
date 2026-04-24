// product.js

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
    if (userNameDisplay) userNameDisplay.textContent = `Hola, ${currentUser.name}`;

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // 2. Fetch Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'store.html'; // No ID, go back to store
        return;
    }

    // 3. Fetch Data from PokeAPI
    let currentProduct = null;
    let relatedProducts = [];
    
    async function fetchProductDetails() {
        try {
            const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${productId}`);
            if (!pokeRes.ok) throw new Error('Product not found');
            const pokeData = await pokeRes.json();
            
            // Generamos un precio y stock predecible para la tienda
            const basePrice = (pokeData.base_experience || 100) * 1000;
            const type = pokeData.types.length > 0 ? pokeData.types[0].type.name : 'normal';
            
            currentProduct = {
                id: pokeData.id,
                title: pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1) + " Card",
                description: `Excelente carta tipo ${type}.`,
                date: "Disponible el 26 de junio de 2026 a las 00:00",
                priceOriginal: basePrice,
                priceCash: Math.floor(basePrice * 0.9), // 10% discount
                stock: (pokeData.id % 20) + 1,
                image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                sale: (pokeData.id % 3) === 0
            };
            
            renderProductDetails();
            
        } catch (error) {
            console.error("Error fetching from PokeAPI", error);
            document.getElementById('product-detail-container').innerHTML = '<div class="col-12 text-center text-danger my-5">Error cargando detalles del producto.</div>';
        }
    }

    // 4. Render Details
    function renderProductDetails() {
        // Update breadcrumb
        document.getElementById('breadcrumb-title').textContent = currentProduct.title;
        
        // Hide spinner
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'none';

        const originalPriceHtml = currentProduct.priceOriginal !== currentProduct.priceCash 
            ? `<div class="fs-4 text-muted" style="text-decoration: line-through;">$ ${currentProduct.priceOriginal.toLocaleString('es-AR')}</div>` 
            : '';

        const html = `
            <div class="col-md-5 mb-4">
                <div class="product-large-img d-flex align-items-center justify-content-center h-100 position-relative">
                    ${currentProduct.sale ? '<div class="sale-badge" style="font-size: 1rem; padding: 5px 15px;">¡Oferta!</div>' : ''}
                    <img src="${currentProduct.image}" alt="${currentProduct.title}" class="img-fluid" style="max-height: 500px; object-fit: contain;">
                </div>
            </div>
            <div class="col-md-7 px-md-5">
                <h1 class="fw-bold mb-3">${currentProduct.title}</h1>
                <p class="fs-5 text-secondary mb-4">${currentProduct.description}</p>
                
                <div class="mb-4">
                    ${originalPriceHtml}
                    <div class="fw-bold text-success" style="font-size: 2rem;">En efectivo: $ ${currentProduct.priceCash.toLocaleString('es-AR')}</div>
                </div>
                
                <div class="fs-5 mb-4">
                    <strong>Stock disponible:</strong> ${currentProduct.stock}
                </div>
                
                <div class="text-muted mb-4">
                    <i class="bi bi-clock"></i> ${currentProduct.date}
                </div>
                
                <div class="d-flex align-items-center mb-4" style="max-width: 300px;">
                    <button class="btn btn-light border px-3 py-2 fs-5" id="detail-btn-minus">-</button>
                    <input type="number" class="form-control text-center mx-2 fs-5" id="detail-qty" value="1" min="1" max="${currentProduct.stock}">
                    <button class="btn btn-light border px-3 py-2 fs-5" id="detail-btn-plus">+</button>
                </div>
                
                <button class="btn btn-dark w-100 py-3 fs-5 fw-bold" id="detail-btn-preorder">Precómpralo ahora</button>
            </div>
        `;
        
        const container = document.getElementById('product-detail-container');
        container.innerHTML = html;

        // Add event listeners for the new DOM elements
        const inputQty = document.getElementById('detail-qty');
        
        document.getElementById('detail-btn-minus').addEventListener('click', () => {
            let val = parseInt(inputQty.value);
            if (val > 1) inputQty.value = val - 1;
        });

        document.getElementById('detail-btn-plus').addEventListener('click', () => {
            let val = parseInt(inputQty.value);
            if (val < currentProduct.stock) inputQty.value = val + 1;
        });

        document.getElementById('detail-btn-preorder').addEventListener('click', () => {
            addToCart(currentProduct, parseInt(inputQty.value));
        });
    }

    async function fetchRelatedProducts() {
        try {
            const baseId = parseInt(productId);
            const fetchPromises = [];
            for (let i = 1; i <= 12; i++) {
                let relatedId = baseId + i;
                if (relatedId > 1025) relatedId = relatedId % 1025 || 1;
                fetchPromises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${relatedId}`).then(res => res.json()));
            }
            
            const results = await Promise.all(fetchPromises);
            
            relatedProducts = results.map(pokeData => {
                const basePrice = (pokeData.base_experience || 100) * 1000;
                const type = pokeData.types.length > 0 ? pokeData.types[0].type.name : 'normal';
                
                return {
                    id: pokeData.id,
                    title: pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1) + " Card",
                    description: `Excelente carta tipo ${type}.`,
                    date: "Disponible el 26 de junio de 2026 a las 00:00",
                    priceOriginal: basePrice,
                    priceCash: Math.floor(basePrice * 0.9),
                    stock: (pokeData.id % 20) + 1,
                    image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                    sale: (pokeData.id % 3) === 0
                };
            });
            
            renderRelatedProducts();
        } catch (error) {
            console.error("Error fetching related products", error);
        }
    }

    function renderRelatedProducts() {
        const container = document.getElementById('related-products-container');
        const section = document.getElementById('related-products-section');
        if (!container || !section) return;
        
        container.innerHTML = '';
        
        const chunkSize = 4;
        for (let i = 0; i < relatedProducts.length; i += chunkSize) {
            const chunk = relatedProducts.slice(i, i + chunkSize);
            
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item ${i === 0 ? 'active' : ''}`;
            
            const row = document.createElement('div');
            row.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4 px-2';
            
            chunk.forEach(product => {
                const col = document.createElement('div');
                col.className = 'col';

                const originalPriceHtml = product.priceOriginal !== product.priceCash 
                    ? `<div class="price-original">$ ${product.priceOriginal.toLocaleString('es-AR')}</div>` 
                    : '';
                    
                const saleBadgeHtml = product.sale ? `<div class="sale-badge">¡Oferta!</div>` : '';

                col.innerHTML = `
                    <div class="card product-card h-100">
                        <div class="product-img-container">
                            ${saleBadgeHtml}
                            <a href="product.html?id=${product.id}">
                                <img src="${product.image}" alt="${product.title}">
                            </a>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <div class="product-date">${product.date}</div>
                            <div class="product-title"><a href="product.html?id=${product.id}" class="text-decoration-none text-dark">${product.title}</a></div>
                            ${originalPriceHtml}
                            <div class="price-cash">En efectivo: $ ${product.priceCash.toLocaleString('es-AR')}</div>
                            <div class="stock-info">Stock disponible: ${product.stock}</div>
                            
                            <div class="d-flex align-items-center mb-2 mt-auto">
                                <button class="btn btn-qty btn-minus-rel" data-id="${product.id}">-</button>
                                <input type="number" class="form-control qty-input" id="qty-rel-${product.id}" value="1" min="1" max="${product.stock}">
                                <button class="btn btn-qty btn-plus-rel" data-id="${product.id}">+</button>
                            </div>
                            <button class="btn btn-preorder w-100 btn-preorder-rel" data-id="${product.id}">Precómpralo ahora</button>
                        </div>
                    </div>
                `;
                row.appendChild(col);
            });
            
            carouselItem.appendChild(row);
            container.appendChild(carouselItem);
        }
        
        section.classList.remove('d-none');
        
        document.querySelectorAll('.btn-minus-rel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const input = document.getElementById(`qty-rel-${id}`);
                if (parseInt(input.value) > 1) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });

        document.querySelectorAll('.btn-plus-rel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const input = document.getElementById(`qty-rel-${id}`);
                const max = parseInt(input.getAttribute('max'));
                if (parseInt(input.value) < max) {
                    input.value = parseInt(input.value) + 1;
                }
            });
        });

        document.querySelectorAll('.btn-preorder-rel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const qty = parseInt(document.getElementById(`qty-rel-${id}`).value);
                const relProduct = relatedProducts.find(p => p.id === id);
                if(relProduct) addToCart(relProduct, qty);
            });
        });
    }

    // 5. Cart Logic
    const cartStorageKey = `tcg_cart_${currentUser.email}`;
    let cart = JSON.parse(localStorage.getItem(cartStorageKey)) || [];

    function saveCart() {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        updateCartUI();
    }

    function addToCart(product, qty) {
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
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
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.product.id !== productId);
        saveCart();
    }

    // 6. Update UI (Cart)
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartTotalBadge = document.getElementById('cart-total-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartTotalPriceEl = document.getElementById('cart-total-price');

    function updateCartUI() {
        let totalQty = 0;
        let totalPrice = 0;
        
        cart.forEach(item => {
            totalQty += item.qty;
            totalPrice += (item.product.priceCash * item.qty);
        });

        cartCountBadge.textContent = totalQty;
        cartTotalBadge.textContent = totalPrice.toLocaleString('es-AR');
        cartTotalPriceEl.textContent = totalPrice.toLocaleString('es-AR');

        if (cart.length === 0) {
            emptyCartMsg.style.display = 'block';
            cartItemsContainer.innerHTML = '';
            cartItemsContainer.appendChild(emptyCartMsg);
        } else {
            emptyCartMsg.style.display = 'none';
            cartItemsContainer.innerHTML = '';
            
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item d-flex align-items-center mb-3 pb-3 border-bottom';
                itemEl.innerHTML = `
                    <img src="${item.product.image}" class="cart-item-img me-3" style="width: 60px; height: 60px; object-fit: contain;" alt="${item.product.title}">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fs-6" style="font-size: 0.9rem !important;">${item.product.title}</h6>
                        <small class="text-muted">${item.qty} x $${item.product.priceCash.toLocaleString('es-AR')}</small>
                    </div>
                    <div class="ms-2 text-end">
                        <div class="fw-bold">$${(item.qty * item.product.priceCash).toLocaleString('es-AR')}</div>
                        <button class="btn btn-link text-danger p-0 mt-1 small remove-from-cart-btn" data-id="${item.product.id}" style="font-size: 0.8rem; text-decoration: none;">Eliminar</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    removeFromCart(id);
                });
            });
        }
    }

    // Initialize
    fetchProductDetails();
    fetchRelatedProducts();
    updateCartUI();
});
