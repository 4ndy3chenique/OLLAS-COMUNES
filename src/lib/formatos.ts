/** Utilidades de presentación. Ninguna cambia datos: solo cómo se muestran. */

/** DNI enmascarado para listas (Ley N.° 29733): 12341236 → ****1236. */
export const enmascararDni = (dni: string): string => `****${dni.slice(-4)}`;

/**
 * Código de expediente digital OC-{año}-{id 6 dígitos}, p. ej. OC-2026-000123.
 * No existe columna en la BD: es solo un formato visual derivado de solicitudes.id y del año de fecha_solicitud.
 * Si el Estado lo exigiera como dato real, habría que agregar columna y endpoint (fase backend).
 */
export function codigoExpediente(id: number, fechaSolicitud?: string | null): string {
  const año = fechaSolicitud ? new Date(fechaSolicitud).getFullYear() : new Date().getFullYear();
  return `OC-${año}-${String(id).padStart(6, "0")}`;
}

/** Columnas DATE de MySQL (YYYY-MM-DD): se interpretan en hora local para no correr un día. */
export const fechaDeDia = (dia: string): string =>
  new Date(`${dia}T00:00:00`).toLocaleDateString("es-PE", { dateStyle: "long" });

export const fechaLarga = (iso: string): string => new Date(iso).toLocaleDateString("es-PE", { dateStyle: "long" });

export const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
