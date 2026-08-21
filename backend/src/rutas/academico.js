import { Router } from 'express';
import { consultar } from '../db.js';
import { asincrono } from './_asincrono.js';

const router = Router();

/** Materias. */
router.get(
  '/materias',
  asincrono(async (_req, res) => {
    const { rows } = await consultar(
      `SELECT id_materia, codigo_materia, nombre, descripcion, creditos, activa
         FROM academico.materias ORDER BY nombre`,
    );
    res.json(rows);
  }),
);

router.post(
  '/materias',
  asincrono(async (req, res) => {
    const { codigo_materia, nombre, descripcion, creditos } = req.body ?? {};

    if (!codigo_materia || !nombre) {
      return res.status(400).json({ mensaje: 'codigo_materia y nombre son obligatorios.' });
    }

    const { rows } = await consultar(
      `INSERT INTO academico.materias (codigo_materia, nombre, descripcion, creditos)
       VALUES ($1, $2, $3, COALESCE($4, 3)) RETURNING *`,
      [codigo_materia, nombre, descripcion ?? null, creditos ?? null],
    );

    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/materias/:id',
  asincrono(async (req, res) => {
    const { codigo_materia, nombre, descripcion, creditos, activa } = req.body ?? {};

    const { rows } = await consultar(
      `UPDATE academico.materias
          SET codigo_materia = COALESCE($2, codigo_materia),
              nombre         = COALESCE($3, nombre),
              descripcion    = COALESCE($4, descripcion),
              creditos       = COALESCE($5, creditos),
              activa         = COALESCE($6, activa)
        WHERE id_materia = $1::int RETURNING *`,
      [
        req.params.id,
        codigo_materia ?? null,
        nombre ?? null,
        descripcion ?? null,
        creditos ?? null,
        activa ?? null,
      ],
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Materia no encontrada.' });
    res.json(rows[0]);
  }),
);

/**
 * Baja lógica: los grupos referencian la materia, así que un borrado real
 * fallaría por la restricción de llave foránea.
 */
router.delete(
  '/materias/:id',
  asincrono(async (req, res) => {
    const { rows } = await consultar(
      `UPDATE academico.materias SET activa = false WHERE id_materia = $1::int RETURNING id_materia`,
      [req.params.id],
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Materia no encontrada.' });
    res.json({ success: true, mensaje: 'Materia desactivada.' });
  }),
);

/** Grupos, con el nombre de la materia y del profesor ya resueltos. */
router.get(
  '/grupos',
  asincrono(async (_req, res) => {
    const { rows } = await consultar(
      `SELECT g.id_grupo,
              g.nombre_grupo,
              g.periodo,
              g.activo,
              g.id_materia,
              m.nombre AS materia,
              m.codigo_materia,
              g.id_profesor,
              u.nombres||' '||u.apellidos AS profesor,
              (SELECT count(*) FROM academico.inscripciones i
                WHERE i.id_grupo = g.id_grupo AND i.activa) AS inscritos
         FROM academico.grupos g
         JOIN academico.materias m  ON m.id_materia = g.id_materia
         JOIN usuarios.usuarios  u  ON u.id_usuario = g.id_profesor
        ORDER BY m.nombre, g.nombre_grupo`,
    );
    res.json(rows);
  }),
);

router.post(
  '/grupos',
  asincrono(async (req, res) => {
    const { id_materia, id_profesor, nombre_grupo, periodo } = req.body ?? {};

    if (!id_materia || !id_profesor || !nombre_grupo || !periodo) {
      return res.status(400).json({
        mensaje: 'id_materia, id_profesor, nombre_grupo y periodo son obligatorios.',
      });
    }

    const { rows } = await consultar(
      `INSERT INTO academico.grupos (id_materia, id_profesor, nombre_grupo, periodo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_materia, id_profesor, nombre_grupo, periodo],
    );

    res.status(201).json(rows[0]);
  }),
);

/** Inscripciones de un estudiante, con la materia y el grupo resueltos. */
router.get(
  '/inscripciones',
  asincrono(async (req, res) => {
    const { id_estudiante } = req.query;

    const { rows } = await consultar(
      `SELECT i.id_inscripcion,
              i.id_grupo,
              i.id_estudiante,
              i.activa,
              g.nombre_grupo,
              g.id_materia,
              m.nombre AS materia
         FROM academico.inscripciones i
         JOIN academico.grupos   g ON g.id_grupo   = i.id_grupo
         JOIN academico.materias m ON m.id_materia = g.id_materia
        WHERE ($1::int IS NULL OR i.id_estudiante = $1::int)
        ORDER BY m.nombre`,
      [id_estudiante ?? null],
    );

    res.json(rows);
  }),
);

router.delete(
  '/inscripciones/:id',
  asincrono(async (req, res) => {
    await consultar(`DELETE FROM academico.inscripciones WHERE id_inscripcion = $1::int`, [
      req.params.id,
    ]);
    res.json({ success: true, mensaje: 'Inscripción eliminada.' });
  }),
);

/** Inscribe un estudiante en un grupo. */
router.post(
  '/inscripciones',
  asincrono(async (req, res) => {
    const { id_grupo, id_estudiante } = req.body ?? {};

    if (!id_grupo || !id_estudiante) {
      return res.status(400).json({ mensaje: 'id_grupo e id_estudiante son obligatorios.' });
    }

    const { rows } = await consultar(
      `INSERT INTO academico.inscripciones (id_grupo, id_estudiante)
       VALUES ($1, $2) RETURNING *`,
      [id_grupo, id_estudiante],
    );

    res.status(201).json(rows[0]);
  }),
);

export default router;
