import { Component, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocenteService } from '../../services/docente.service';
import { AuthService } from '../../services/auth.service';
import { EstadoAsistencia } from '../../models/asistencia.models';

/**
 * Interfaz para representar a un estudiante en la lista de asistencia
 */
export interface Estudiante {
  idEstudiante: number;
  identificador: string;
  nombreCompleto: string;
  asistio: boolean | null;
}

@Component({
  selector: 'app-lista-asistencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-asistencia.component.html',
  styleUrls: ['./lista-asistencia.component.css']
})
export class ListaAsistenciaComponent implements OnInit {
  private readonly docenteService = inject(DocenteService);
  private readonly auth = inject(AuthService);

  // Input requerido para recibir el ID de la clase
  idClase = input.required<string>();

  // Signal con la lista de estudiantes
  estudiantes = signal<Estudiante[]>([]);
  cargando = signal(false);
  mensaje = signal('');

  ngOnInit(): void {
    this.cargarLista();
  }

  /**
   * Trae los estudiantes inscritos en la clase con el estado que ya tengan
   * registrado, y deja la clase abierta para poder pasar lista.
   */
  private cargarLista(): void {
    const idEvento = Number(this.idClase());
    if (!idEvento) return;

    this.cargando.set(true);

    this.docenteService.abrirClase(idEvento).subscribe({
      // Si la clase ya estaba abierta la función devuelve error; da igual,
      // lo que interesa es tener la lista.
      next: () => this.consultarLista(idEvento),
      error: () => this.consultarLista(idEvento),
    });
  }

  private consultarLista(idEvento: number): void {
    this.docenteService.getListaClase(idEvento).subscribe({
      next: (filas) => {
        this.estudiantes.set(
          filas.map((fila) => ({
            idEstudiante: fila.id_estudiante,
            identificador: fila.codigo_estudiante,
            nombreCompleto: fila.estudiante,
            asistio: this.aBooleano(fila.estado_asistencia),
          })),
        );
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.mensaje.set(
          error.status === 0
            ? 'No hay conexión con el servidor.'
            : 'No fue posible cargar la lista.',
        );
      },
    });
  }

  // 'pendiente' es "sin marcar todavía", que no es lo mismo que ausente.
  private aBooleano(estado: EstadoAsistencia | null): boolean | null {
    if (estado === 'presente' || estado === 'tardanza') return true;
    if (estado === 'ausente') return false;
    return null;
  }

  /**
   * Marca un estudiante como presente
   */
  marcarPresente(identificador: string): void {
    this.registrar(identificador, 'presente');
  }

  /**
   * Marca un estudiante como ausente
   */
  marcarAusente(identificador: string): void {
    this.registrar(identificador, 'ausente');
  }

  /**
   * Envía el estado a la base y refleja el resultado en pantalla.
   */
  private registrar(identificador: string, estado: EstadoAsistencia): void {
    const estudiante = this.estudiantes().find((est) => est.identificador === identificador);
    const profesor = this.auth.sesion();
    if (!estudiante || !profesor) return;

    this.docenteService
      .marcar(Number(this.idClase()), estudiante.idEstudiante, estado, profesor.id_usuario)
      .subscribe({
        next: () => {
          this.estudiantes.update((lista) =>
            lista.map((est) =>
              est.identificador === identificador ? { ...est, asistio: estado === 'presente' } : est,
            ),
          );
          this.mensaje.set('');
        },
        error: (error) => {
          this.mensaje.set(error.error?.mensaje ?? 'No fue posible registrar la asistencia.');
        },
      });
  }

  /**
   * Cierra la clase. Quien no quedó marcado pasa a ausente automáticamente.
   */
  guardarAsistencia(): void {
    this.docenteService.cerrarClase(Number(this.idClase())).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.mensaje);
        this.consultarLista(Number(this.idClase()));
      },
      error: (error) => {
        this.mensaje.set(error.error?.mensaje ?? 'No fue posible cerrar la clase.');
      },
    });
  }
}
