import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  VistaResumenEstudiante,
  VistaFaltaEstudiante,
  VistaHorario,
  MarcarAsistenciaDto,
  OperacionAsistenciaResponse,
  FiltrosEstudiante
} from '../models/asistencia.models';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Obtiene el resumen de asistencias y métricas del estudiante
   * Mapeado a la vista PostgreSQL: asistencia.vista_resumen_estudiante
   * @param idEstudiante ID del estudiante opcional si viene por sesión/token
   */
  getResumenEstudiante(idEstudiante?: number): Observable<VistaResumenEstudiante> {
    let params = new HttpParams();
    if (idEstudiante) {
      params = params.set('id_usuario', idEstudiante.toString());
    }
    return this.http.get<VistaResumenEstudiante>(`${this.baseUrl}/asistencia/vista-resumen-estudiante`, { params });
  }

  /**
   * Obtiene el listado de inasistencias y faltas del estudiante
   * Mapeado a la vista PostgreSQL: asistencia.vista_faltas_estudiante
   * @param filtros Filtros opcionales por materia, grupo, estado o fechas
   * @param idEstudiante ID del estudiante opcional
   */
  getFaltasEstudiante(filtros?: FiltrosEstudiante, idEstudiante?: number): Observable<VistaFaltaEstudiante[]> {
    let params = new HttpParams();
    if (idEstudiante) {
      params = params.set('id_estudiante', idEstudiante.toString());
    }
    if (filtros?.materia) {
      params = params.set('materia', filtros.materia);
    }
    if (filtros?.nombre_grupo) {
      params = params.set('nombre_grupo', filtros.nombre_grupo);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }

    return this.http.get<VistaFaltaEstudiante[]>(`${this.baseUrl}/asistencia/vista-faltas-estudiante`, { params });
  }

  /**
   * Obtiene la programación y calendario de clases del estudiante
   * Mapeado a la vista PostgreSQL: calendario.vista_horario
   * @param filtros Filtros opcionales por materia, grupo, estado o fechas
   * @param idEstudiante ID del estudiante opcional
   */
  getHorarioEstudiante(filtros?: FiltrosEstudiante, idEstudiante?: number): Observable<VistaHorario[]> {
    let params = new HttpParams();
    if (idEstudiante) {
      params = params.set('id_estudiante', idEstudiante.toString());
    }
    if (filtros?.materia) {
      params = params.set('materia', filtros.materia);
    }
    if (filtros?.nombre_grupo) {
      params = params.set('nombre_grupo', filtros.nombre_grupo);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fecha_inicio) {
      params = params.set('fecha_inicio', filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      params = params.set('fecha_fin', filtros.fecha_fin);
    }

    return this.http.get<VistaHorario[]>(`${this.baseUrl}/calendario/vista-horario`, { params });
  }

  /**
   * Permite al estudiante unirse a la sesión de clase activa del día
   * Procedimiento / función: calendario.entrar_a_clase(id_evento)
   * @param idEvento Identificador de la clase / evento
   */
  entrarAClase(idEvento: number): Observable<OperacionAsistenciaResponse> {
    return this.http.post<OperacionAsistenciaResponse>(`${this.baseUrl}/calendario/entrar-a-clase`, {
      id_evento: idEvento
    });
  }

  /**
   * Permite registrar o actualizar el auto-marcado de asistencia del estudiante
   * Procedimiento / función: asistencia.marcar(id_evento, id_estudiante, estado, marcado_por, observacion)
   * @param dto Datos del registro de asistencia
   */
  marcarAsistencia(dto: MarcarAsistenciaDto): Observable<OperacionAsistenciaResponse> {
    return this.http.post<OperacionAsistenciaResponse>(`${this.baseUrl}/asistencia/marcar`, dto);
  }
}
