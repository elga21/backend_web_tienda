// server.js
require('dotenv').config(); // ¡Mueve esta línea aquí, como la primera!

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express(); // Ahora 'app' se crea DESPUÉS de cargar el .env

// Asegúrate de que el módulo db.js esté importado y utilizado
const db = require('./config/db'); // Esta línea podría estar por aquí o en un archivo de configuración separado

// Importa las rutas de la API
const productosRoutes = require('./routes/productos');
const usuariosRoutes = require('./routes/usuarios');
const pedidosRoutes = require('./routes/pedidos');

// Configura los middlewares
app.use(cors());
app.use(bodyParser.json());

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Define las rutas base para cada módulo de la API
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Manejo de rutas para servir archivos HTML (si no se encuentran en static)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/auth.html', (req, res) => {
    res.sendFile(__dirname + '/public/auth.html');
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/cart.html', (req, res) => {
    res.sendFile(__dirname + '/public/cart.html');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    // Opcional: Aquí podrías añadir una comprobación de la conexión a DB si no la tienes en db.js
    // db.getConnection().then(connection => {
    //     console.log('Conectado a MySQL exitosamente en el inicio del servidor.');
    //     connection.release();
    // }).catch(err => {
    //     console.error('Error al verificar la conexión a DB al iniciar el servidor:', err);
    // });
});
