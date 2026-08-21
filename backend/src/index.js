import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { verificarConexion } from './db.js';
import rutasAuth from './rutas/auth.js';
import rutasAsistencia from './rutas/asistencia.js';
import rutasCalendario from './rutas/calendario.js';
import rutasUsuarios from './rutas/usuarios.js';
import rutasAcademico from './rutas/academico.js';

const app = express();
const puerto = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());

app.get('/api/salud', async (_req, res) => {
  try {
    const info = await verificarConexion();
    res.json({ ok: true, ...info });
  } catch (error) {
    res.status(503).json({ ok: false, mensaje: error.message });
  }
});

app.use('/api/auth', rutasAuth);
app.use('/api/asistencia', rutasAsistencia);
app.use('/api/calendario', rutasCalendario);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/academico', rutasAcademico);

app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Las funciones de la base lanzan sus propias excepciones con mensajes en
// español (por ejemplo cuando la clase no está abierta). Se devuelven tal cual
// para que el frontend pueda mostrarlas.
app.use((error, _req, res, _next) => {
  console.error(error);
  const esErrorDeNegocio = typeof error.code === 'string' && error.code.startsWith('P');
  res.status(esErrorDeNegocio ? 400 : 500).json({
    mensaje: error.message ?? 'Error interno del servidor',
  });
});

app.listen(puerto, () => {
  console.log(`API de asistencias escuchando en http://localhost:${puerto}/api`);
});
