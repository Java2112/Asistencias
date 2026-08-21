# API de Asistencias

Servidor REST que conecta el frontend Angular con la base de datos PostgreSQL.
Corre en el puerto 3000, que es el que `src/environments/environment.ts` del
frontend ya tenía configurado.

## Requisitos

**PostgreSQL 18.** El respaldo `BD_Asistencia_.sql` es un dump en formato
comprimido generado con PostgreSQL 18.3, y una versión anterior no puede
leerlo: `pg_restore` de la 16 falla con «versión no soportada (1.16) en el
encabezado del archivo».

## Montar la base desde cero

Los tres roles de PostgreSQL no vienen en el respaldo, porque `pg_dump` no
exporta roles. Hay que crearlos antes de restaurar o todos los `GRANT` fallan:

```sql
CREATE ROLE rol_administrador NOLOGIN;
CREATE ROLE rol_profesor NOLOGIN;
CREATE ROLE rol_estudiante NOLOGIN;
```

Luego se restaura y se cargan los datos iniciales:

```
pg_restore -U postgres -h localhost -p 5434 -d postgres --create BD_Asistencia_.sql
psql -U postgres -h localhost -p 5434 -d asistencias -f db/seed.sql
```

El respaldo trae la estructura completa pero sin usuarios, así que sin
`db/seed.sql` no es posible iniciar sesión. Ese script se puede volver a
ejecutar cuantas veces haga falta sin duplicar datos.

## Levantar la API

```
npm install
copy .env.example .env
npm start
```

Ajustar `.env` con los datos de la base local. Ese archivo no se sube al
repositorio. Para comprobar que quedó conectada: `GET /api/salud`.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@asistencias.edu | Admin123* |
| Profesor | profesor@asistencias.edu | Profe123* |
| Estudiante | estudiante@asistencias.edu | Estudiante123* |

Las contraseñas se guardan cifradas con `pgcrypto`. La comparación se hace
dentro de PostgreSQL con `crypt()`, así que la contraseña nunca se descifra.

## Endpoints

| Método | Ruta | Origen en la base |
|---|---|---|
| POST | `/api/auth/login` | `usuarios.usuarios` + `crypt()` |
| GET | `/api/asistencia/vista-resumen-estudiante` | vista `vista_resumen_estudiante` |
| GET | `/api/asistencia/vista-faltas-estudiante` | vista `vista_faltas_estudiante` |
| GET | `/api/asistencia/vista-lista-clase` | vista `vista_lista_clase` |
| POST | `/api/asistencia/marcar` | función `asistencia.marcar()` |
| POST | `/api/asistencia/cerrar-clase` | función `asistencia.cerrar_clase()` |
| GET | `/api/calendario/vista-horario` | vista `vista_horario` |
| POST | `/api/calendario/entrar-a-clase` | función `calendario.entrar_a_clase()` |
| GET/POST/DELETE | `/api/calendario/eventos` | `calendario.eventos` |
| GET | `/api/calendario/aulas` | `calendario.aulas` |
| GET | `/api/usuarios/directorio` | vista `vista_directorio_admin` |
| GET | `/api/usuarios/roles` | `usuarios.roles` |
| POST/PUT/DELETE | `/api/usuarios` | `usuarios.usuarios` |
| GET/POST/PUT | `/api/academico/materias` | `academico.materias` |
| GET/POST | `/api/academico/grupos` | `academico.grupos` |
| POST | `/api/academico/inscripciones` | `academico.inscripciones` |

La lógica de negocio vive en la base: las vistas y funciones ya resuelven los
cálculos, y la API solo traduce entre HTTP y PostgreSQL.

## Corrección aplicada al respaldo

`calendario.fn_validar_evento()` comprueba
`usuarios.fn_es_rol(creado_por, 'administrador')`, pero en la tabla
`usuarios.roles` el administrador venía con la clave
`administradorsixseven`. Con esa diferencia el trigger nunca se cumplía y era
imposible crear un evento del calendario. `db/seed.sql` normaliza la clave a
`administrador`, que es la convención que siguen `profesor` y `estudiante`.

## Baja de usuarios

`DELETE /api/usuarios/:id` desactiva el usuario en lugar de borrar la fila:
los registros de asistencia y los eventos la referencian con
`ON DELETE RESTRICT`, así que un borrado real fallaría.
