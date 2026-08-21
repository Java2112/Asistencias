import { Router } from 'express';
import { consultar } from '../db.js';
import { asincrono } from './_asincrono.js';

const router = Router();

/** Directorio de profesores y estudiantes. Vista: usuarios.vista_directorio_admin */
router.get(
  '/directorio',
  asincrono(async (req, res) => {
    const { rol, busqueda } = req.query;

    const { rows } = await consultar(
      `SELECT * FROM usuarios.vista_directorio_admin
        WHERE ($1::text IS NULL OR rol = $1::text)
          AND ($2::text IS NULL OR nombre_completo ILIKE '%'||$2::text||'%'
                                OR codigo          ILIKE '%'||$2::text||'%'
                                OR correo          ILIKE '%'||$2::text||'%')
        ORDER BY orden_bloque, nombre_completo`,
      [rol ?? null, busqueda ?? null],
    );

    res.json(rows);
  }),
);

/** Roles disponibles, para los formularios de administración. */
router.get(
  '/roles',
  asincrono(async (_req, res) => {
    const { rows } = await consultar(
      `SELECT id_rol, clave, nombre, descripcion FROM usuarios.roles ORDER BY id_rol`,
    );
    res.json(rows);
  }),
);

/**
 * Alta de usuario. La contraseña se cifra en la base con crypt() y una sal
 * bcrypt generada en el momento, para que nunca viaje ni se guarde en claro.
 */
router.post(
  '/',
  asincrono(async (req, res) => {
    const { codigo, nombres, apellidos, correo, telefono, contrasena, id_rol } = req.body ?? {};

    if (!codigo || !nombres || !apellidos || !correo || !contrasena || !id_rol) {
      return res.status(400).json({
        mensaje: 'codigo, nombres, apellidos, correo, contrasena e id_rol son obligatorios.',
      });
    }

    const { rows } = await consultar(
      `INSERT INTO usuarios.usuarios
         (codigo, nombres, apellidos, correo, telefono, contrasena_hash, id_rol)
       VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')), $7)
       RETURNING id_usuario, codigo, nombres, apellidos, correo, telefono, id_rol, activo`,
      [codigo, nombres, apellidos, correo, telefono ?? null, contrasena, id_rol],
    );

    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/:id',
  asincrono(async (req, res) => {
    const { nombres, apellidos, correo, telefono, activo } = req.body ?? {};

    const { rows } = await consultar(
      `UPDATE usuarios.usuarios
          SET nombres   = COALESCE($2, nombres),
              apellidos = COALESCE($3, apellidos),
              correo    = COALESCE($4, correo),
              telefono  = COALESCE($5, telefono),
              activo    = COALESCE($6, activo)
        WHERE id_usuario = $1::int
        RETURNING id_usuario, codigo, nombres, apellidos, correo, telefono, id_rol, activo`,
      [req.params.id, nombres ?? null, apellidos ?? null, correo ?? null, telefono ?? null, activo ?? null],
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    res.json(rows[0]);
  }),
);

/**
 * Baja lógica. No se borra la fila porque los registros de asistencia y los
 * eventos la referencian con ON DELETE RESTRICT.
 */
router.delete(
  '/:id',
  asincrono(async (req, res) => {
    const { rows } = await consultar(
      `UPDATE usuarios.usuarios SET activo = false WHERE id_usuario = $1::int RETURNING id_usuario`,
      [req.params.id],
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    res.json({ success: true, mensaje: 'Usuario desactivado.' });
  }),
);

export default router;
