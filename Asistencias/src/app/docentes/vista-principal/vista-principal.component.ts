import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarioDocenteComponent } from '../calendario-docente/calendario-docente.component';
import { ListaAsistenciaComponent } from '../lista-asistencia/lista-asistencia.component';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [CommonModule, CalendarioDocenteComponent, ListaAsistenciaComponent],
  templateUrl: './vista-principal.component.html',
  styleUrls: ['./vista-principal.component.css']
})
export class VistaPrincipalComponent {
  // Signal para guardar el ID de la clase seleccionada
  claseSeleccionada = signal<string | null>(null);

  /**
   * Actualiza el signal con el ID de la clase seleccionada
   */
  seleccionarClase(idClase: string): void {
    this.claseSeleccionada.set(idClase);
  }

  /**
   * Vuelve al calendario estableciendo el signal en null
   */
  volverAlCalendario(): void {
    this.claseSeleccionada.set(null);
  }
}
