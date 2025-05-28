// static/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const registerTab = document.getElementById('register-tab');
    const loginTab = document.getElementById('login-tab');
    const registerFormContainer = document.getElementById('register-form-container');
    const loginFormContainer = document.getElementById('login-form-container');
    const messageBox = document.getElementById('message-box');
    const loadingSpinner = document.getElementById('loading-spinner');

    const API_BASE_URL = 'http://localhost:3000/api'; // URL base de tu API

    // Función para mostrar mensajes en la caja de mensajes
    function showMessage(message, type = 'success') {
        messageBox.textContent = message;
        messageBox.className = `message-box show ${type}`;
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, 3000); // El mensaje desaparece después de 3 segundos
    }

    // Función para mostrar/ocultar el spinner de carga
    function toggleLoading(show) {
        if (show) {
            loadingSpinner.classList.add('show');
        } else {
            loadingSpinner.classList.remove('show');
        }
    }

    // Función para cambiar entre pestañas de registro/login
    function switchTab(tab) {
        if (tab === 'register') {
            registerFormContainer.classList.remove('hidden');
            loginFormContainer.classList.add('hidden');
            registerTab.classList.add('border-blue-500', 'text-blue-600');
            loginTab.classList.remove('border-green-500', 'text-green-600');
        } else {
            loginFormContainer.classList.remove('hidden');
            registerFormContainer.classList.add('hidden');
            loginTab.classList.add('border-green-500', 'text-green-600');
            registerTab.classList.remove('border-blue-500', 'text-blue-600');
        }
    }

    // Manejar el clic en las pestañas
    registerTab.addEventListener('click', () => switchTab('register'));
    loginTab.addEventListener('click', () => switchTab('login'));

    // Verificar el parámetro 'tab' en la URL al cargar la página
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab === 'login') {
        switchTab('login');
    } else {
        switchTab('register'); // Por defecto, mostrar el formulario de registro
    }

    // Manejar el envío del formulario de registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el envío por defecto del formulario
            toggleLoading(true); // Muestra el spinner de carga

            // *** MODIFICACIÓN CLAVE AQUÍ ***
            // Mapear los nombres de los campos del formulario HTML a los nombres esperados por el backend/DB
            const data = {
                nombre_usuario: document.getElementById('register-name').value,    // 'nombre' del HTML -> 'nombre_usuario' para la DB
                email: document.getElementById('register-email').value,          // 'correo' del HTML -> 'email' para la DB
                contrasena: document.getElementById('register-password').value,  // 'contraseña' del HTML -> 'contrasena' para la DB
                rol: document.getElementById('register-rol').value || 'cliente'  // Obtiene el rol, por defecto 'cliente'
            };

            try {
                const response = await fetch(`${API_BASE_URL}/usuarios/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data) // Envía los datos como JSON
                });

                const result = await response.json(); // Parsea la respuesta JSON

                if (response.ok) {
                    showMessage(result.message, 'success'); // Muestra mensaje de éxito
                    registerForm.reset(); // Limpia el formulario
                    switchTab('login'); // Cambia a la pestaña de login después del registro exitoso
                } else {
                    showMessage(result.message || 'Error en el registro.', 'error'); // Muestra mensaje de error
                }
            } catch (error) {
                console.error('Error de red al registrar:', error);
                showMessage('Error de conexión. Inténtalo de nuevo.', 'error'); // Muestra error de conexión
            } finally {
                toggleLoading(false); // Oculta el spinner de carga
            }
        });
    }

    // Manejar el envío del formulario de inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el envío por defecto del formulario
            toggleLoading(true); // Muestra el spinner de carga

            // *** MODIFICACIÓN CLAVE AQUÍ ***
            // Mapear los nombres de los campos del formulario HTML a los nombres esperados por el backend/DB
            const data = {
                email: document.getElementById('login-email').value,           // 'correo' del HTML -> 'email' para la DB
                contrasena: document.getElementById('login-password').value    // 'contraseña' del HTML -> 'contrasena' para la DB
            };

            try {
                const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data) // Envía los datos como JSON
                });

                const result = await response.json(); // Parsea la respuesta JSON

                if (response.ok) {
                    showMessage(result.message, 'success'); // Muestra mensaje de éxito
                    localStorage.setItem('token', result.token); // Guarda el token JWT en localStorage
                    localStorage.setItem('user', JSON.stringify(result.user)); // Guarda la información del usuario
                    window.location.href = 'products.html'; // Redirige a la página de productos
                } else {
                    showMessage(result.message || 'Error en el inicio de sesión.', 'error'); // Muestra mensaje de error
                }
            } catch (error) {
                console.error('Error de red al iniciar sesión:', error);
                showMessage('Error de conexión. Inténtalo de nuevo.', 'error'); // Muestra error de conexión
            } finally {
                toggleLoading(false); // Oculta el spinner de carga
            }
        });
    }
});

