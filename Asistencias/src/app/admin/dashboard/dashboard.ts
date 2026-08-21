import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { AdminService } from '../../services/admin.service';
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
export class Dashboard implements OnInit {

  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  materiasDisponibles: Materia[] = [];

  profesores: Profesor[] = [];

  estudiantes: Estudiante[] = [];

  horarios: Horario[] = [];

  ngOnInit(): void {
    this.cargarResumen();
  }

  /**
   * Los cuatro conteos y los próximos horarios salen de la base, no de
   * listas en memoria.
   */
  private cargarResumen(): void {

    this.adminService.getMaterias().subscribe({
      next: (materias) => {
        this.materiasDisponibles = materias.map(
          materia => new Materia(
            materia.id_materia,
            materia.nombre,
            materia.descripcion ?? '',
            materia.creditos
          )
        );
        this.cdr.detectChanges();
      }
    });

    this.adminService.getDirectorio().subscribe({
      next: (personas) => {

        this.profesores = personas
          .filter(persona => persona.rol === 'Profesor')
          .map(persona => new Profesor(
            persona.id_usuario,
            persona.nombre_completo,
            persona.correo
          ));

        this.estudiantes = personas
          .filter(persona => persona.rol === 'Estudiante')
          .map(persona => new Estudiante(
            persona.id_usuario,
            persona.nombre_completo,
            persona.correo,
            persona.semestre ?? 1
          ));

        this.cdr.detectChanges();
      }
    });

    this.adminService.getEventos().subscribe({
      next: (eventos) => {
        this.horarios = eventos.map(
          evento => new Horario(
            evento.id_evento,
            evento.fecha,
            evento.hora_inicio,
            evento.hora_fin,
            evento.aula ?? '',
            new Materia(0, evento.materia, '', 0),
            new Profesor(0, evento.profesor, '')
          )
        );
        this.cdr.detectChanges();
      }
    });

  }

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
