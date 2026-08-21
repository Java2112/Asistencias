import { Component, signal, output, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { DocenteService } from '../../services/docente.service';
import { AuthService } from '../../services/auth.service';

/**
 * Interfaz para las clases asignadas al docente
 */
export interface ClaseAsignada {
  identificador: string;
  titulo: string;
  fechaInicio: string;
}

@Component({
  selector: 'app-calendario-docente',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendario-docente.component.html',
  styleUrls: ['./calendario-docente.component.css']
})
export class CalendarioDocenteComponent implements OnInit {
  private readonly docenteService = inject(DocenteService);
  private readonly auth = inject(AuthService);

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Señales para gestión reactiva del estado
  clasesAsignadas = signal<ClaseAsignada[]>([]);
  cargando = signal(false);
  mensaje = signal('');

  // Output para emitir el identificador de la clase seleccionada
  claseSeleccionada = output<string>();

  // Opciones de configuración del calendario
  opcionesCalendario = signal<CalendarOptions>({
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    height: 'auto',
    plugins: [dayGridPlugin, interactionPlugin],
    events: [],
    eventClick: (info: EventClickArg) => this.manejarClicClase(info),
    locale: 'es',
    dayCellClassNames: 'fc-day-responsive',
    eventDisplay: 'block',
    eventTextColor: '#ffffff',
    eventBackgroundColor: '#3b82f6',
    eventBorderColor: '#1e40af'
  });

  ngOnInit(): void {
    this.cargarClasesDelProfesor();
  }

  /**
   * Trae del servidor las clases del profesor que tiene la sesión abierta.
   */
  private cargarClasesDelProfesor(): void {
    const sesion = this.auth.sesion();
    if (!sesion) return;

    this.cargando.set(true);

    this.docenteService.getClasesProfesor(sesion.id_usuario).subscribe({
      next: (clases) => {
        this.clasesAsignadas.set(
          clases.map((clase) => ({
            identificador: String(clase.id_evento),
            titulo: `${clase.materia} (${clase.nombre_grupo}) - ${clase.aula ?? 'Sin aula'}`,
            fechaInicio: `${clase.fecha}T${clase.hora_inicio}`,
          })),
        );
        this.cargarEventosCalendario();
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.mensaje.set(
          error.status === 0
            ? 'No hay conexión con el servidor.'
            : 'No fue posible cargar las clases.',
        );
      },
    });
  }

  /**
   * Carga los eventos del calendario desde las clases asignadas
   */
  private cargarEventosCalendario(): void {
    const eventos = this.clasesAsignadas().map(clase => ({
      id: clase.identificador,
      title: clase.titulo,
      start: clase.fechaInicio,
      extendedProps: {
        identificador: clase.identificador
      }
    }));

    const opcionesActualizadas = { ...this.opcionesCalendario() };
    opcionesActualizadas.events = eventos;
    this.opcionesCalendario.set(opcionesActualizadas);
  }

  /**
   * Maneja el evento de clic en una clase del calendario
   */
  private manejarClicClase(info: EventClickArg): void {
    const identificador = info.event.id || '';
    this.claseSeleccionada.emit(identificador);
  }
}
