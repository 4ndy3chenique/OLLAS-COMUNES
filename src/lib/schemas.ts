import { z } from "zod";
import { hoyISO } from "./formOlla";

/** Esquemas de validación compartidos. Los nombres de campo salen de la API y de los SQL de bd/. */

export const esquemaDni = z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos");

export const esquemaIdentificador = z
  .string()
  .min(1, "Ingresa tu DNI o correo")
  .refine((v) => /^\d{8}$/.test(v) || z.email().safeParse(v).success, "Ingresa un DNI de 8 dígitos o un correo válido");

export const esquemaLogin = z.object({
  identificador: esquemaIdentificador,
  password: z.string().min(1, "Ingresa tu contraseña"),
  recordarme: z.boolean(),
});
export type FormLogin = z.infer<typeof esquemaLogin>;

export const esquemaRegistro = z.object({
  dni: esquemaDni,
  email: z.email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres").max(72, "Máximo 72 caracteres"),
  aceptaDatos: z.boolean().refine((v) => v, "Debes aceptar el tratamiento de datos (Ley N.° 29733)"),
});
export type FormRegistro = z.infer<typeof esquemaRegistro>;

/** Datos de la olla (wizard y perfil). La cantidad se edita como texto para poder borrar el campo. */
export const esquemaOlla = z.object({
  nombre: z.string().trim().min(3, "Ingresa el nombre de la olla (mínimo 3 caracteres)").max(150, "Máximo 150 caracteres"),
  fecha_fundacion: z
    .string()
    .min(1, "Indica la fecha de creación de la olla")
    .refine((f) => f <= hoyISO(), "La fecha de creación no puede ser futura"),
  distrito: z.string().trim().min(1, "Indica el distrito").max(100, "Máximo 100 caracteres"),
  direccion: z.string().trim().min(5, "Ingresa la dirección del local").max(255, "Máximo 255 caracteres"),
  num_personas_declaradas: z
    .string()
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 500, "Ingresa un número entero entre 1 y 500"),
});
export type FormOlla = z.infer<typeof esquemaOlla>;
