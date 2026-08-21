
export type EstadoAsistencia = 'pendiente' | 'presente' | 'tardanza' | 'ausente' | 'justificado';

export type EstadoEvento = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface VistaResumenEstudiante {
  id_usuario: number;
  codigo: string;
  estudiante: string;
  clases_cerradas: number;
  asistencias: number;
  faltas: number;
  faltas_justificadas: number;
  porcentaje_asistencia: number;
}

export interface VistaFaltaEstudiante {
  id_estudiante: number;
  codigo_estudiante: string;
  estudiante: string;
  fecha: string;
  hora_inicio: string;
  materia: string;
  nombre_grupo: string;
  clase: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  tipo_falta: string;
}

export interface VistaHorario {
  id_evento: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoEvento;
  codigo_materia: string;
  materia: string;
  nombre_grupo: string;
  periodo: string;
  id_grupo: number;
  codigo_profesor: string;
  profesor: string;
  aula: string;
  ubicacion: string;
  estado_asistencia?: EstadoAsistencia;
}

export interface MarcarAsistenciaDto {
  id_evento: number;
  id_estudiante: number;
  estado: EstadoAsistencia;
  marcado_por?: string;
  observacion?: string | null;
}

export interface OperacionAsistenciaResponse {
  success: boolean;
  mensaje: string;
  id_asistencia?: number;
  id_evento?: number;
  fecha_registro?: string;
  estado?: EstadoAsistencia;
}

export interface FiltrosEstudiante {
  materia?: string;
  nombre_grupo?: string;
  estado?: string;
  busqueda?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export const COLORES_ESTADO: Record<EstadoAsistencia | 'programado' | 'en_curso' | 'finalizado' | 'cancelado', string> = {
  presente: '#15803d',
  tardanza: '#b45309',
  ausente: '#ED1736',
  justificado: '#182987',
  pendiente: '#64748B',
  programado: '#182987',
  en_curso: '#182987',
  finalizado: '#64748B',
  cancelado: '#ED1736'
};
