// public/js/cart.js

const cartItemsDiv = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const checkoutMessage = document.getElementById('checkout-message');
const cartCountHeader = document.getElementById('cart-count'); // Para el contador en el header

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Función para actualizar el contador del carrito en el header
function updateCartCountInHeader() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountHeader) { // Asegurarse de que el elemento existe (puede no estar en todas las páginas)
        cartCountHeader.textContent = totalItems;
    }
}

// Función para guardar el carrito en localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountInHeader();
    renderCart(); // Volver a renderizar el carrito después de guardar
}

// Función para actualizar la cantidad de un producto en el carrito
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id_producto === productId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0 && newQuantity <= item.stock) {
            item.quantity = newQuantity;
        } else if (newQuantity === 0) {
            // Si la cantidad llega a 0, eliminar el producto del carrito
            cart = cart.filter(i => i.id_producto !== productId);
        } else if (newQuantity > item.stock) {
            alert(`No puedes añadir más de "${item.nombre}". Stock disponible: ${item.stock}`);
        }
        saveCart();
    }
}

// Función para renderizar los ítems del carrito
function renderCart() {
    cartItemsDiv.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Tu carrito está vacío.</p>';
        cartTotalSpan.textContent = '0.00';
        checkoutButton.disabled = true; // Deshabilitar el botón si el carrito está vacío
        return;
    }

    checkoutButton.disabled = false; // Habilitar el botón si hay ítems

    cart.forEach(item => {
        const itemTotal = item.precio * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="cart-item-details">
                <h4>${item.nombre}</h4>
                <p>Precio Unitario: $${item.precio.toFixed(2)}</p>
                <p>Subtotal: $${itemTotal.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <button data-id="${item.id_producto}" data-action="decrease">-</button>
                <input type="number" value="${item.quantity}" min="1" max="${item.stock}" data-id="${item.id_producto}" class="item-quantity-input">
                <button data-id="${item.id_producto}" data-action="increase">+</button>
                <button data-id="${item.id_producto}" data-action="remove">Eliminar</button>
            </div>
        `;
        cartItemsDiv.appendChild(cartItemDiv);
    });

    cartTotalSpan.textContent = total.toFixed(2);

    // Añadir event listeners a los botones de control de cantidad y eliminar
    cartItemsDiv.querySelectorAll('button[data-action="increase"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            updateQuantity(productId, 1);
        });
    });

    cartItemsDiv.querySelectorAll('button[data-action="decrease"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            updateQuantity(productId, -1);
        });
    });

    cartItemsDiv.querySelectorAll('button[data-action="remove"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            cart = cart.filter(item => item.id_producto !== productId);
            saveCart();
            alert(`Producto eliminado del carrito.`);
        });
    });

    // Event listener para el input de cantidad
    cartItemsDiv.querySelectorAll('.item-quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const productId = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            const item = cart.find(i => i.id_producto === productId);
            
            if (item) {
                if (newQuantity > 0 && newQuantity <= item.stock) {
                    item.quantity = newQuantity;
                    saveCart();
                } else if (newQuantity === 0) {
                     cart = cart.filter(i => i.id_producto !== productId);
                     saveCart();
                }
                else {
                    alert(`Cantidad inválida. El stock máximo para "${item.nombre}" es ${item.stock}.`);
                    e.target.value = item.quantity; // Restaura el valor anterior
                }
            }
        });
    });
}

// Función para confirmar el pedido
checkoutButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        checkoutMessage.textContent = 'Debes iniciar sesión para confirmar el pedido.';
        checkoutMessage.style.color = 'red';
        return;
    }

    if (cart.length === 0) {
        checkoutMessage.textContent = 'El carrito está vacío. Añade productos para hacer un pedido.';
        checkoutMessage.style.color = 'orange';
        return;
    }

    try {
        const response = await fetch('/api/pedidos', { // Endpoint actualizado
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items: cart }) // Enviar los ítems del carrito
        });

        const result = await response.json();

        if (response.ok) {
            checkoutMessage.textContent = result.message + ` ID de Pedido: ${result.id_pedido}`;
            checkoutMessage.style.color = 'green';
            cart = []; // Vaciar el carrito después de un pedido exitoso
            saveCart(); // Guardar el carrito vacío en localStorage y renderizar
            alert('¡Pedido realizado con éxito! Gracias por tu compra.');
        } else {
            checkoutMessage.textContent = result.message || 'Error al procesar el pedido.';
            checkoutMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error al confirmar pedido:', error);
        checkoutMessage.textContent = 'Error de conexión con el servidor.';
        checkoutMessage.style.color = 'red';
    }
});

// Cargar el carrito y actualizar el contador al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateCartCountInHeader(); // Actualizar el contador del carrito en el header
    if (window.location.pathname === '/cart.html') { // Solo renderizar en la página del carrito
        renderCart();
    }
});

