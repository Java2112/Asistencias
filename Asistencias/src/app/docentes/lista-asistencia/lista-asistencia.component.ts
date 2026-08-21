import { Component, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interfaz para representar a un estudiante en la lista de asistencia
 */
export interface Estudiante {
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
  // Input requerido para recibir el ID de la clase
  idClase = input.required<string>();

  // Signal con la lista de estudiantes
  estudiantes = signal<Estudiante[]>([
    {
      identificador: 'EST-001',
      nombreCompleto: 'Juan Carlos Rodríguez',
      asistio: null
    },
    {
      identificador: 'EST-002',
      nombreCompleto: 'María de los Ángeles García',
      asistio: null
    },
    {
      identificador: 'EST-003',
      nombreCompleto: 'Pedro Antonio López',
      asistio: null
    },
    {
      identificador: 'EST-004',
      nombreCompleto: 'Sofía Elena Martínez',
      asistio: null
    },
    {
      identificador: 'EST-005',
      nombreCompleto: 'Carlos Felipe Díaz',
      asistio: null
    }
  ]);

  ngOnInit(): void {
    // Inicializar con el ID de la clase
    console.log(`Cargando lista de asistencia para clase: ${this.idClase()}`);
  }

  /**
   * Marca un estudiante como presente
   */
  marcarPresente(identificador: string): void {
    const listaActual = this.estudiantes();
    const estudianteActualizado = listaActual.map(est =>
      est.identificador === identificador
        ? { ...est, asistio: true }
        : est
    );
    this.estudiantes.set(estudianteActualizado);
  }

  /**
   * Marca un estudiante como ausente
   */
  marcarAusente(identificador: string): void {
    const listaActual = this.estudiantes();
    const estudianteActualizado = listaActual.map(est =>
      est.identificador === identificador
        ? { ...est, asistio: false }
        : est
    );
    this.estudiantes.set(estudianteActualizado);
  }

  /**
   * Guarda la asistencia y la imprime en consola
   */
  guardarAsistencia(): void {
    console.log(`\n📋 ASISTENCIA - CLASE: ${this.idClase()}`);
    console.table(this.estudiantes());
    console.log('✅ Asistencia guardada correctamente\n');
  }
}
