import { Component, OnInit, inject, signal, computed, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { AsistenciaEstudianteService } from '../services/asistencia-estudiante.service';
import {
  VistaResumenEstudiante,
  VistaFaltaEstudiante,
  VistaHorario,
  EstadoAsistencia,
  EstadoEvento,
  COLORES_ESTADO,
  MarcarAsistenciaDto
} from '../models/asistencia.models';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css'
})
export class Estudiantes implements OnInit {
  private readonly asistenciaService = inject(AsistenciaEstudianteService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  // Student identification from backend/session
  readonly idEstudianteActual = signal<number | undefined>(undefined);
  readonly nombreEstudiante = signal<string>('');
  readonly codigoEstudiante = signal<string>('');

  // Active View Tab
  readonly activeTab = signal<'calendario' | 'faltas'>('calendario');

  // Loading and feedback states
  readonly cargando = signal<boolean>(false);
  readonly marcandoAsistencia = signal<boolean>(false);
  readonly toast = signal<{ mensaje: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  // Data Signals
  readonly resumen = signal<VistaResumenEstudiante | null>(null);
  readonly faltas = signal<VistaFaltaEstudiante[]>([]);
  readonly horario = signal<VistaHorario[]>([]);

  // Filter Signals
  readonly filtroMateria = signal<string>('');
  readonly filtroGrupo = signal<string>('');
  readonly filtroEstado = signal<string>('');
  readonly busquedaTexto = signal<string>('');

  // Modal / Selected Event
  readonly eventoSeleccionado = signal<VistaHorario | null>(null);
  readonly modalDetalleAbierto = signal<boolean>(false);
  readonly observacionCheckIn = signal<string>('');

  // Computed: Academic Period from schedule
  readonly periodoActual = computed(() => {
    return this.horario()[0]?.periodo || '';
  });

  // Computed: Distinct Filter Options
  readonly materiasDisponibles = computed(() => {
    const materias = new Set<string>();
    this.horario().forEach(h => { if (h.materia) materias.add(h.materia); });
    this.faltas().forEach(f => { if (f.materia) materias.add(f.materia); });
    return Array.from(materias).sort();
  });

  readonly gruposDisponibles = computed(() => {
    const grupos = new Set<string>();
    this.horario().forEach(h => { if (h.nombre_grupo) grupos.add(h.nombre_grupo); });
    this.faltas().forEach(f => { if (f.nombre_grupo) grupos.add(f.nombre_grupo); });
    return Array.from(grupos).sort();
  });

  // Computed: Filtered Absences
  readonly faltasFiltradas = computed(() => {
    let list = this.faltas();
    const mat = this.filtroMateria().toLowerCase();
    const grp = this.filtroGrupo().toLowerCase();
    const est = this.filtroEstado().toLowerCase();
    const busq = this.busquedaTexto().toLowerCase();

    return list.filter(item => {
      if (mat && item.materia?.toLowerCase() !== mat) return false;
      if (grp && item.nombre_grupo?.toLowerCase() !== grp) return false;
      if (est && item.estado?.toLowerCase() !== est) return false;
      if (busq) {
        const text = `${item.materia || ''} ${item.clase || ''} ${item.tipo_falta || ''} ${item.observacion || ''}`.toLowerCase();
        if (!text.includes(busq)) return false;
      }
      return true;
    });
  });

  // Computed: Filtered Schedule
  readonly horarioFiltrado = computed(() => {
    let list = this.horario();
    const mat = this.filtroMateria().toLowerCase();
    const grp = this.filtroGrupo().toLowerCase();
    const est = this.filtroEstado().toLowerCase();
    const busq = this.busquedaTexto().toLowerCase();

    return list.filter(item => {
      if (mat && item.materia?.toLowerCase() !== mat) return false;
      if (grp && item.nombre_grupo?.toLowerCase() !== grp) return false;
      if (est) {
        const estadoMatches = item.estado_asistencia?.toLowerCase() === est || item.estado?.toLowerCase() === est;
        if (!estadoMatches) return false;
      }
      if (busq) {
        const text = `${item.materia || ''} ${item.titulo || ''} ${item.profesor || ''} ${item.aula || ''} ${item.ubicacion || ''}`.toLowerCase();
        if (!text.includes(busq)) return false;
      }
      return true;
    });
  });

  // Computed: FullCalendar Events
  readonly eventosCalendario = computed<EventInput[]>(() => {
    return this.horarioFiltrado().map(evento => {
      const color = this.obtenerColorPorEstado(evento.estado_asistencia || evento.estado);
      const startIso = evento.hora_inicio ? `${evento.fecha}T${evento.hora_inicio}` : evento.fecha;
      const endIso = evento.hora_fin ? `${evento.fecha}T${evento.hora_fin}` : evento.fecha;

      return {
        id: evento.id_evento.toString(),
        title: `${evento.materia} (${evento.nombre_grupo}) - ${evento.aula}`,
        start: startIso,
        end: endIso,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          eventoData: evento
        }
      };
    });
  });

  // FullCalendar Options configuration
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana'
    },
    locale: 'es',
    firstDay: 1,
    height: 'auto',
    fixedWeekCount: false,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    eventClick: this.handleEventClick.bind(this),
    events: []
  };

  ngOnInit(): void {
    this.cargarDatosEstudiante();
  }

  /**
   * Carga los datos de las vistas PostgreSQL mediante el servicio HttpClient
   */
  cargarDatosEstudiante(): void {
    this.cargando.set(true);

    // 1. Resumen de asistencia
    this.asistenciaService.getResumenEstudiante(this.idEstudianteActual()).subscribe({
      next: (data) => {
        if (data) {
          this.resumen.set(data);
          if (data.estudiante) this.nombreEstudiante.set(data.estudiante);
          if (data.codigo) this.codigoEstudiante.set(data.codigo);
          if (data.id_usuario) this.idEstudianteActual.set(data.id_usuario);
        }
      },
      error: (err) => {
        console.error('Error al cargar resumen del estudiante:', err);
      }
    });

    // 2. Vista de faltas e inasistencias
    this.asistenciaService.getFaltasEstudiante(undefined, this.idEstudianteActual()).subscribe({
      next: (data) => {
        this.faltas.set(data || []);
      },
      error: (err) => {
        console.error('Error al cargar faltas del estudiante:', err);
        this.faltas.set([]);
      }
    });

    // 3. Vista de horario y calendario
    this.asistenciaService.getHorarioEstudiante(undefined, this.idEstudianteActual()).subscribe({
      next: (data) => {
        this.horario.set(data || []);
        this.actualizarEventosCalendario();
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar horario del estudiante:', err);
        this.horario.set([]);
        this.actualizarEventosCalendario();
        this.cargando.set(false);
      }
    });
  }

  /**
   * Actualiza los eventos pasados al FullCalendar
   */
  actualizarEventosCalendario(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.eventosCalendario()
    };
    this.cdr.detectChanges();
  }

  /**
   * Manejador al hacer clic en un evento del calendario
   */
  handleEventClick(arg: EventClickArg): void {
    const evento: VistaHorario = arg.event.extendedProps['eventoData'];
    if (evento) {
      this.abrirDetalleEvento(evento);
    }
  }

  /**
   * Abre el modal de detalle para una clase
   */
  abrirDetalleEvento(evento: VistaHorario): void {
    this.eventoSeleccionado.set(evento);
    this.observacionCheckIn.set('');
    this.modalDetalleAbierto.set(true);
  }

  /**
   * Cierra el modal de detalle
   */
  cerrarModalDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.eventoSeleccionado.set(null);
  }

  /**
   * Acción: Entrar a Clase / Auto-marcar Asistencia
   * Llama a calendario.entrar_a_clase(id_evento) y asistencia.marcar(...)
   */
  ejecutarCheckIn(evento: VistaHorario, estado: EstadoAsistencia = 'presente'): void {
    if (!evento || this.marcandoAsistencia()) return;

    this.marcandoAsistencia.set(true);

    const dto: MarcarAsistenciaDto = {
      id_evento: evento.id_evento,
      id_estudiante: this.idEstudianteActual() || 0,
      estado: estado,
      marcado_por: 'estudiante',
      observacion: this.observacionCheckIn() || null
    };

    // Primero invoca entrar_a_clase y luego marcar asistencia en backend
    this.asistenciaService.entrarAClase(evento.id_evento).subscribe({
      next: () => {
        this.completarMarcadoAsistencia(dto, evento);
      },
      error: (err) => {
        console.warn('Endpoint entrarAClase:', err);
        // Continuar con marcado de asistencia
        this.completarMarcadoAsistencia(dto, evento);
      }
    });
  }

  private completarMarcadoAsistencia(dto: MarcarAsistenciaDto, eventoOriginal: VistaHorario): void {
    this.asistenciaService.marcarAsistencia(dto).subscribe({
      next: () => {
        this.marcandoAsistencia.set(false);

        // Actualizar el estado del evento localmente
        const listaActual = this.horario().map(ev => {
          if (ev.id_evento === eventoOriginal.id_evento) {
            return {
              ...ev,
              estado_asistencia: dto.estado,
              estado: 'en_curso' as EstadoEvento
            };
          }
          return ev;
        });

        this.horario.set(listaActual);

        // Actualizar evento seleccionado en modal
        if (this.eventoSeleccionado()) {
          this.eventoSeleccionado.set({
            ...eventoOriginal,
            estado_asistencia: dto.estado,
            estado: 'en_curso'
          });
        }

        this.actualizarEventosCalendario();
        this.mostrarToast(`¡Asistencia marcada exitosamente como "${dto.estado.toUpperCase()}"!`, 'success');
      },
      error: (err) => {
        console.error('Error al registrar asistencia en backend:', err);
        this.marcandoAsistencia.set(false);
        this.mostrarToast('No se pudo registrar la asistencia en el servidor.', 'error');
      }
    });
  }

  /**
   * Limpia todos los filtros activos
   */
  limpiarFiltros(): void {
    this.filtroMateria.set('');
    this.filtroGrupo.set('');
    this.filtroEstado.set('');
    this.busquedaTexto.set('');
    this.actualizarEventosCalendario();
  }

  /**
   * Determina si una clase es hoy y está disponible para auto-check-in
   */
  esClaseDisponibleHoy(evento: VistaHorario): boolean {
    const hoyIso = new Date().toISOString().split('T')[0];
    const esHoy = evento.fecha === hoyIso;
    const noMarcada = !evento.estado_asistencia || evento.estado_asistencia === 'pendiente';
    return esHoy && noMarcada && (evento.estado === 'programado' || evento.estado === 'en_curso');
  }

  /**
   * Obtiene color hexadecimal de la paleta según el estado
   */
  obtenerColorPorEstado(estado?: string): string {
    if (!estado) return COLORES_ESTADO.pendiente;
    return (COLORES_ESTADO as any)[estado] || COLORES_ESTADO.pendiente;
  }

  /**
   * Muestra un toast de notificación temporal
   */
  mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.toast.set({ mensaje, tipo });
    setTimeout(() => {
      this.toast.set(null);
    }, 4500);
  }

  /**
   * Helper para formatear fecha a formato legible en español
   */
  formatearFechaLegible(fechaIso: string): string {
    if (!fechaIso) return '';
    try {
      const [year, month, day] = fechaIso.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fechaIso;
    }
  }
}
