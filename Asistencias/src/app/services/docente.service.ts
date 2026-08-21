import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  VistaHorario,
  EstadoAsistencia,
  OperacionAsistenciaResponse,
} from '../models/asistencia.models';

/** Una fila de asistencia.vista_lista_clase */
export interface FilaListaClase {
  id_evento: number;
  fecha: string;
  hora_inicio: string;
  clase: string;
  estado_clase: string;
  id_grupo: number;
  id_profesor: number;
  codigo_profesor: string;
  id_estudiante: number;
  codigo_estudiante: string;
  estudiante: string;
  id_registro: number | null;
  estado_asistencia: EstadoAsistencia | null;
  hora_marcado: string | null;
  observacion: string | null;
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Clases del profesor. Vista: calendario.vista_horario */
  getClasesProfesor(idProfesor: number): Observable<VistaHorario[]> {
    const params = new HttpParams().set('id_profesor', idProfesor.toString());
    return this.http.get<VistaHorario[]>(`${this.baseUrl}/calendario/vista-horario`, { params });
  }

  /** Estudiantes de una clase con su estado. Vista: asistencia.vista_lista_clase */
  getListaClase(idEvento: number): Observable<FilaListaClase[]> {
    const params = new HttpParams().set('id_evento', idEvento.toString());
    return this.http.get<FilaListaClase[]>(`${this.baseUrl}/asistencia/vista-lista-clase`, { params });
  }

  /** Abre la clase para poder pasar lista. Función: calendario.entrar_a_clase() */
  abrirClase(idEvento: number): Observable<OperacionAsistenciaResponse> {
    return this.http.post<OperacionAsistenciaResponse>(`${this.baseUrl}/calendario/entrar-a-clase`, {
      id_evento: idEvento,
    });
  }

  /** Registra la asistencia de un estudiante. Función: asistencia.marcar() */
  marcar(
    idEvento: number,
    idEstudiante: number,
    estado: EstadoAsistencia,
    marcadoPor: number,
  ): Observable<OperacionAsistenciaResponse> {
    return this.http.post<OperacionAsistenciaResponse>(`${this.baseUrl}/asistencia/marcar`, {
      id_evento: idEvento,
      id_estudiante: idEstudiante,
      estado,
      marcado_por: marcadoPor,
    });
  }

  /** Cierra la clase; quien no quedó marcado pasa a ausente. Función: asistencia.cerrar_clase() */
  cerrarClase(idEvento: number): Observable<OperacionAsistenciaResponse> {
    return this.http.post<OperacionAsistenciaResponse>(`${this.baseUrl}/asistencia/cerrar-clase`, {
      id_evento: idEvento,
    });
  }
}
