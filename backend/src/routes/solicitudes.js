const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', authenticateToken, requireRole('emprendedor'), async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario;

        if (!id_usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const { recordset: empRecord } = await query(
            'SELECT id_emprendimiento FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
            { id_usuario }
        );

        const emprendimiento = empRecord[0];
        if (!emprendimiento) {
            return res.status(404).json({ error: 'No se encontró un emprendimiento asociado a este usuario' });
        }

        const { recordset: solicitudes } = await query(
            `SELECT 
                sp.id_solicitud, 
                sp.id_usuario, 
                sp.mensaje, 
                sp.estado, 
                sp.fecha,
                sp.telefono_cliente,
                u.nombre_usuario AS cliente_nombre,
                u.email AS cliente_email
             FROM dbo.solicitudes_presupuesto sp
             INNER JOIN dbo.usuarios u ON sp.id_usuario = u.id_usuario
             WHERE sp.id_emprendimiento = @id_emprendimiento
             ORDER BY sp.fecha DESC`,
            { id_emprendimiento: emprendimiento.id_emprendimiento }
        );

        res.json(solicitudes);

    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Error interno del servidor al consultar solicitudes' });
    }
});

router.post('/', authenticateToken, requireRole('cliente','emprendedor'), async (req, res) => {
    try {
        const { id_emprendimiento, mensaje } = req.body;

        if (!id_emprendimiento) {
            return res.status(400).json({ error: 'El id_emprendimiento es obligatorio' });
        }
        if (!mensaje) {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        const { recordset: empRecord } = await query(
            'SELECT * FROM dbo.emprendimientos WHERE id_emprendimiento = @id_emprendimiento',
            { id_emprendimiento }
        );
        const emp = empRecord[0];
        if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

        const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario;

        const { recordset } = await query(`
            INSERT INTO dbo.solicitudes_presupuesto (id_emprendimiento, id_usuario, mensaje, telefono_cliente)
            OUTPUT INSERTED.*
            VALUES (@id_emprendimiento, @id_usuario, @mensaje, @telefono_cliente)
        `, {
            id_emprendimiento: emp.id_emprendimiento,
            id_usuario: id_usuario,
            mensaje: mensaje,
            telefono_cliente: req.body.telefono_cliente || null,
        });

        const solicitud = recordset[0];
        res.status(201).json(solicitud);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


module.exports = router;