const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./config/db'); // Importa la conexión a la base de datos

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// =====================================================================================
// RUTAS DE AUTENTICACIÓN (POST)
// =====================================================================================

// Ruta de Registro de Usuario (POST para enviar datos del formulario)
app.post('/register', (req, res) => {
    const { nombre_usuario, email, contrasena } = req.body;

    if (!nombre_usuario || !email || !contrasena) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const salt = bcrypt.genSaltSync(10);
    const contrasena_hasheada = bcrypt.hashSync(contrasena, salt);

    const query = 'INSERT INTO usuarios (nombre_usuario, email, contrasena) VALUES (?, ?, ?)';
    db.query(query, [nombre_usuario, email, contrasena_hasheada], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El nombre de usuario o el email ya están registrados' });
            }
            console.error('Error al registrar el usuario:', err);
            return res.status(500).json({ message: 'Error interno del servidor al registrar' });
        }
        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
    });
});

// Ruta de Inicio de Sesión de Usuario (POST para enviar datos del formulario)
app.post('/login', (req, res) => {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error al buscar el usuario:', err);
            return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = results[0];
        const contrasena_valida = bcrypt.compareSync(contrasena, user.contrasena);

        if (!contrasena_valida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        res.status(200).json({ message: 'Inicio de sesión exitoso', user: { id: user.id, nombre_usuario: user.nombre_usuario, email: user.email } });
    });
});

// =====================================================================================
// RUTAS DE GESTIÓN DE PRODUCTOS (POST y GET)
// =====================================================================================

// Ruta para registrar un nuevo producto (POST para enviar datos del formulario)
app.post('/products', (req, res) => {
    const { referencia, nombre, descripcion, precio, cantidad } = req.body;

    if (!referencia || !nombre || !precio || !cantidad) {
        return res.status(400).json({ message: 'Referencia, nombre, precio y cantidad son obligatorios.' });
    }

    const parsedPrecio = parseFloat(precio);
    const parsedCantidad = parseInt(cantidad, 10);

    if (isNaN(parsedPrecio) || isNaN(parsedCantidad) || parsedPrecio < 0 || parsedCantidad < 0) {
        return res.status(400).json({ message: 'Precio y cantidad deben ser números válidos y positivos.' });
    }

    const query = 'INSERT INTO productos (referencia, nombre, descripcion, precio, cantidad) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [referencia, nombre, descripcion, parsedPrecio, parsedCantidad], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'La referencia del producto ya existe.' });
            }
            console.error('Error al registrar el producto:', err);
            return res.status(500).json({ message: 'Error interno del servidor al registrar el producto.' });
        }
        res.status(201).json({ message: 'Producto registrado exitosamente', productId: result.insertId });
    });
});

// Ruta para obtener todos los productos (GET para que el frontend solicite los productos)
app.get('/products', (req, res) => {
    const query = 'SELECT referencia, nombre, descripcion, precio, cantidad FROM productos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los productos:', err);
            return res.status(500).json({ message: 'Error interno del servidor al obtener los productos.' });
        }
        res.status(200).json(results); // Envía los productos como un array JSON
    });
});

// =====================================================================================
// RUTAS PARA SERVIR ARCHIVOS HTML (GET)
// =====================================================================================

// 1. Ruta para la página principal de productos (el NUEVO index.html)
// Cuando el usuario visita http://localhost:3000 o /
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 2. Ruta para la página de registro de usuario (el NUEVO register.html)
// Cuando el usuario hace clic en "Administración" o va a http://localhost:3000/register
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

// 3. Ruta para la página de inicio de sesión (el login.html)
// Cuando el usuario va a http://localhost:3000/login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// 4. Ruta para el dashboard de productos (el dashboard.html)
// Después de un inicio de sesión exitoso o si se navega a http://localhost:3000/dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
    console.log('Visita: http://localhost:' + PORT);
});
