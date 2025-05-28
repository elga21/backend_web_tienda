// routes/pedidos.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('./usuarios');

// Ruta para crear un nuevo pedido
router.post('/', verifyToken, async (req, res) => {
    const { items } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'El pedido debe contener al menos un producto.' });
    }

    let totalPedido = 0;
    const transaction = await db.promise().getConnection();

    try {
        await transaction.beginTransaction();

        // 1. Verificar stock y calcular total
        for (const item of items) {
            const [productRows] = await transaction.query('SELECT precio, stock FROM PRODUCTOS WHERE id_producto = ?', [item.id_producto]);

            if (productRows.length === 0) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
            }

            const product = productRows[0];

            if (product.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${item.nombre || item.id_producto}. Stock disponible: ${product.stock}, solicitado: ${item.cantidad}.`);
            }

            totalPedido += product.precio * item.cantidad;
        }

        // 2. Crear el pedido principal
        const [orderResult] = await transaction.query('INSERT INTO PEDIDOS (id_usuario, total) VALUES (?, ?)', [userId, totalPedido]);
        const id_pedido = orderResult.insertId;

        // 3. Insertar detalles del pedido y actualizar stock
        for (const item of items) {
            const [productRows] = await transaction.query('SELECT precio FROM PRODUCTOS WHERE id_producto = ?', [item.id_producto]);
            const productPrice = productRows[0].precio;

            await transaction.query(
                'INSERT INTO DETALLES_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_pedido, item.id_producto, item.cantidad, productPrice]
            );

            await transaction.query(
                'UPDATE PRODUCTOS SET stock = stock - ? WHERE id_producto = ?',
                [item.cantidad, item.id_producto]
            );
        }

        await transaction.commit();
        res.status(201).json({ message: 'Pedido creado exitosamente.', id_pedido });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear el pedido:', error.message);
        res.status(500).json({ message: 'Error al procesar el pedido.', error: error.message });
    } finally {
        transaction.release();
    }
});

// Ruta para obtener los pedidos de un usuario específico
router.get('/user/:userId', verifyToken, (req, res) => {
    const { userId } = req.params;

    if (req.userId != userId) {
        return res.status(403).json({ message: 'No tienes permiso para ver los pedidos de este usuario.' });
    }

    const query = `
        SELECT
            p.id_pedido,
            p.fecha_pedido,
            p.total,
            dp.cantidad,
            dp.precio_unitario,
            prod.nombre AS nombre_producto,
            prod.descripcion AS descripcion_producto
        FROM
            PEDIDOS p
        JOIN
            DETALLES_PEDIDO dp ON p.id_pedido = dp.id_pedido
        JOIN
            PRODUCTOS prod ON dp.id_producto = prod.id_producto
        WHERE
            p.id_usuario = ?
        ORDER BY
            p.fecha_pedido DESC;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener pedidos del usuario:', err);
            return res.status(500).json({ message: 'Error al obtener los pedidos.', error: err.message });
        }

        const pedidosAgrupados = {};
        results.forEach(row => {
            if (!pedidosAgrupados[row.id_pedido]) {
                pedidosAgrupados[row.id_pedido] = {
                    id_pedido: row.id_pedido,
                    fecha_pedido: row.fecha_pedido,
                    total: row.total,
                    items: []
                };
            }
            pedidosAgrupados[row.id_pedido].items.push({
                nombre_producto: row.nombre_producto,
                descripcion_producto: row.descripcion_producto,
                cantidad: row.cantidad,
                precio_unitario: row.precio_unitario
            });
        });

        res.status(200).json(Object.values(pedidosAgrupados));
    });
});

module.exports = router;

