
// config/db.js
const mysql = require('mysql2'); // Importa el módulo mysql2
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// Crea un pool de conexiones para manejar múltiples conexiones de manera eficiente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexiones en el pool
    queueLimit: 0
});

// Intenta obtener una conexión del pool para verificar que la conexión es exitosa
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err.stack);
        return;
    }
    console.log('📡 Conectado a MySQL con ID:', connection.threadId);
    connection.release(); // Libera la conexión de vuelta al pool
});

// Exporta el pool de conexiones
module.exports = pool;

