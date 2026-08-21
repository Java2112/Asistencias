import { Materia } from './materia';
import { Profesor } from './profesor';

export class Horario {

  constructor(
    public id: number,
    public fecha: string,
    public horaInicio: string,
    public horaFin: string,
    public aula: string,
    public materia: Materia,
    public profesor: Profesor
  ) {}

}