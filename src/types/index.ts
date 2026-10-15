/**
 * Tipos de dominio — reflejan las respuestas de la API (server/routes) sobre
 * las tablas reales de bd_operativa_central y bd_estado_postulaciones.
 */

// ---------------------------------------------------------------------------
// Cuenta (bd_operativa_central.usuarios / roles)
// ---------------------------------------------------------------------------

export type NombreRol =
  | "SOLICITANTE_DIRIGENTE"
  | "ALMACENERO"
  | "TRANSPORTISTA"
  | "AUDITOR"
  | "ADMINISTRADOR";

export type EstadoUsuario = "ACTIVO" | "SUSPENDIDO" | "BLOQUEADO";

export interface Usuario {
  id: number;
  dni: string; // CHAR(8)
  nombres: string;
  apellidos: string;
  email: string;
  rol_id: number;
  rol_nombre: NombreRol;
  olla_id: number | null;
  estado: EstadoUsuario;
  created_at: string; // ISO datetime
}

/** Nombres y apellidos no se envían: el backend los toma de RENIEC. */
export interface RegistroDirigenteInput {
  dni: string;
  email: string;
  password: string;
}

export interface LoginInput {
  identificador: string; // DNI (8 dígitos) o email
  password: string;
}

export interface SesionAutenticada {
  usuario: Usuario;
  access_token: string;
  refresh_token: string;
  expira_en: string; // ISO datetime
}

export interface ResultadoVerificacionReniec {
  dni: string;
  valido: boolean;
  resultado: "VALIDO" | "INVALIDO" | "NO_ENCONTRADO";
  motivo: string | null;
  nombres: string | null;
  apellidos: string | null;
  estado_documento: "VIGENTE" | "VENCIDO" | "ANULADO" | "OBSERVADO" | null;
}

// ---------------------------------------------------------------------------
// Perfil de la olla (bd_operativa_central.ollas_comunes)
// ---------------------------------------------------------------------------

export type EstadoAprobacionOlla = "PENDIENTE" | "APTA" | "NO_APTA";

export interface OllaComun {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  num_personas_declaradas: number | null;
  fecha_fundacion: string | null; // YYYY-MM-DD
  dirigente_usuario_id: number | null;
  solicitud_id_estado: number | null;
  estado_aprobacion: EstadoAprobacionOlla;
  fecha_aprobacion: string | null;
  created_at: string;
  dirigente_nombres: string;
  dirigente_apellidos: string;
}

export interface DatosOllaInput {
  nombre: string;
  num_personas_declaradas: number;
  fecha_fundacion: string; // YYYY-MM-DD
  direccion: string;
  distrito: string;
}

// ---------------------------------------------------------------------------
// Postulación (bd_estado_postulaciones)
// ---------------------------------------------------------------------------

export type EstadoSolicitud = "PENDIENTE" | "EN_EVALUACION" | "OBSERVADA" | "APTA" | "NO_APTA";

export interface Decision {
  id: number;
  decision: "APROBAR" | "OBSERVAR" | "RECHAZAR";
  observaciones: string | null;
  fecha_decision: string;
}

export interface Solicitud {
  id: number;
  olla_nombre: string;
  num_personas_declaradas: number;
  fecha_fundacion: string;
  dirigente_dni: string;
  dirigente_nombres: string;
  dirigente_apellidos: string;
  direccion: string;
  distrito: string;
  fecha_solicitud: string;
  estado: EstadoSolicitud;
  total_integrantes: number;
  editable: boolean;
  decisiones: Decision[];
}

export interface Integrante {
  id: number;
  solicitud_id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  parentesco_con_dirigente: string;
  /** Solo "registrado / no registrado": la clasificación SISFOH es para el evaluador. */
  registrado_sisfoh: boolean;
}

export interface EnvioSolicitudRespuesta {
  solicitud: Solicitud;
  advertencia: string | null;
}

export interface ResultadoSolicitud {
  solicitud: { id: number; olla_nombre: string; estado: EstadoSolicitud };
  evaluacion: {
    id: number;
    resultado_reniec: "VALIDO" | "INVALIDO" | "NO_EVALUADO";
    integrantes_validados: number | null;
    fecha_evaluacion: string;
  } | null;
  asignacion: {
    id: number;
    num_integrantes_aprobados: number;
    kcal_total_asignado: number;
    kg_insumos_asignado: number;
    porciones_diarias: number;
    fecha_asignacion: string;
  } | null;
  olla: OllaComun | null;
}

export interface SolicitudHistorial {
  id: number;
  olla_nombre: string;
  num_personas_declaradas: number;
  fecha_solicitud: string;
  estado: EstadoSolicitud;
  total_integrantes: number;
  fecha_ultima_decision: string | null;
  observaciones: string | null;
  es_renovacion: boolean;
}

export type TipoNotificacion = "OBSERVACION" | "APROBACION" | "RECHAZO" | "VENCIMIENTO" | "INFO";

export interface Notificacion {
  id: number;
  solicitud_id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  created_at: string;
}
