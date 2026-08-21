import { Router } from 'express';
import { consultar } from '../db.js';
import { asincrono } from './_asincrono.js';

const router = Router();

/**
 * Horario de clases. Vista: calendario.vista_horario
 *
 * Cuando se pide el horario de un estudiante se filtra por los grupos en los
 * que está inscrito y se adjunta su estado de asistencia en cada clase, que es
 * el campo opcional estado_asistencia del modelo del frontend.
 */
router.get(
  '/vista-horario',
  asincrono(async (req, res) => {
    const { id_estudiante, id_profesor, materia, nombre_grupo, estado, fecha_inicio, fecha_fin } = req.query;

    const { rows } = await consultar(
      `SELECT h.*, r.estado AS estado_asistencia
         FROM calendario.vista_horario h
         LEFT JOIN asistencia.registros r
                ON r.id_evento = h.id_evento
               AND r.id_estudiante = $1::int
        WHERE ($1::int IS NULL OR h.id_grupo IN (
                 SELECT i.id_grupo FROM academico.inscripciones i
                  WHERE i.id_estudiante = $1::int AND i.activa))
          AND ($2::int  IS NULL OR h.codigo_profesor = (
                 SELECT u.codigo FROM usuarios.usuarios u WHERE u.id_usuario = $2::int))
          AND ($3::text IS NULL OR h.materia      = $3::text)
          AND ($4::text IS NULL OR h.nombre_grupo = $4::text)
          AND ($5::text IS NULL OR h.estado::text = $5::text)
          AND ($6::date IS NULL OR h.fecha >= $6::date)
          AND ($7::date IS NULL OR h.fecha <= $7::date)
        ORDER BY h.fecha, h.hora_inicio`,
      [
        id_estudiante ?? null,
        id_profesor ?? null,
        materia ?? null,
        nombre_grupo ?? null,
        estado ?? null,
        fecha_inicio ?? null,
        fecha_fin ?? null,
      ],
    );

    res.json(rows);
  }),
);

/** Abre la clase para que los estudiantes puedan marcar. Función: calendario.entrar_a_clase(...) */
router.post(
  '/entrar-a-clase',
  asincrono(async (req, res) => {
    const { id_evento } = req.body ?? {};

    if (!id_evento) {
      return res.status(400).json({ success: false, mensaje: 'id_evento es obligatorio.' });
    }

    const { rows } = await consultar(
      `SELECT * FROM calendario.entrar_a_clase($1::int)`,
      [id_evento],
    );

    const evento = rows[0];

    res.json({
      success: true,
      mensaje: 'La clase está abierta.',
      id_evento: evento?.id_evento,
      estado: evento?.estado,
    });
  }),
);

/** Aulas disponibles, para armar el calendario desde administración. */
router.get(
  '/aulas',
  asincrono(async (_req, res) => {
    const { rows } = await consultar(
      `SELECT id_aula, nombre, ubicacion, capacidad FROM calendario.aulas ORDER BY nombre`,
    );
    res.json(rows);
  }),
);

/** Eventos del calendario en crudo, para el CRUD de administración. */
router.get(
  '/eventos',
  asincrono(async (_req, res) => {
    const { rows } = await consultar(
      `SELECT * FROM calendario.vista_horario ORDER BY fecha, hora_inicio`,
    );
    res.json(rows);
  }),
);

router.post(
  '/eventos',
  asincrono(async (req, res) => {
    const { id_grupo, id_profesor, id_aula, titulo, descripcion, fecha, hora_inicio, hora_fin, creado_por } =
      req.body ?? {};

    const { rows } = await consultar(
      `INSERT INTO calendario.eventos
         (id_grupo, id_profesor, id_aula, titulo, descripcion, fecha, hora_inicio, hora_fin, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id_grupo, id_profesor, id_aula ?? null, titulo, descripcion ?? null, fecha, hora_inicio, hora_fin, creado_por],
    );

    res.status(201).json(rows[0]);
  }),
);

router.put(
  '/eventos/:id',
  asincrono(async (req, res) => {
    const { id_grupo, id_profesor, id_aula, titulo, descripcion, fecha, hora_inicio, hora_fin } =
      req.body ?? {};

    const { rows } = await consultar(
      `UPDATE calendario.eventos
          SET id_grupo    = COALESCE($2, id_grupo),
              id_profesor = COALESCE($3, id_profesor),
              id_aula     = COALESCE($4, id_aula),
              titulo      = COALESCE($5, titulo),
              descripcion = COALESCE($6, descripcion),
              fecha       = COALESCE($7, fecha),
              hora_inicio = COALESCE($8, hora_inicio),
              hora_fin    = COALESCE($9, hora_fin)
        WHERE id_evento = $1::int
        RETURNING *`,
      [
        req.params.id,
        id_grupo ?? null,
        id_profesor ?? null,
        id_aula ?? null,
        titulo ?? null,
        descripcion ?? null,
        fecha ?? null,
        hora_inicio ?? null,
        hora_fin ?? null,
      ],
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Evento no encontrado.' });
    res.json(rows[0]);
  }),
);

router.delete(
  '/eventos/:id',
  asincrono(async (req, res) => {
    await consultar(`DELETE FROM calendario.eventos WHERE id_evento = $1::int`, [req.params.id]);
    res.json({ success: true, mensaje: 'Evento eliminado.' });
  }),
);

export default router;
