-- Datos iniciales del sistema de asistencias.
--
-- El respaldo de la base llega con la estructura completa pero sin usuarios:
-- la tabla usuarios.usuarios viene vacía y en usuarios.roles solo está el rol
-- de administrador. Sin esto no es posible iniciar sesión.
--
-- El script se puede volver a ejecutar sin duplicar nada.
--
--   psql -U postgres -h localhost -p 5434 -d asistencias -f db/seed.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Roles
--
-- Las claves 'profesor' y 'estudiante' no son arbitrarias: los triggers
-- fn_validar_grupo, fn_validar_evento, fn_validar_inscripcion y
-- fn_validar_estudiante llaman a usuarios.fn_es_rol() con exactamente esos
-- textos. Si cambian, esas validaciones rechazan cualquier inserción.
-- ---------------------------------------------------------------------------

-- El respaldo trae el rol de administrador con la clave
-- 'administradorsixseven', pero calendario.fn_validar_evento() comprueba
-- fn_es_rol(creado_por, 'administrador'). Con esa diferencia el trigger nunca
-- se cumple y resulta imposible crear un evento del calendario. Se normaliza
-- a 'administrador', que es la convención que siguen los otros dos roles.
UPDATE usuarios.roles SET clave = 'administrador' WHERE clave = 'administradorsixseven';

INSERT INTO usuarios.roles (clave, nombre, descripcion) VALUES
  ('profesor',   'Profesor',   'Pasa lista de sus clases y cierra la sesión de asistencia'),
  ('estudiante', 'Estudiante', 'Consulta su horario, marca asistencia y revisa sus faltas')
ON CONFLICT (clave) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Usuarios de prueba
--
-- Las contraseñas se cifran con crypt() y una sal bcrypt generada en el
-- momento, así que nunca quedan guardadas en claro.
-- ---------------------------------------------------------------------------

INSERT INTO usuarios.usuarios (codigo, nombres, apellidos, correo, telefono, contrasena_hash, id_rol)
SELECT v.codigo, v.nombres, v.apellidos, v.correo, v.telefono,
       crypt(v.contrasena, gen_salt('bf')), r.id_rol
  FROM (VALUES
      ('ADM001', 'Ana',   'Administradora', 'admin@asistencias.edu',      '3000000001', 'Admin123*',      'administrador'),
      ('PRO001', 'Pedro', 'Profesor',       'profesor@asistencias.edu',   '3000000002', 'Profe123*',      'profesor'),
      ('EST001', 'Sofía', 'Estudiante',     'estudiante@asistencias.edu', '3000000003', 'Estudiante123*', 'estudiante')
  ) AS v(codigo, nombres, apellidos, correo, telefono, contrasena, clave_rol)
  JOIN usuarios.roles r ON r.clave = v.clave_rol
ON CONFLICT (correo) DO NOTHING;

INSERT INTO usuarios.perfiles_profesor (id_usuario, especialidad, titulo)
SELECT id_usuario, 'Ingeniería de Software', 'Magíster en Ingeniería'
  FROM usuarios.usuarios WHERE codigo = 'PRO001'
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO usuarios.perfiles_estudiante (id_usuario, programa, semestre)
SELECT id_usuario, 'Ingeniería de Sistemas', 5
  FROM usuarios.usuarios WHERE codigo = 'EST001'
ON CONFLICT (id_usuario) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Datos académicos mínimos
--
-- Lo justo para que las pantallas muestren información real y se pueda
-- comprobar que la conexión con la base funciona de extremo a extremo.
-- ---------------------------------------------------------------------------

INSERT INTO academico.materias (codigo_materia, nombre, descripcion) VALUES
  ('BD101',  'Bases de Datos',        'Modelado relacional y SQL'),
  ('WEB201', 'Desarrollo Web',        'Aplicaciones cliente-servidor')
ON CONFLICT (codigo_materia) DO NOTHING;

INSERT INTO calendario.aulas (nombre, ubicacion, capacidad) VALUES
  ('Aula 201', 'Bloque A - Piso 2', 35),
  ('Lab 105',  'Bloque B - Piso 1', 25)
ON CONFLICT DO NOTHING;

INSERT INTO academico.grupos (id_materia, id_profesor, nombre_grupo, periodo)
SELECT m.id_materia, u.id_usuario, v.nombre_grupo, '2026-2'
  FROM (VALUES ('BD101', 'G01'), ('WEB201', 'G02')) AS v(codigo_materia, nombre_grupo)
  JOIN academico.materias m ON m.codigo_materia = v.codigo_materia
  JOIN usuarios.usuarios  u ON u.codigo = 'PRO001'
 WHERE NOT EXISTS (
       SELECT 1 FROM academico.grupos g
        WHERE g.id_materia = m.id_materia AND g.nombre_grupo = v.nombre_grupo);

INSERT INTO academico.inscripciones (id_grupo, id_estudiante)
SELECT g.id_grupo, u.id_usuario
  FROM academico.grupos g
  JOIN usuarios.usuarios u ON u.codigo = 'EST001'
 WHERE NOT EXISTS (
       SELECT 1 FROM academico.inscripciones i
        WHERE i.id_grupo = g.id_grupo AND i.id_estudiante = u.id_usuario);

-- Clases de la semana en curso, para que el calendario no salga vacío.
INSERT INTO calendario.eventos
      (id_grupo, id_profesor, id_aula, titulo, descripcion, fecha, hora_inicio, hora_fin, creado_por)
SELECT g.id_grupo,
       g.id_profesor,
       a.id_aula,
       m.nombre||' - sesión '||v.dia,
       'Sesión programada',
       CURRENT_DATE + v.dia,
       v.inicio::time,
       v.fin::time,
       adm.id_usuario
  FROM (VALUES (0, '08:00', '10:00'), (1, '10:00', '12:00'), (2, '14:00', '16:00')) AS v(dia, inicio, fin)
  JOIN academico.grupos   g   ON g.nombre_grupo = 'G01'
  JOIN academico.materias m   ON m.id_materia = g.id_materia
  JOIN calendario.aulas   a   ON a.nombre = 'Aula 201'
  JOIN usuarios.usuarios  adm ON adm.codigo = 'ADM001'
 WHERE NOT EXISTS (
       SELECT 1 FROM calendario.eventos e
        WHERE e.id_grupo = g.id_grupo AND e.fecha = CURRENT_DATE + v.dia AND e.hora_inicio = v.inicio::time);

COMMIT;

-- Resumen de lo que quedó cargado
SELECT 'roles' AS tabla, count(*) FROM usuarios.roles
UNION ALL SELECT 'usuarios',     count(*) FROM usuarios.usuarios
UNION ALL SELECT 'materias',     count(*) FROM academico.materias
UNION ALL SELECT 'grupos',       count(*) FROM academico.grupos
UNION ALL SELECT 'inscripciones',count(*) FROM academico.inscripciones
UNION ALL SELECT 'aulas',        count(*) FROM calendario.aulas
UNION ALL SELECT 'eventos',      count(*) FROM calendario.eventos;
