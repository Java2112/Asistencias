import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Materia } from '../../models/materia';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materias.html',
  styleUrl: './materias.css'
})
export class MateriasComponent {

  materias: Materia[] = [];

  nombre: string = '';
  descripcion: string = '';
  creditos: number = 0;
  editando: boolean = false;
  materiaEditandoId: number | null = null;

  crearMateria(): void {

    if (!this.nombre || !this.descripcion || this.creditos <= 0) {
      return;
    }

    const nuevoId = this.materias.length > 0
      ? Math.max(...this.materias.map(materia => materia.id)) + 1
      : 1;

    const nuevaMateria = new Materia(
      nuevoId,
      this.nombre,
      this.descripcion,
      this.creditos
    );

    this.materias.push(nuevaMateria);

    this.limpiarFormulario();
  }

  eliminarMateria(id: number): void {

    this.materias = this.materias.filter(
      materia => materia.id !== id
    );

  }

  editarMateria(materia: Materia): void {

    this.editando = true;
    this.materiaEditandoId = materia.id;

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

    const materia = this.materias.find(
      materia => materia.id === this.materiaEditandoId
    );

    if (!materia) {
      return;
    }

    materia.nombre = this.nombre;
    materia.descripcion = this.descripcion;
    materia.creditos = this.creditos;

    this.cancelarEdicion();
  }

  cancelarEdicion(): void {

    this.editando = false;
    this.materiaEditandoId = null;

    this.limpiarFormulario();
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.descripcion = '';
    this.creditos = 0;
  }

}