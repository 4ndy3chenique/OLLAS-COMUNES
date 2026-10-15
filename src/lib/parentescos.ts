/** Valores guardados en integrantes_solicitud.parentesco_con_dirigente (VARCHAR 50). */
export const PARENTESCOS: { valor: string; etiqueta: string }[] = [
  { valor: "TITULAR", etiqueta: "Soy yo (la dirigenta)" },
  { valor: "CONYUGE", etiqueta: "Cónyuge o pareja" },
  { valor: "HIJO", etiqueta: "Hijo o hija" },
  { valor: "PADRE_MADRE", etiqueta: "Padre o madre" },
  { valor: "HERMANO", etiqueta: "Hermano o hermana" },
  { valor: "OTRO_FAMILIAR", etiqueta: "Otro familiar" },
  { valor: "SIN_PARENTESCO", etiqueta: "Sin parentesco (vecina, vecino)" },
];

export function etiquetaParentesco(valor: string): string {
  return PARENTESCOS.find((p) => p.valor === valor)?.etiqueta ?? valor;
}
