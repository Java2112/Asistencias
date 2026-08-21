import { Router } from 'express';
import { consultar } from '../db.js';
import { asincrono } from './_asincrono.js';

const router = Router();

/** Resumen de asistencias del estudiante. Vista: asistencia.vista_resumen_estudiante */
router.get(
  '/vista-resumen-estudiante',
  asincrono(async (req, res) => {
    const { id_usuario } = req.query;

    const { rows } = await consultar(
      `SELECT * FROM asistencia.vista_resumen_estudiante
        WHERE ($1::int IS NULL OR id_usuario = $1::int)`,
      [id_usuario ?? null],
    );

    // El frontend espera un único objeto, no una lista.
    res.json(rows[0] ?? null);
  }),
);

/** Inasistencias del estudiante. Vista: asistencia.vista_faltas_estudiante */
router.get(
  '/vista-faltas-estudiante',
  asincrono(async (req, res) => {
    const { id_estudiante, materia, nombre_grupo, estado, busqueda } = req.query;

    const { rows } = await consultar(
      `SELECT * FROM asistencia.vista_faltas_estudiante
        WHERE ($1::int  IS NULL OR id_estudiante = $1::int)
          AND ($2::text IS NULL OR materia      = $2::text)
          AND ($3::text IS NULL OR nombre_grupo = $3::text)
          AND ($4::text IS NULL OR estado::text = $4::text)
          AND ($5::text IS NULL OR clase ILIKE '%'||$5::text||'%'
                                OR materia ILIKE '%'||$5::text||'%')
        ORDER BY fecha DESC, hora_inicio DESC`,
      [id_estudiante ?? null, materia ?? null, nombre_grupo ?? null, estado ?? null, busqueda ?? null],
    );

    res.json(rows);
  }),
);

/** Lista de una clase para el profesor. Vista: asistencia.vista_lista_clase */
router.get(
  '/vista-lista-clase',
  asincrono(async (req, res) => {
    const { id_evento, id_profesor } = req.query;

    const { rows } = await consultar(
      `SELECT * FROM asistencia.vista_lista_clase
        WHERE ($1::int IS NULL OR id_evento   = $1::int)
          AND ($2::int IS NULL OR id_profesor = $2::int)
        ORDER BY estudiante`,
      [id_evento ?? null, id_profesor ?? null],
    );

    res.json(rows);
  }),
);

/** Marca la asistencia de un estudiante. Función: asistencia.marcar(...) */
router.post(
  '/marcar',
  asincrono(async (req, res) => {
    const { id_evento, id_estudiante, estado, marcado_por, observacion } = req.body ?? {};

    if (!id_evento || !id_estudiante || !estado) {
      return res.status(400).json({
        success: false,
        mensaje: 'id_evento, id_estudiante y estado son obligatorios.',
      });
    }

    // Si no viene quién marca, se asume que es el propio estudiante.
    const idMarcadoPor = Number(marcado_por) || Number(id_estudiante);

    const { rows } = await consultar(
      `SELECT * FROM asistencia.marcar($1::int, $2::int, $3::asistencia.estado_asistencia, $4::int, $5::text)`,
      [id_evento, id_estudiante, estado, idMarcadoPor, observacion ?? null],
    );

    const registro = rows[0];

    res.json({
      success: true,
      mensaje: 'Asistencia registrada.',
      id_asistencia: registro?.id_registro,
      id_evento: registro?.id_evento,
      fecha_registro: registro?.hora_marcado,
      estado: registro?.estado,
    });
  }),
);

/** Cierra la clase y marca ausente a quien no registró. Función: asistencia.cerrar_clase(...) */
router.post(
  '/cerrar-clase',
  asincrono(async (req, res) => {
    const { id_evento } = req.body ?? {};

    if (!id_evento) {
      return res.status(400).json({ success: false, mensaje: 'id_evento es obligatorio.' });
    }

    const { rows } = await consultar(
      `SELECT asistencia.cerrar_clase($1::int) AS ausentes`,
      [id_evento],
    );

    res.json({
      success: true,
      mensaje: `Clase cerrada. ${rows[0].ausentes} estudiante(s) quedaron como ausentes.`,
      id_evento: Number(id_evento),
    });
  }),
);

export default router;
