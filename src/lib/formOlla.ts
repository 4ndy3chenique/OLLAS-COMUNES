import type { DatosOllaInput, OllaComun } from "../types";
import type { FormOlla } from "./schemas";

export const DISTRITOS = [
  "San Juan de Lurigancho",
  "Villa El Salvador",
  "San Juan de Miraflores",
  "Comas",
  "Ate",
  "Villa María del Triunfo",
  "Independencia",
];

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

/** Valores ya validados por Zod → cuerpo que espera la API (POST/PUT de la olla). */
export function datosParaApi(valores: FormOlla): DatosOllaInput {
  return { ...valores, num_personas_declaradas: Number(valores.num_personas_declaradas) };
}
