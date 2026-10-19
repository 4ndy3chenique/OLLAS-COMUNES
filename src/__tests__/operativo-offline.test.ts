/**
 * Módulo 12 — Plataforma Operativa: cola offline (colaSincronizacion.ts, IndexedDB).
 * Prueba 1 (éxito): una operación encolada (escaneo QR) se envía y desaparece de la cola.
 * Prueba 2 (estado límite/error): los fallos aplican backoff exponencial, tras MAX_INTENTOS la
 *   operación queda en ERROR (no se reintenta sola) y "Reintentar" la devuelve a PENDIENTE.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { encolar, listar, vaciarCola, reintentarErrores, MAX_INTENTOS } from "../lib/colaSincronizacion";

const OPERACION = {
  tipo: "ESCANEO_QR",
  endpoint: "/operativo/escaneos",
  metodo: "POST" as const,
  cuerpo: { codigo_qr: "GD-000123", escaneado_en: "2026-10-10T10:00:00.000Z" },
};

describe("M12 · Cola offline de la Plataforma Operativa (IndexedDB)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Prueba 1 (éxito): la operación encolada se envía y la cola queda vacía", async () => {
    const creada = await encolar(OPERACION);
    expect(creada.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(creada).toMatchObject({ estado: "PENDIENTE", intentos: 0, tipo: "ESCANEO_QR" });
    expect(await listar()).toHaveLength(1);

    // vaciarCola envía lo pendiente y elimina lo enviado (idempotencia por uuid en el backend)
    const enviadas: string[] = [];
    const resultado = await vaciarCola(async (op) => {
      enviadas.push(op.uuid);
    });

    expect(resultado).toEqual({ enviadas: 1, fallidas: 0 });
    expect(enviadas).toEqual([creada.uuid]);
    expect(await listar()).toEqual([]);
  });

  it("Prueba 2 (error): backoff, estado ERROR tras MAX_INTENTOS y reintento manual", async () => {
    await encolar(OPERACION);
    const enviar = vi.fn(async () => {
      throw new Error("Sin conexión");
    });

    // Reloj controlado: cada "ahora" se mueve al próximo intento permitido por el backoff
    const T0 = Date.now();
    const reloj = vi.spyOn(Date, "now").mockReturnValue(T0);

    // 1er fallo: sigue PENDIENTE y el próximo intento respeta el backoff (2^1 s)
    expect(await vaciarCola(enviar)).toEqual({ enviadas: 0, fallidas: 1 });
    let [guardada] = await listar();
    expect(guardada).toMatchObject({ intentos: 1, estado: "PENDIENTE" });
    expect(guardada.proximoIntento).toBe(T0 + 2_000);

    // Fallos sucesivos hasta agotar MAX_INTENTOS
    for (let intento = 2; intento <= MAX_INTENTOS; intento++) {
      reloj.mockReturnValue(guardada.proximoIntento);
      expect(await vaciarCola(enviar)).toEqual({ enviadas: 0, fallidas: 1 });
      [guardada] = await listar();
    }
    expect(guardada).toMatchObject({ intentos: MAX_INTENTOS, estado: "ERROR" });

    // Ya no se reintenta sola…
    reloj.mockReturnValue(guardada.proximoIntento + 1);
    expect(await vaciarCola(enviar)).toEqual({ enviadas: 0, fallidas: 0 });
    expect(enviar).toHaveBeenCalledTimes(MAX_INTENTOS);

    // …hasta que la persona usuaria pulsa "Reintentar" y vuelve la conexión
    await reintentarErrores();
    [guardada] = await listar();
    expect(guardada).toMatchObject({ estado: "PENDIENTE", intentos: 0, proximoIntento: 0 });

    reloj.mockReturnValue(Number.MAX_SAFE_INTEGER);
    expect(await vaciarCola(async () => undefined)).toEqual({ enviadas: 1, fallidas: 0 });
    expect(await listar()).toEqual([]);
  });
});
