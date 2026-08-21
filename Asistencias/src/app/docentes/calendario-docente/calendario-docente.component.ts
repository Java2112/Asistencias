import { Component, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  // Señales para gestión reactiva del estado
  clasesAsignadas = signal<ClaseAsignada[]>([]);

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
    this.cargarEventosCalendario();
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
