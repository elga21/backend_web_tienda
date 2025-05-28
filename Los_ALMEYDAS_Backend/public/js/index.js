// public/js/index.js

const productListDiv = document.getElementById('product-list');
const cartCountSpan = document.getElementById('cart-count'); // Para el contador del carrito en el header

let cart = JSON.parse(localStorage.getItem('cart')) || []; // Cargar carrito desde localStorage

// Función para actualizar el contador del carrito en el header
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalItems;
}

// Función para añadir un producto al carrito
function addToCart(product) {
    const existingItem = cart.find(item => item.id_producto === product.id_producto);

    if (existingItem) {
        if (existingItem.quantity < product.stock) { // Verificar stock antes de añadir
            existingItem.quantity++;
            alert(`"${product.nombre}" añadido al carrito. Cantidad actual: ${existingItem.quantity}`);
        } else {
            alert(`No hay suficiente stock para "${product.nombre}". Stock disponible: ${product.stock}`);
            return; // No añadir si no hay stock
        }
    } else {
        if (product.stock > 0) { // Solo añadir si hay stock inicial
            cart.push({ ...product, quantity: 1 });
            alert(`"${product.nombre}" añadido al carrito.`);
        } else {
            alert(`El producto "${product.nombre}" está agotado.`);
            return;
        }
    }
    localStorage.setItem('cart', JSON.stringify(cart)); // Guardar carrito actualizado
    updateCartCount(); // Actualizar el contador
}

// Función para cargar y mostrar productos
async function loadProducts() {
    try {
        const response = await fetch('/api/productos'); // Endpoint actualizado
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        productListDiv.innerHTML = ''; // Limpiar la lista antes de añadir
        if (products.length === 0) {
            productListDiv.innerHTML = '<p>No hay productos disponibles en este momento.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <h3>${product.nombre}</h3>
                <p>${product.descripcion || 'Sin descripción'}</p>
                <p class="price">$${product.precio.toFixed(2)}</p>
                <p class="stock">Stock: ${product.stock}</p>
                <p>Categoría: ${product.categoria_nombre}</p>
                <button class="add-to-cart-btn" data-id="${product.id_producto}" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
                </button>
            `;
            productListDiv.appendChild(productCard);
        });

        // Añadir event listeners a los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.id);
                const selectedProduct = products.find(p => p.id_producto === productId);
                if (selectedProduct) {
                    addToCart(selectedProduct);
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar los productos:', error);
        productListDiv.innerHTML = '<p>Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
    }
}

// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount(); // Actualizar el contador del carrito al cargar la página
});
