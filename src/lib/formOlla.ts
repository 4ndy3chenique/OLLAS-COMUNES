import type { DatosOllaInput, OllaComun } from "../types";

export const DISTRITOS = [
  "San Juan de Lurigancho",
  "Villa El Salvador",
  "San Juan de Miraflores",
  "Comas",
  "Ate",
  "Villa María del Triunfo",
  "Independencia",
];

/** Estado del formulario: la cantidad se edita como texto para permitir borrar el campo. */
export type FormOlla = Omit<DatosOllaInput, "num_personas_declaradas"> & { num_personas_declaradas: string };

export const FORM_OLLA_VACIO: FormOlla = {
  nombre: "",
  num_personas_declaradas: "",
  fecha_fundacion: "",
  direccion: "",
  distrito: DISTRITOS[0],
};

/** Fecha de hoy en hora local como YYYY-MM-DD. */
export const hoyISO = () => new Date().toLocaleDateString("en-CA");

export function formOllaDesdeOlla(olla: OllaComun): FormOlla {
  return {
    nombre: olla.nombre,
    num_personas_declaradas: olla.num_personas_declaradas ? String(olla.num_personas_declaradas) : "",
    fecha_fundacion: olla.fecha_fundacion ?? "",
    direccion: olla.direccion,
    distrito: olla.distrito,
  };
}

/** Convierte y valida en cliente; devuelve el mensaje de error o los datos listos para enviar. */
export function validarFormOlla(form: FormOlla): { error: string } | { datos: DatosOllaInput } {
  const num = Number(form.num_personas_declaradas);
  if (!Number.isInteger(num) || num <= 0) {
    return { error: "La cantidad de personas debe ser un número entero mayor que 0." };
  }
  if (!form.fecha_fundacion) return { error: "Indica la fecha de creación de la olla." };
  if (form.fecha_fundacion > hoyISO()) return { error: "La fecha de creación no puede ser futura." };
  if (!form.distrito.trim()) return { error: "Indica el distrito." };
  return { datos: { ...form, num_personas_declaradas: num } };
}
