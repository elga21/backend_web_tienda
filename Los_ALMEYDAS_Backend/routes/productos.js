// routes/productos.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('./usuarios'); // Importa el middleware de verificación de token

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (req.userRol && req.userRol === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

// Ruta para obtener todos los productos
router.get('/', (req, res) => {
    const query = `
        SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, c.nombre AS categoria_nombre
        FROM PRODUCTOS p
        JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ message: 'Error al obtener productos.', error: err.message });
        }
        res.status(200).json(results);
    });
});

// Ruta para obtener un producto por su ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, c.nombre AS categoria_nombre
        FROM PRODUCTOS p
        JOIN CATEGORIAS c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto por ID:', err);
            return res.status(500).json({ message: 'Error al obtener producto.', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(results[0]);
    });
});

// Ruta para crear un nuevo producto (solo para administradores)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    const { nombre, descripcion, precio, stock, categoria_nombre } = req.body;

    if (!nombre || !precio || !stock || !categoria_nombre) {
        return res.status(400).json({ message: 'Nombre, precio, stock y categoría son obligatorios.' });
    }

    try {
        const [categoryRows] = await db.promise().query('SELECT id_categoria FROM CATEGORIAS WHERE nombre = ?', [categoria_nombre]);

        if (categoryRows.length === 0) {
            return res.status(400).json({ message: 'Categoría no encontrada. Por favor, introduce una categoría existente.' });
        }
        const id_categoria = categoryRows[0].id_categoria;

        const query = 'INSERT INTO PRODUCTOS (nombre, descripcion, precio, stock, id_categoria) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.promise().query(query, [nombre, descripcion, precio, stock, id_categoria]);

        res.status(201).json({ message: 'Producto registrado exitosamente.', id_producto: result.insertId });

    } catch (error) {
        console.error('Error al registrar producto:', error);
        res.status(500).json({ message: 'Error al registrar el producto.', error: error.message });
    }
});

module.exports = router;
