import { Router } from 'express';
import { consultar } from '../db.js';
import { asincrono } from './_asincrono.js';

const router = Router();

/**
 * Valida las credenciales contra usuarios.contrasena_hash.
 *
 * La comparación se hace dentro de PostgreSQL con crypt(): el hash guardado
 * incluye su propia sal, así que crypt(clave, hash) reproduce el mismo hash
 * solo si la clave es correcta. La contraseña nunca se descifra ni sale de la
 * base.
 */
router.post(
  '/login',
  asincrono(async (req, res) => {
    const { correo, contrasena } = req.body ?? {};

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    const { rows } = await consultar(
      `SELECT u.id_usuario,
              u.codigo,
              u.nombres,
              u.apellidos,
              u.correo,
              u.activo,
              r.clave  AS rol_clave,
              r.nombre AS rol
         FROM usuarios.usuarios u
         JOIN usuarios.roles r ON r.id_rol = u.id_rol
        WHERE lower(u.correo) = lower($1)
          AND u.contrasena_hash = crypt($2, u.contrasena_hash)`,
      [correo.trim(), contrasena],
    );

    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'La cuenta está desactivada.' });
    }

    delete usuario.activo;
    res.json(usuario);
  }),
);

export default router;
