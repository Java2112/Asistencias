import { Usuario } from './usuario';
import { Materia } from './materia';

export class Estudiante extends Usuario {

  constructor(
    id: number,
    nombre: string,
    correo: string,
    public semestre: number,
    public materias: Materia[] = []
  ) {
    super(
      id,
      nombre,
      correo,
      'estudiante'
    );
  }


  asignarMateria(materia: Materia): void {

    const yaAsignada = this.materias.some(
      m => m.id === materia.id
    );

    if (!yaAsignada) {
      this.materias.push(materia);
    }

  }


  quitarMateria(materiaId: number): void {

    this.materias = this.materias.filter(
      materia => materia.id !== materiaId
    );

  }

}