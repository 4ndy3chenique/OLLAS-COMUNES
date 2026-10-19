/**
 * Módulo 14 — Utilidades de presentación (formatos.ts + parentescos.ts).
 * Prueba 1 (éxito): DNI enmascarado (Ley N.° 29733), código de expediente OC-{año}-{6 dígitos}
 *   y etiquetas de parentesco.
 * Prueba 2 (estado límite): las fechas DATE de MySQL se interpretan en hora local sin correr un día.
 */
import { describe, it, expect } from "vitest";
import { codigoExpediente, enmascararDni, fechaDeDia, fechaHora, fechaLarga } from "../lib/formatos";
import { PARENTESCOS, etiquetaParentesco } from "../lib/parentescos";
import { hoyISO } from "../lib/formOlla";

describe("M14 · Utilidades de presentación (formatos + parentescos)", () => {
  it("Prueba 1 (éxito): enmascara el DNI, deriva el expediente y traduce parentescos", () => {
    // DNI enmascarado para listas: solo los últimos 4 dígitos
    expect(enmascararDni("12341236")).toBe("****1236");

    // Expediente visual OC-{año de la solicitud}-{id con 6 dígitos}
    expect(codigoExpediente(123, "2026-03-10T10:00:00")).toBe("OC-2026-000123");
    expect(codigoExpediente(7, null)).toBe(`OC-${new Date().getFullYear()}-000007`);

    // Parentescos definidos por el contrato; un valor desconocido se muestra tal cual
    expect(PARENTESCOS).toHaveLength(7);
    expect(etiquetaParentesco("TITULAR")).toBe("Soy yo (la dirigenta)");
    expect(etiquetaParentesco("HIJO")).toBe("Hijo o hija");
    expect(etiquetaParentesco("VALOR_DESCONOCIDO")).toBe("VALOR_DESCONOCIDO");
  });

  it("Prueba 2 (estado límite): las fechas no corren un día por zona horaria", () => {
    // DATE de MySQL (YYYY-MM-DD): se interpreta como hora local, nunca como UTC
    expect(fechaDeDia("2026-03-10")).toBe("10 de marzo de 2026");
    expect(fechaDeDia("2026-01-01")).toBe("1 de enero de 2026");
    expect(fechaLarga("2026-03-12T10:00:00")).toContain("12 de marzo de 2026");
    expect(fechaHora("2026-03-12T10:00:00")).toContain("2026");

    // hoyISO() entrega la fecha local como YYYY-MM-DD (base del máximo permitido en el wizard)
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hoyISO().slice(0, 4)).toBe(String(new Date().getFullYear()));
  });
});
