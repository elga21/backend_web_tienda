const mysql = require('mysql2');
require('dotenv').config(); // Cargar variables de entorno

const connection = mysql.createConnection({
    host: 'localhost', // O la IP de tu servidor si es remoto y la app está en otra máquina
    user: 'losalmeydas_user',
    password: process.env.DB_PASSWORD || 'losALMEYDAS2025IBER@', // ¡¡IMPORTANTE: REEMPLAZA ESTO!!
    database: 'Los_ALMEYDAS'
});

connection.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('Conexión a la base de datos MySQL establecida con ID:', connection.threadId);
});

module.exports = connection;
