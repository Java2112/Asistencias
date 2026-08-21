import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminService, GrupoApi, RolApi } from '../../services/admin.service';
import { Profesor } from '../../models/profesor';
import { Estudiante } from '../../models/estudiante';
import { Materia } from '../../models/materia';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {

  private readonly adminService = inject(AdminService);

  materiasDisponibles: Materia[] = [];

  profesores: Profesor[] = [];

  estudiantes: Estudiante[] = [];

  tipoUsuario: 'profesor' | 'estudiante' = 'profesor';

  codigo: string = '';

  nombre: string = '';

  correo: string = '';

  contrasena: string = '';

  semestre: number = 1;

  materiasSeleccionadasIds: number[] = [];

  editando: boolean = false;

  usuarioEditandoId: number | null = null;

  mensaje: string = '';

  private roles: RolApi[] = [];
  private grupos: GrupoApi[] = [];

  ngOnInit(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {

    forkJoin({
      roles: this.adminService.getRoles(),
      materias: this.adminService.getMaterias(),
      grupos: this.adminService.getGrupos(),
      directorio: this.adminService.getDirectorio(),
      inscripciones: this.adminService.getInscripciones()
    }).subscribe({
      next: ({ roles, materias, grupos, directorio, inscripciones }) => {

        this.roles = roles;
        this.grupos = grupos;

        this.materiasDisponibles = materias.map(
          materia => new Materia(
            materia.id_materia,
            materia.nombre,
            materia.descripcion ?? '',
            materia.creditos
          )
        );

        this.profesores = directorio
          .filter(persona => persona.rol === 'Profesor')
          .map(persona => new Profesor(
            persona.id_usuario,
            persona.nombre_completo,
            persona.correo,
            this.materiasDelProfesor(persona.id_usuario)
          ));

        this.estudiantes = directorio
          .filter(persona => persona.rol === 'Estudiante')
          .map(persona => {

            const idsMateria = inscripciones
              .filter(inscripcion => inscripcion.id_estudiante === persona.id_usuario)
              .map(inscripcion => inscripcion.id_materia);

            return new Estudiante(
              persona.id_usuario,
              persona.nombre_completo,
              persona.correo,
              persona.semestre ?? 1,
              this.materiasDisponibles.filter(
                materia => idsMateria.includes(materia.id)
              )
            );

          });

      },
      error: () => this.mensaje = 'No fue posible cargar el directorio.'
    });

  }

  /** Un profesor dicta las materias de los grupos que tiene a cargo. */
  private materiasDelProfesor(idProfesor: number): Materia[] {

    const idsMateria = this.grupos
      .filter(grupo => grupo.id_profesor === idProfesor)
      .map(grupo => grupo.id_materia);

    return this.materiasDisponibles.filter(
      materia => idsMateria.includes(materia.id)
    );

  }

  cambiarTipoUsuario(): void {

    this.materiasSeleccionadasIds = [];

  }

  materiaSeleccionada(materiaId: number): boolean {

    return this.materiasSeleccionadasIds.includes(
      materiaId
    );

  }

  cambiarMateria(materiaId: number): void {

    if (this.materiaSeleccionada(materiaId)) {

      this.materiasSeleccionadasIds =
        this.materiasSeleccionadasIds.filter(
          id => id !== materiaId
        );

    } else {

      this.materiasSeleccionadasIds = [
        ...this.materiasSeleccionadasIds,
        materiaId
      ];

    }

  }

  crearUsuario(): void {

    if (
      !this.codigo.trim() ||
      !this.nombre.trim() ||
      !this.correo.trim() ||
      !this.contrasena.trim()
    ) {
      this.mensaje = 'Código, nombre, correo y contraseña son obligatorios.';
      return;
    }

    const rol = this.roles.find(
      item => item.clave === this.tipoUsuario
    );

    if (!rol) {
      this.mensaje = 'No se encontró el rol en la base de datos.';
      return;
    }

    const { nombres, apellidos } = this.separarNombre(this.nombre);

    this.adminService.crearUsuario({
      codigo: this.codigo.trim(),
      nombres,
      apellidos,
      correo: this.correo.trim(),
      contrasena: this.contrasena,
      id_rol: rol.id_rol
    }).subscribe({
      next: (creado) => this.asignarMaterias(creado.id_usuario),
      error: (error) => this.mensaje = error.error?.mensaje ?? 'No fue posible crear el usuario.'
    });

  }

  /**
   * En la base la relación no es directa entre persona y materia: pasa por los
   * grupos. Un profesor queda a cargo de un grupo de esa materia y un
   * estudiante se inscribe en un grupo existente.
   */
  private asignarMaterias(idUsuario: number): void {

    const seleccionadas = this.materiasSeleccionadasIds;

    if (seleccionadas.length === 0) {
      this.terminar();
      return;
    }

    if (this.tipoUsuario === 'profesor') {

      const creaciones = seleccionadas.map(idMateria =>
        this.adminService.crearGrupo({
          id_materia: idMateria,
          id_profesor: idUsuario,
          nombre_grupo: this.siguienteNombreDeGrupo(idMateria),
          periodo: this.periodoActual()
        })
      );

      forkJoin(creaciones).subscribe({
        next: () => this.terminar(),
        error: (error) => this.mensaje = error.error?.mensaje ?? 'El usuario se creó, pero no fue posible asignar las materias.'
      });

    } else {

      const inscripciones = seleccionadas
        .map(idMateria => this.grupos.find(grupo => grupo.id_materia === idMateria))
        .filter((grupo): grupo is GrupoApi => grupo !== undefined)
        .map(grupo => this.adminService.inscribir(grupo.id_grupo, idUsuario));

      if (inscripciones.length === 0) {
        this.mensaje = 'El usuario se creó. Las materias elegidas todavía no tienen grupo abierto.';
        this.terminar();
        return;
      }

      forkJoin(inscripciones).subscribe({
        next: () => this.terminar(),
        error: (error) => this.mensaje = error.error?.mensaje ?? 'El usuario se creó, pero no fue posible inscribirlo.'
      });

    }

  }

  private terminar(): void {
    this.limpiarFormulario();
    this.cargarTodo();
  }

  editarProfesor(
    profesor: Profesor
  ): void {

    this.tipoUsuario = 'profesor';

    this.editando = true;

    this.usuarioEditandoId =
      profesor.id;

    this.nombre =
      profesor.nombre;

    this.correo =
      profesor.correo;

    this.materiasSeleccionadasIds =
      profesor.materias.map(
        materia => materia.id
      );

  }

  editarEstudiante(
    estudiante: Estudiante
  ): void {

    this.tipoUsuario = 'estudiante';

    this.editando = true;

    this.usuarioEditandoId =
      estudiante.id;

    this.nombre =
      estudiante.nombre;

    this.correo =
      estudiante.correo;

    this.semestre =
      estudiante.semestre;

    this.materiasSeleccionadasIds =
      estudiante.materias.map(
        materia => materia.id
      );

  }

  guardarCambios(): void {

    if (
      !this.nombre.trim() ||
      !this.correo.trim() ||
      this.usuarioEditandoId === null
    ) {
      return;
    }

    const { nombres, apellidos } = this.separarNombre(this.nombre);

    this.adminService.actualizarUsuario(this.usuarioEditandoId, {
      nombres,
      apellidos,
      correo: this.correo.trim()
    }).subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargarTodo();
      },
      error: (error) => this.mensaje = error.error?.mensaje ?? 'No fue posible guardar los cambios.'
    });

  }

  eliminarProfesor(
    id: number
  ): void {

    this.desactivar(id);

  }

  eliminarEstudiante(
    id: number
  ): void {

    this.desactivar(id);

  }

  /**
   * Los usuarios se desactivan en lugar de borrarse: los registros de
   * asistencia y los eventos los referencian y un borrado real fallaría.
   */
  private desactivar(id: number): void {

    this.adminService.desactivarUsuario(id).subscribe({
      next: () => this.cargarTodo(),
      error: (error) => this.mensaje = error.error?.mensaje ?? 'No fue posible eliminar el usuario.'
    });

  }

  cancelarEdicion(): void {

    this.editando = false;

    this.usuarioEditandoId =
      null;

    this.limpiarFormulario();

  }

  // La base guarda nombres y apellidos por separado; el formulario pide un
  // solo campo, así que la primera palabra es el nombre y el resto el apellido.
  private separarNombre(completo: string): { nombres: string; apellidos: string } {

    const partes = completo.trim().split(/\s+/);

    return {
      nombres: partes[0] ?? '',
      apellidos: partes.slice(1).join(' ') || partes[0] || ''
    };

  }

  private siguienteNombreDeGrupo(idMateria: number): string {

    const existentes = this.grupos.filter(
      grupo => grupo.id_materia === idMateria
    ).length;

    return `G${String(existentes + 1).padStart(2, '0')}`;

  }

  private periodoActual(): string {

    const hoy = new Date();

    return `${hoy.getFullYear()}-${hoy.getMonth() < 6 ? 1 : 2}`;

  }

  private limpiarFormulario(): void {

    this.codigo = '';

    this.nombre = '';

    this.correo = '';

    this.contrasena = '';

    this.semestre = 1;

    this.materiasSeleccionadasIds = [];

    this.editando = false;

    this.usuarioEditandoId = null;

    this.mensaje = '';

  }

}
