import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
export class Usuarios {

  materiasDisponibles: Materia[] = [];

  profesores: Profesor[] = [];

  estudiantes: Estudiante[] = [];

  tipoUsuario: 'profesor' | 'estudiante' = 'profesor';

  nombre: string = '';

  correo: string = '';

  semestre: number = 1;

  materiasSeleccionadasIds: number[] = [];

  editando: boolean = false;

  usuarioEditandoId: number | null = null;

  cambiarTipoUsuario(): void {

    this.materiasSeleccionadasIds = [];
    this.nombre = '';
    this.correo = '';
    this.semestre = 1;

  }

  materiaSeleccionada(materiaId: number): boolean {

    return this.materiasSeleccionadasIds.includes(
      materiaId
    );

  }

  cambiarMateria(materiaId: number): void {

    const index =
      this.materiasSeleccionadasIds.indexOf(
        materiaId
      );

    if (index === -1) {

      this.materiasSeleccionadasIds.push(
        materiaId
      );

    } else {

      this.materiasSeleccionadasIds.splice(
        index,
        1
      );

    }

  }

  crearUsuario(): void {

    if (
      !this.nombre.trim() ||
      !this.correo.trim()
    ) {
      return;
    }

    const materias =
      this.obtenerMateriasSeleccionadas();

    if (this.tipoUsuario === 'profesor') {

      const nuevoId =
        this.profesores.length > 0
          ? Math.max(
              ...this.profesores.map(
                p => p.id
              )
            ) + 1
          : 1;

      const profesor = new Profesor(
        nuevoId,
        this.nombre.trim(),
        this.correo.trim(),
        materias
      );

      this.profesores.push(
        profesor
      );

    } else {

      const nuevoId =
        this.estudiantes.length > 0
          ? Math.max(
              ...this.estudiantes.map(
                e => e.id
              )
            ) + 1
          : 1;

      const estudiante = new Estudiante(
        nuevoId,
        this.nombre.trim(),
        this.correo.trim(),
        this.semestre,
        materias
      );

      this.estudiantes.push(
        estudiante
      );

    }

    this.limpiarFormulario();

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

    const materias =
      this.obtenerMateriasSeleccionadas();

    if (
      this.tipoUsuario === 'profesor'
    ) {

      const profesor =
        this.profesores.find(
          p =>
            p.id ===
            this.usuarioEditandoId
        );

      if (!profesor) {
        return;
      }

      profesor.nombre =
        this.nombre.trim();

      profesor.correo =
        this.correo.trim();

      profesor.materias =
        materias;

    } else {

      const estudiante =
        this.estudiantes.find(
          e =>
            e.id ===
            this.usuarioEditandoId
        );

      if (!estudiante) {
        return;
      }

      estudiante.nombre =
        this.nombre.trim();

      estudiante.correo =
        this.correo.trim();

      estudiante.semestre =
        this.semestre;

      estudiante.materias =
        materias;

    }

    this.cancelarEdicion();

  }

  eliminarProfesor(
    id: number
  ): void {

    this.profesores =
      this.profesores.filter(
        profesor =>
          profesor.id !== id
      );

  }

  eliminarEstudiante(
    id: number
  ): void {

    this.estudiantes =
      this.estudiantes.filter(
        estudiante =>
          estudiante.id !== id
      );

  }

  cancelarEdicion(): void {

    this.editando = false;

    this.usuarioEditandoId =
      null;

    this.limpiarFormulario();

  }

  private obtenerMateriasSeleccionadas(): Materia[] {

    return this.materiasDisponibles.filter(
      materia =>
        this.materiasSeleccionadasIds.includes(
          materia.id
        )
    );

  }

  private limpiarFormulario(): void {

    this.nombre = '';

    this.correo = '';

    this.semestre = 1;

    this.materiasSeleccionadasIds = [];

    this.editando = false;

    this.usuarioEditandoId = null;

  }

}