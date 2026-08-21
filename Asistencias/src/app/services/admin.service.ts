import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VistaHorario } from '../models/asistencia.models';

/** Fila de usuarios.vista_directorio_admin */
export interface FilaDirectorio {
  id_usuario: number;
  codigo: string;
  rol: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  especialidad: string | null;
  titulo: string | null;
  programa: string | null;
  semestre: number | null;
}

export interface MateriaApi {
  id_materia: number;
  codigo_materia: string;
  nombre: string;
  descripcion: string | null;
  creditos: number;
  activa: boolean;
}

export interface GrupoApi {
  id_grupo: number;
  nombre_grupo: string;
  periodo: string;
  activo: boolean;
  id_materia: number;
  materia: string;
  codigo_materia: string;
  id_profesor: number;
  profesor: string;
  inscritos: number;
}

export interface InscripcionApi {
  id_inscripcion: number;
  id_grupo: number;
  id_estudiante: number;
  activa: boolean;
  nombre_grupo: string;
  id_materia: number;
  materia: string;
}

export interface RolApi {
  id_rol: number;
  clave: string;
  nombre: string;
  descripcion: string;
}

export interface AulaApi {
  id_aula: number;
  nombre: string;
  ubicacion: string;
  capacidad: number;
}

export interface NuevoUsuario {
  codigo: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string | null;
  contrasena: string;
  id_rol: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // --- Directorio de personas ---

  getDirectorio(rol?: string): Observable<FilaDirectorio[]> {
    let params = new HttpParams();
    if (rol) params = params.set('rol', rol);
    return this.http.get<FilaDirectorio[]>(`${this.baseUrl}/usuarios/directorio`, { params });
  }

  getRoles(): Observable<RolApi[]> {
    return this.http.get<RolApi[]>(`${this.baseUrl}/usuarios/roles`);
  }

  crearUsuario(usuario: NuevoUsuario): Observable<FilaDirectorio> {
    return this.http.post<FilaDirectorio>(`${this.baseUrl}/usuarios`, usuario);
  }

  actualizarUsuario(id: number, cambios: Partial<FilaDirectorio>): Observable<FilaDirectorio> {
    return this.http.put<FilaDirectorio>(`${this.baseUrl}/usuarios/${id}`, cambios);
  }

  desactivarUsuario(id: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(`${this.baseUrl}/usuarios/${id}`);
  }

  // --- Materias ---

  getMaterias(): Observable<MateriaApi[]> {
    return this.http.get<MateriaApi[]>(`${this.baseUrl}/academico/materias`);
  }

  crearMateria(materia: Partial<MateriaApi>): Observable<MateriaApi> {
    return this.http.post<MateriaApi>(`${this.baseUrl}/academico/materias`, materia);
  }

  actualizarMateria(id: number, cambios: Partial<MateriaApi>): Observable<MateriaApi> {
    return this.http.put<MateriaApi>(`${this.baseUrl}/academico/materias/${id}`, cambios);
  }

  desactivarMateria(id: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(
      `${this.baseUrl}/academico/materias/${id}`,
    );
  }

  // --- Grupos e inscripciones ---

  getGrupos(): Observable<GrupoApi[]> {
    return this.http.get<GrupoApi[]>(`${this.baseUrl}/academico/grupos`);
  }

  crearGrupo(grupo: {
    id_materia: number;
    id_profesor: number;
    nombre_grupo: string;
    periodo: string;
  }): Observable<GrupoApi> {
    return this.http.post<GrupoApi>(`${this.baseUrl}/academico/grupos`, grupo);
  }

  /** Sin identificador devuelve las inscripciones de todos los estudiantes. */
  getInscripciones(idEstudiante?: number): Observable<InscripcionApi[]> {
    let params = new HttpParams();
    if (idEstudiante) params = params.set('id_estudiante', idEstudiante.toString());
    return this.http.get<InscripcionApi[]>(`${this.baseUrl}/academico/inscripciones`, { params });
  }

  inscribir(idGrupo: number, idEstudiante: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/academico/inscripciones`, {
      id_grupo: idGrupo,
      id_estudiante: idEstudiante,
    });
  }

  quitarInscripcion(idInscripcion: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(
      `${this.baseUrl}/academico/inscripciones/${idInscripcion}`,
    );
  }

  // --- Calendario ---

  getEventos(): Observable<VistaHorario[]> {
    return this.http.get<VistaHorario[]>(`${this.baseUrl}/calendario/eventos`);
  }

  getAulas(): Observable<AulaApi[]> {
    return this.http.get<AulaApi[]>(`${this.baseUrl}/calendario/aulas`);
  }

  crearEvento(evento: {
    id_grupo: number;
    id_profesor: number;
    id_aula: number | null;
    titulo: string;
    descripcion?: string | null;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    creado_por: number;
  }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/calendario/eventos`, evento);
  }

  actualizarEvento(
    id: number,
    cambios: {
      id_grupo?: number;
      id_profesor?: number;
      id_aula?: number | null;
      titulo?: string;
      fecha?: string;
      hora_inicio?: string;
      hora_fin?: string;
    },
  ): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/calendario/eventos/${id}`, cambios);
  }

  eliminarEvento(id: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(
      `${this.baseUrl}/calendario/eventos/${id}`,
    );
  }
}
