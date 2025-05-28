// Los_ALMEYDAS_Backend/server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // Asegúrate de que bcryptjs esté instalado: npm install bcryptjs
const dotenv = require('dotenv'); // Asegúrate de que dotenv esté instalado: npm install dotenv
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// Configurar la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER || 'losalmeydas_user', // Usa la variable de entorno o el default
    password: process.env.DB_PASSWORD || 'losALMEYDAS2025IBER@',
    database: 'Los_ALMEYDAS'
});

connection.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('Conexión a la base de datos MySQL establecida con ID:', connection.threadId);
});

// Middleware para parsear JSON
app.use(express.json());
// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para servir register.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Ruta para servir login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para servir dashboard.html
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Ruta para servir carrito.html (NUEVA RUTA)
app.get('/carrito.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'carrito.html'));
});


// Rutas de la API

// Ruta de registro de usuario
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10); // 10 es el costo del salt

        // Insertar usuario en la base de datos
        const query = 'INSERT INTO usuarios (nombre_usuario, email, contrasena) VALUES (?, ?, ?)';
        connection.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error al insertar usuario en la BD:', err); // LOG DETALLADO
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'El nombre de usuario o email ya están registrados.' });
                }
                return res.status(500).json({ message: 'Error interno del servidor al registrar usuario.', error: err.message });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente.' });
        });
    } catch (error) {
        console.error('Error en el registro (hash o DB):', error); // LOG DETALLADO
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
});

// Ruta de inicio de sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error en la consulta de login:', err); // LOG DETALLADO
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.contrasena);

        if (isMatch) {
            // En un proyecto real, aquí manejarías sesiones o tokens JWT.
            // Para este ejemplo, simplemente confirmamos el login y enviamos el nombre de usuario.
            res.status(200).json({ message: 'Inicio de sesión exitoso.', username: user.nombre_usuario });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' });
        }
    });
});

// Ruta para agregar un producto (POST)
app.post('/products', (req, res) => {
    const { referencia, nombre, descripcion, precio, cantidad } = req.body;

    if (!referencia || !nombre || !precio || !cantidad) {
        return res.status(400).json({ message: 'Referencia, nombre, precio y cantidad son obligatorios.' });
    }
    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
        return res.status(400).json({ message: 'El precio debe ser un número positivo.' });
    }
    if (isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número entero positivo.' });
    }

    const query = 'INSERT INTO productos (referencia, nombre, descripcion, precio, cantidad) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [referencia, nombre, descripcion, precio, cantidad], (err, result) => {
        if (err) {
            console.error('Error al insertar producto en la BD:', err); // LOG DETALLADO
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ya existe un producto con esa referencia.' });
            }
            return res.status(500).json({ message: 'Error interno del servidor al registrar producto.', error: err.message });
        }
        res.status(201).json({ message: 'Producto registrado exitosamente.', productId: result.insertId });
    });
});

// Ruta para obtener todos los productos (GET)
app.get('/products', (req, res) => {
    // Seleccionamos todas las columnas necesarias para mostrar en el frontend
    const query = 'SELECT id, referencia, nombre, descripcion, precio, cantidad FROM productos';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos de la BD:', err); // LOG DETALLADO
            return res.status(500).json({ message: 'Error interno del servidor al cargar productos.', error: err.message });
        }
        res.status(200).json(results);
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
