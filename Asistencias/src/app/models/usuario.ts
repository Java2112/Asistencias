export class Usuario {

  constructor(
    public id: number,
    public nombre: string,
    public correo: string,
    public rol: 'administrador' | 'profesor' | 'estudiante'
  ) {}

}