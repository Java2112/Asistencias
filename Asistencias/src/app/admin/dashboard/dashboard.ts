import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { Profesor } from '../../models/profesor';
import { Estudiante } from '../../models/estudiante';
import { Materia } from '../../models/materia';
import { Horario } from '../../models/horario';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  materiasDisponibles: Materia[] = [];

  profesores: Profesor[] = [];

  estudiantes: Estudiante[] = [];

  horarios: Horario[] = [];

  get totalEstudiantes(): number {
    return this.estudiantes.length;
  }

  get totalProfesores(): number {
    return this.profesores.length;
  }

  get totalMaterias(): number {
    return this.materiasDisponibles.length;
  }

  get totalHorarios(): number {
    return this.horarios.length;
  }

  get proximosHorarios(): Horario[] {

    return [...this.horarios]
      .sort((a, b) => {

        const fechaA =
          `${a.fecha}T${a.horaInicio}`;

        const fechaB =
          `${b.fecha}T${b.horaInicio}`;

        return fechaA.localeCompare(fechaB);

      })
      .slice(0, 5);

  }

}