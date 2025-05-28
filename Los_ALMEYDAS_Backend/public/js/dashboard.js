// public/js/dashboard.js

const productForm = document.getElementById('product-form');
const productMessage = document.getElementById('product-message');
const productListAdminDiv = document.getElementById('product-list-admin');

// Función para verificar si el usuario es admin
function checkAdminStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden ver este panel.');
        window.location.href = '/auth.html'; // Redirigir al login si no es admin
    }
}

// Función para registrar un nuevo producto
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const data = Object.fromEntries(formData.entries());

    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        productMessage.textContent = 'Error: No autenticado.';
        productMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/api/productos', { // Endpoint actualizado
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Incluir el token en el encabezado
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            productMessage.textContent = result.message;
            productMessage.style.color = 'green';
            productForm.reset();
            loadProductsAdmin(); // Recargar la lista de productos
        } else {
            productMessage.textContent = result.message || 'Error al registrar el producto.';
            productMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error al registrar producto:', error);
        productMessage.textContent = 'Error de conexión con el servidor.';
        productMessage.style.color = 'red';
    }
});

// Función para cargar y mostrar productos en el dashboard (solo admin)
async function loadProductsAdmin() {
    try {
        const response = await fetch('/api/productos'); // Endpoint actualizado
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        productListAdminDiv.innerHTML = '';
        if (products.length === 0) {
            productListAdminDiv.innerHTML = '<p>No hay productos registrados.</p>';
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
                `;
            productListAdminDiv.appendChild(productCard);
        });

    } catch (error) {
        console.error('Error al cargar los productos para admin:', error);
        productListAdminDiv.innerHTML = '<p>Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
    }
}

// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus(); // Verificar rol al cargar la página
    loadProductsAdmin(); // Cargar productos para el dashboard
});
