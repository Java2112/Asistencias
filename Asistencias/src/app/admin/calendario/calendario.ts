import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventInput
} from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';

import { Materia } from '../../models/materia';
import { Profesor } from '../../models/profesor';
import { Horario } from '../../models/horario';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario {

  materiasDisponibles: Materia[] = [];

  profesores: Profesor[] = [];

  horarios: Horario[] = [];

  fecha: string = '';

  horaInicio: string = '';

  horaFin: string = '';

  aula: string = '';

  materiaSeleccionadaId: number | null = null;

  profesorSeleccionadoId: number | null = null;

  profesorFiltroId: number | null = null;

  editando: boolean = false;

  horarioEditandoId: number | null = null;

  get profesoresDisponibles(): Profesor[] {

    if (this.materiaSeleccionadaId === null) {
      return [];
    }

    const materia = this.materiasDisponibles.find(
      m => m.id === this.materiaSeleccionadaId
    );

    if (!materia) {
      return [];
    }

    return this.profesores.filter(
      profesor =>
        profesor.materias.some(
          m => m.id === materia.id
        )
    );
  }

  cambiarMateria(): void {
    this.profesorSeleccionadoId = null;
  }

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',

    plugins: [
      dayGridPlugin
    ],

    locale: 'es',

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },

    events: this.obtenerEventos(),

    height: 'auto',

    editable: false,

    selectable: false
  };

  private obtenerEventos(): EventInput[] {

    let horariosMostrar = this.horarios;

    if (this.profesorFiltroId !== null) {

      horariosMostrar = horariosMostrar.filter(
        horario =>
          horario.profesor.id === this.profesorFiltroId
      );
    }

    return horariosMostrar.map(
      horario => ({

        id: horario.id.toString(),

        title:
          `${horario.materia.nombre} - ${horario.profesor.nombre}`,

        start:
          `${horario.fecha}T${horario.horaInicio}`,

        end:
          `${horario.fecha}T${horario.horaFin}`,

        extendedProps: {

          aula: horario.aula,

          materia: horario.materia.nombre,

          profesor: horario.profesor.nombre

        }

      })
    );
  }

  filtrarPorProfesor(): void {
    this.actualizarCalendario();
  }

  actualizarCalendario(): void {

    this.calendarOptions = {

      ...this.calendarOptions,

      events: this.obtenerEventos()

    };
  }

  crearHorario(): void {

    if (
      !this.fecha ||
      !this.horaInicio ||
      !this.horaFin ||
      !this.aula ||
      this.materiaSeleccionadaId === null ||
      this.profesorSeleccionadoId === null
    ) {
      return;
    }

    const materia = this.materiasDisponibles.find(
      m => m.id === this.materiaSeleccionadaId
    );

    const profesor = this.profesores.find(
      p => p.id === this.profesorSeleccionadoId
    );

    if (!materia || !profesor) {
      return;
    }

    const nuevoId =
      this.horarios.length > 0
        ? Math.max(
            ...this.horarios.map(h => h.id)
          ) + 1
        : 1;

    const nuevoHorario = new Horario(
      nuevoId,
      this.fecha,
      this.horaInicio,
      this.horaFin,
      this.aula,
      materia,
      profesor
    );

    this.horarios.push(nuevoHorario);

    this.actualizarCalendario();

    this.limpiarFormulario();
  }

  editarHorario(horario: Horario): void {

    this.editando = true;

    this.horarioEditandoId = horario.id;

    this.fecha = horario.fecha;

    this.horaInicio = horario.horaInicio;

    this.horaFin = horario.horaFin;

    this.aula = horario.aula;

    this.materiaSeleccionadaId = horario.materia.id;

    this.profesorSeleccionadoId = horario.profesor.id;
  }

  guardarCambios(): void {

    if (
      !this.fecha ||
      !this.horaInicio ||
      !this.horaFin ||
      !this.aula ||
      this.materiaSeleccionadaId === null ||
      this.profesorSeleccionadoId === null ||
      this.horarioEditandoId === null
    ) {
      return;
    }

    const horario = this.horarios.find(
      h => h.id === this.horarioEditandoId
    );

    if (!horario) {
      return;
    }

    const materia = this.materiasDisponibles.find(
      m => m.id === this.materiaSeleccionadaId
    );

    const profesor = this.profesores.find(
      p => p.id === this.profesorSeleccionadoId
    );

    if (!materia || !profesor) {
      return;
    }

    horario.fecha = this.fecha;

    horario.horaInicio = this.horaInicio;

    horario.horaFin = this.horaFin;

    horario.aula = this.aula;

    horario.materia = materia;

    horario.profesor = profesor;

    this.actualizarCalendario();

    this.cancelarEdicion();
  }

  eliminarHorario(id: number): void {

    this.horarios = this.horarios.filter(
      horario => horario.id !== id
    );

    this.actualizarCalendario();
  }

  cancelarEdicion(): void {

    this.editando = false;

    this.horarioEditandoId = null;

    this.limpiarFormulario();
  }

  private limpiarFormulario(): void {

    this.fecha = '';

    this.horaInicio = '';

    this.horaFin = '';

    this.aula = '';

    this.materiaSeleccionadaId = null;

    this.profesorSeleccionadoId = null;
  }
}