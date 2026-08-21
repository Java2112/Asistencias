import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../services/admin.service';
import { Materia } from '../../models/materia';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materias.html',
  styleUrl: './materias.css'
})
export class MateriasComponent implements OnInit {

  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  materias: Materia[] = [];

  codigo: string = '';
  nombre: string = '';
  descripcion: string = '';
  creditos: number = 0;
  editando: boolean = false;
  materiaEditandoId: number | null = null;
  mensaje: string = '';

  ngOnInit(): void {
    this.cargarMaterias();
  }

  private cargarMaterias(): void {
    this.adminService.getMaterias().subscribe({
      next: (materias) => {
        this.materias = materias.map(
          materia => new Materia(
            materia.id_materia,
            materia.nombre,
            materia.descripcion ?? '',
            materia.creditos
          )
        );
        this.codigosPorId = new Map(
          materias.map(materia => [materia.id_materia, materia.codigo_materia])
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensaje = 'No fue posible cargar las materias.';
        this.cdr.detectChanges();
      }
    });
  }

  // El código de la materia no está en el modelo Materia, pero la base lo
  // exige y es único, así que se conserva aparte para poder editarlo.
  private codigosPorId = new Map<number, string>();

  crearMateria(): void {

    if (!this.codigo || !this.nombre || !this.descripcion || this.creditos <= 0) {
      this.mensaje = 'Completa código, nombre, descripción y créditos.';
      return;
    }

    this.adminService.crearMateria({
      codigo_materia: this.codigo,
      nombre: this.nombre,
      descripcion: this.descripcion,
      creditos: this.creditos
    }).subscribe({
      next: () => {
        this.limpiarFormulario();
        this.cargarMaterias();
      },
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible crear la materia.';
        this.cdr.detectChanges();
      }
    });

  }

  eliminarMateria(id: number): void {

    this.adminService.desactivarMateria(id).subscribe({
      next: () => this.cargarMaterias(),
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible eliminar la materia.';
        this.cdr.detectChanges();
      }
    });

  }

  editarMateria(materia: Materia): void {

    this.editando = true;
    this.materiaEditandoId = materia.id;

    this.codigo = this.codigosPorId.get(materia.id) ?? '';
    this.nombre = materia.nombre;
    this.descripcion = materia.descripcion;
    this.creditos = materia.creditos;
  }

  guardarCambios(): void {

    if (
      !this.nombre ||
      !this.descripcion ||
      this.creditos <= 0 ||
      this.materiaEditandoId === null
    ) {
      return;
    }

    this.adminService.actualizarMateria(this.materiaEditandoId, {
      codigo_materia: this.codigo,
      nombre: this.nombre,
      descripcion: this.descripcion,
      creditos: this.creditos
    }).subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargarMaterias();
      },
      error: (error) => {
        this.mensaje = error.error?.mensaje ?? 'No fue posible guardar los cambios.';
        this.cdr.detectChanges();
      }
    });

  }

  cancelarEdicion(): void {

    this.editando = false;
    this.materiaEditandoId = null;

    this.limpiarFormulario();
  }

  private limpiarFormulario(): void {
    this.codigo = '';
    this.nombre = '';
    this.descripcion = '';
    this.creditos = 0;
    this.mensaje = '';
  }

}
