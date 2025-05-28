// routes/usuarios.js
const express = require('express'); // Importa Express
const router = express.Router(); // Crea un router de Express
const db = require('../config/db'); // Importa la conexión a la base de datos (ruta corregida a '../config/db')
const bcrypt = require('bcryptjs'); // Importa bcryptjs para hashear contraseñas
const jwt = require('jsonwebtoken'); // Importa jsonwebtoken para crear tokens JWT

// Middleware para verificar el token JWT (protege rutas)
const verifyToken = (req, res, next) => {
    // Obtiene el token del encabezado de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (!token) {
        // Si no hay token, devuelve un error 401 (No autorizado)
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        // Verifica el token usando el secreto JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Almacena el ID del usuario decodificado en la solicitud
        req.userRol = decoded.rol;   // Almacena el rol del usuario decodificado en la solicitud
        next(); // Continúa con la siguiente función middleware/ruta
    } catch (error) {
        // Si el token no es válido, devuelve un error 403 (Prohibido)
        res.status(403).json({ message: 'Token inválido.' });
    }
};

// Ruta para registrar un nuevo usuario
router.post('/register', (req, res) => {
    // Obtiene los datos del cuerpo de la solicitud, usando nombres de columna de la DB
    const { nombre_usuario, email, contrasena, rol } = req.body;

    // Valida que los campos requeridos no estén vacíos
    if (!nombre_usuario || !email || !contrasena) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Hashea la contraseña antes de guardarla en la base de datos
    bcrypt.hash(contrasena, 10, (err, hashedPassword) => {
        if (err) {
            // Si hay un error al hashear la contraseña, devuelve un error 500
            console.error('Error al hashear la contraseña:', err); // Loguea el error para depuración
            return res.status(500).json({ message: 'Error al hashear la contraseña.', error: err.message });
        }

        // Inserta el nuevo usuario en la base de datos con los nombres de columna correctos
        const query = 'INSERT INTO USUARIOS (nombre_usuario, email, contrasena, rol) VALUES (?, ?, ?, ?)';
        db.query(query, [nombre_usuario, email, hashedPassword, rol || 'cliente'], (err, result) => {
            if (err) {
                // Si hay un error en la consulta SQL (ej. correo duplicado), devuelve un error 400 o 500
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'El correo ya está registrado.' });
                }
                console.error('Error al registrar el usuario en la DB:', err); // Loguea el error para depuración
                return res.status(500).json({ message: 'Error al registrar el usuario.', error: err.message });
            }
            // Si el registro es exitoso, devuelve un mensaje de éxito
            res.status(201).json({ message: 'Usuario registrado exitosamente.', userId: result.insertId });
        });
    });
});

// Ruta para iniciar sesión (login)
router.post('/login', (req, res) => {
    // ¡CORREGIDO! Obtiene el email y la contrasena del cuerpo de la solicitud (coincide con el frontend)
    const { email, contrasena } = req.body;

    // Valida que los campos requeridos no estén vacíos
    if (!email || !contrasena) {
        return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }

    // Busca el usuario en la base de datos por su email (columna 'email')
    const query = 'SELECT * FROM USUARIOS WHERE email = ?';
    db.query(query, [email], (err, results) => { // Usa 'email' en la consulta
        if (err) {
            // Si hay un error en la consulta SQL, devuelve un error 500
            console.error('Error al buscar el usuario en la DB:', err); // Loguea el error
            return res.status(500).json({ message: 'Error en el servidor.', error: err.message });
        }
        if (results.length === 0) {
            // Si no se encuentra el usuario, devuelve un error 400
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const user = results[0]; // Obtiene el primer (y único) usuario encontrado

        // Compara la contraseña proporcionada con la contraseña hasheada en la base de datos
        bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => { // Usa 'contrasena' de req.body y user.contrasena de la DB
            if (err) {
                // Si hay un error al comparar contraseñas, devuelve un error 500
                console.error('Error al verificar la contraseña:', err); // Loguea el error
                return res.status(500).json({ message: 'Error al verificar la contraseña.', error: err.message });
            }
            if (!isMatch) {
                // Si las contraseñas no coinciden, devuelve un error 400
                return res.status(400).json({ message: 'Credenciales inválidas.' });
            }

            // Si las credenciales son válidas, crea un token JWT
            const token = jwt.sign(
                { userId: user.id_usuario, rol: user.rol }, // Payload del token, incluyendo el rol
                process.env.JWT_SECRET, // Secreto para firmar el token
                { expiresIn: '1h' } // El token expira en 1 hora
            );

            // Devuelve el token y la información del usuario (sin la contraseña)
            res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                token,
                user: {
                    id_usuario: user.id_usuario,
                    nombre_usuario: user.nombre_usuario, // ¡CORREGIDO! Usar nombre_usuario de la DB
                    email: user.email,                   // ¡CORREGIDO! Usar email de la DB
                    rol: user.rol
                }
            });
        });
    });
});

// Exporta el router y el middleware verifyToken para ser usados en server.js
module.exports = router;
module.exports.verifyToken = verifyToken; // Exporta el middleware para usarlo en otras rutas
