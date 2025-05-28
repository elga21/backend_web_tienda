document.addEventListener('DOMContentLoaded', () => {
    // Elementos de formularios y mensajes
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const productForm = document.getElementById('productForm');
    const logoutButton = document.getElementById('logoutButton');

    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    const productMessage = document.getElementById('productMessage');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // Elementos para la página principal de productos (el nuevo index.html)
    const productsContainer = document.getElementById('productsContainer'); // El main que contiene todo
    const productGrid = document.querySelector('.product-grid'); // El div donde se insertan las tarjetas de producto
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const noProductsMessage = document.getElementById('noProductsMessage');


    // Función para mostrar mensajes
    const showMessage = (element, message, type) => {
        if (element) {
            element.textContent = message;
            element.className = `message ${type}`;
            element.style.display = 'block'; // Asegura que el mensaje sea visible
        }
    };

    // Función para ocultar un mensaje
    const hideMessage = (element) => {
        if (element) {
            element.style.display = 'none';
        }
    };

    // =====================================================================================
    // LÓGICA DE CARGA DE PRODUCTOS (para el nuevo index.html)
    // =====================================================================================
    const fetchAndDisplayProducts = async () => {
        if (productsContainer) { // Solo si estamos en la página principal de productos
            hideMessage(errorMessage);
            hideMessage(noProductsMessage);
            if (loadingMessage) loadingMessage.style.display = 'block'; // Muestra el cargando

            try {
                const response = await fetch('/products'); // Pide los productos al backend
                const products = await response.json();

                if (!response.ok) {
                    throw new Error(products.message || 'Error al cargar productos');
                }

                if (loadingMessage) loadingMessage.style.display = 'none'; // Oculta el cargando

                if (products.length === 0) {
                    showMessage(noProductsMessage, 'No hay productos disponibles en este momento.', 'info');
                    productGrid.innerHTML = ''; // Limpiar cualquier producto previo
                    return;
                }

                productGrid.innerHTML = ''; // Limpiar productos existentes antes de añadir nuevos
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <h3>${product.nombre}</h3>
                        <p><strong>Referencia:</strong> ${product.referencia}</p>
                        <p><strong>Descripción:</strong> ${product.descripcion || 'Sin descripción'}</p>
                        <p><strong>Precio:</strong> $${parseFloat(product.precio).toFixed(2)}</p>
                        <p><strong>Cantidad:</strong> ${product.cantidad}</p>
                    `;
                    productGrid.appendChild(productCard);
                });

            } catch (error) {
                console.error('Error al obtener productos:', error);
                if (loadingMessage) loadingMessage.style.display = 'none';
                showMessage(errorMessage, 'No se pudieron cargar los productos. Inténtalo de nuevo más tarde.', 'error');
            }
        }
    };

    // Ejecutar la carga de productos si estamos en la página principal (index.html)
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        fetchAndDisplayProducts();
    }


    // =====================================================================================
    // LÓGICA DE REGISTRO (para public/register.html, que ahora es tu página de registro)
    // =====================================================================================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre_usuario = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const contrasena = document.getElementById('registerPassword').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nombre_usuario, email, contrasena }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(registerMessage, data.message, 'success');
                    registerForm.reset();
                } else {
                    showMessage(registerMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error de red al registrar:', error);
                showMessage(registerMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
            }
        });
    }

    // =====================================================================================
    // LÓGICA DE INICIO DE SESIÓN (para public/login.html)
    // =====================================================================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const contrasena = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, contrasena }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(loginMessage, data.message + '. Redirigiendo...', 'success');
                    sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    window.location.href = '/dashboard'; // Redirigir al dashboard
                } else {
                    showMessage(loginMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error de red al iniciar sesión:', error);
                showMessage(loginMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
            }
        });
    }

    // =====================================================================================
    // LÓGICA DEL DASHBOARD DE PRODUCTOS (para public/dashboard.html)
    // =====================================================================================
    if (productForm) {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bienvenido, ${user.nombre_usuario}!`;
            }
        } else {
            window.location.href = '/login'; // Si no hay usuario logueado, redirigir
        }

        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Usar los IDs CORRECTOS que están en dashboard.html
            const referencia = document.getElementById('referencia').value;
            const nombre = document.getElementById('nombre').value;
            const descripcion = document.getElementById('descripcion').value;
            const precio = document.getElementById('precio').value;
            const cantidad = document.getElementById('cantidad').value;

            try {
                const response = await fetch('/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ referencia, nombre, descripcion, precio, cantidad }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(productMessage, data.message, 'success');
                    productForm.reset();
                } else {
                    showMessage(productMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error de red al registrar producto:', error);
                showMessage(productMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
            }
        });
    }

    // =====================================================================================
    // LÓGICA DE CERRAR SESIÓN (para public/dashboard.html)
    // =====================================================================================
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = '/login';
        });
    }
});
