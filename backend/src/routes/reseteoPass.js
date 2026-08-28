const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sql = require('mssql');
const { poolPromise } = require('../db/pool.js');
const { Router } = require('express');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// -----------------------------------------------------------------------------
// POST /api/reseteo-pass/forgot-password
// -----------------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('EmailParam', sql.VarChar, email)
      .query('SELECT id_usuario, email, password_hash FROM usuarios WHERE email = @EmailParam');

    const user = result.recordset[0];


    if (!user) {
      return res.json({
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
      });
    }

    const secret = JWT_SECRET + user.password_hash;
    const token = jwt.sign({ id: user.id_usuario, email: user.email }, secret, {
      expiresIn: '15m',
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${token}&id=${user.id_usuario}`;

    await transporter.sendMail({
      from: `"Soporte ArtisPay" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Recuperación de Contraseña - ArtisPay',
      html: `
    <h2>¿Olvidaste tu contraseña?</h2>
    <p>Hacé clic en el siguiente enlace para restablecerla. El enlace expira en 15 minutos:</p>
    <a href="${resetUrl}">Restablecer Contraseña</a>
  `,
    });

    return res.json({
      message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/reseteo-pass/reset-password
// -----------------------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  const { id_usuario, token, newPassword } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('IdParam', sql.Int, id_usuario)
      .query('SELECT id_usuario, password_hash FROM usuarios WHERE id_usuario = @IdParam');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ error: 'Solicitud inválida' });
    }

    const secret = JWT_SECRET + user.password_hash;
    jwt.verify(token, secret, { clockTolerance: 30 });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool
      .request()
      .input('NewHash', sql.VarChar, newPasswordHash)
      .input('IdParam', sql.Int, id_usuario)
      .query('UPDATE usuarios SET password_hash = @NewHash WHERE id_usuario = @IdParam');

    return res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });
  }
});

module.exports = router;