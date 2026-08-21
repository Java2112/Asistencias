import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventInput
} from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';

import { AdminService, AulaApi, GrupoApi } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
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
export class Calendario implements OnInit {

  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private grupos: GrupoApi[] = [];
  private aulas: AulaApi[] = [];

  mensaje: string = '';

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

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Materias, profesores y horarios salen de la base. Los profesores se
   * asocian a sus materias a través de los grupos que tienen a cargo, que es
   * como está modelada la relación.
   */
  private cargarDatos(): void {

    forkJoin({
      materias: this.adminService.getMaterias(),
      grupos: this.adminService.getGrupos(),
      aulas: this.adminService.getAulas(),
      directorio: this.adminService.getDirectorio('Profesor'),
      eventos: this.adminService.getEventos()
    }).subscribe({
      next: ({ materias, grupos, aulas, directorio, eventos }) => {

        this.grupos = grupos;
        this.aulas = aulas;

        this.materiasDisponibles = materias.map(
          materia => new Materia(
            materia.id_materia,
            materia.nombre,
            materia.descripcion ?? '',
            materia.creditos
          )
        );

        this.profesores = directorio.map(persona => {

          const suyas = grupos
            .filter(grupo => grupo.id_profesor === persona.id_usuario)
            .map(grupo => grupo.id_materia);

          return new Profesor(
            persona.id_usuario,
            persona.nombre_completo,
            persona.correo,
            this.materiasDisponibles.filter(
              materia => suyas.includes(materia.id)
            )
          );

        });

        this.horarios = eventos.map(evento => {

          const materia = this.materiasDisponibles.find(
            item => item.nombre === evento.materia
          ) ?? new Materia(0, evento.materia, '', 0);

          const profesor = this.profesores.find(
            item => item.nombre === evento.profesor
          ) ?? new Profesor(0, evento.profesor, '');

          return new Horario(
            evento.id_evento,
            evento.fecha,
            evento.hora_inicio,
            evento.hora_fin,
            evento.aula ?? '',
            materia,
            profesor
          );

        });

        this.actualizarCalendario();

      },
      error: () => {
        this.mensaje = 'No fue posible cargar el calendario.';
        this.cdr.detectChanges();
      }
    });

  }

  /** El evento cuelga de un grupo, no de la materia directamente. */
  private buscarGrupo(idMateria: number, idProfesor: number): GrupoApi | undefined {
    return this.grupos.find(
      grupo => grupo.id_materia === idMateria && grupo.id_profesor === idProfesor
    );
  }

  private buscarAula(nombre: string): number | null {
    return this.aulas.find(aula => aula.nombre === nombre)?.id_aula ?? null;
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

    this.cdr.detectChanges();
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

    const grupo = this.buscarGrupo(materia.id, profesor.id);

    if (!grupo) {
      this.mensaje = `${profesor.nombre} no tiene un grupo abierto de ${materia.nombre}.`;
      return;
    }

    const administrador = this.auth.sesion();

    if (!administrador) {
      this.mensaje = 'La sesión expiró. Vuelve a iniciar sesión.';
      return;
    }

    this.adminService.crearEvento({
      id_grupo: grupo.id_grupo,
      id_profesor: profesor.id,
      id_aula: this.buscarAula(this.aula),
      titulo: `${materia.nombre} (${grupo.nombre_grupo})`,
      fecha: this.fecha,
      hora_inicio: this.horaInicio,
      hora_fin: this.horaFin,
      creado_por: administrador.id_usuario
    }).subscribe({
      next: () => {
        this.limpiarFormulario();
        this.cargarDatos();
      },
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible crear el horario.';
        this.cdr.detectChanges();
      }
    });

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

    const grupo = this.buscarGrupo(materia.id, profesor.id);

    if (!grupo) {
      this.mensaje = `${profesor.nombre} no tiene un grupo abierto de ${materia.nombre}.`;
      return;
    }

    this.adminService.actualizarEvento(horario.id, {
      id_grupo: grupo.id_grupo,
      id_profesor: profesor.id,
      id_aula: this.buscarAula(this.aula),
      titulo: `${materia.nombre} (${grupo.nombre_grupo})`,
      fecha: this.fecha,
      hora_inicio: this.horaInicio,
      hora_fin: this.horaFin
    }).subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargarDatos();
      },
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible guardar los cambios.';
        this.cdr.detectChanges();
      }
    });

  }

  eliminarHorario(id: number): void {

    this.adminService.eliminarEvento(id).subscribe({
      next: () => this.cargarDatos(),
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible eliminar el horario.';
        this.cdr.detectChanges();
      }
    });

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