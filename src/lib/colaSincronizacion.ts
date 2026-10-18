/**
 * Cola de operaciones offline (IndexedDB nativa, sin dependencias). SOLO para la Plataforma Operativa
 * (escaneo QR en campo): la app de la dirigenta no escribe en diferido porque su API no es idempotente.
 *
 * Replica los campos lógicos de bd_operativa_central.cola_sincronizacion (uuid_transaccion, tipo_transaccion,
 * payload_json, estado, fecha_creacion_local) para que la sincronización sea 1:1 cuando exista
 * POST /api/operativo/sincronizacion (Anexo A de la especificación). La idempotencia es por `uuid`.
 */

export type EstadoOperacion = "PENDIENTE" | "ERROR";

export interface OperacionPendiente {
  uuid: string;
  tipo: string; // p. ej. ESCANEO_QR
  endpoint: string;
  metodo: "POST" | "PUT";
  cuerpo: unknown;
  creadoEn: string; // ISO
  intentos: number;
  estado: EstadoOperacion;
  proximoIntento: number; // epoch ms (backoff exponencial)
}

const NOMBRE_BD = "ollas-operativo";
const ALMACEN = "operaciones";
export const MAX_INTENTOS = 5;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOMBRE_BD, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(ALMACEN, { keyPath: "uuid" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function transaccion<T>(modo: IDBTransactionMode, fn: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const bd = await abrir();
  return new Promise((resolve, reject) => {
    const req = fn(bd.transaction(ALMACEN, modo).objectStore(ALMACEN));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function encolar(op: Pick<OperacionPendiente, "tipo" | "endpoint" | "metodo" | "cuerpo">): Promise<OperacionPendiente> {
  const nueva: OperacionPendiente = {
    ...op,
    uuid: crypto.randomUUID(),
    creadoEn: new Date().toISOString(),
    intentos: 0,
    estado: "PENDIENTE",
    proximoIntento: 0,
  };
  await transaccion("readwrite", (a) => a.put(nueva));
  return nueva;
}

export const listar = (): Promise<OperacionPendiente[]> => transaccion("readonly", (a) => a.getAll());
const guardar = (op: OperacionPendiente) => transaccion("readwrite", (a) => a.put(op));
const eliminar = (uuid: string) => transaccion("readwrite", (a) => a.delete(uuid));

/**
 * Intenta enviar las operaciones pendientes y vencidas por backoff. `enviar` debe lanzar si falla.
 * Tras MAX_INTENTOS la operación queda en ERROR (visible al usuario) y ya no se reintenta sola.
 */
export async function vaciarCola(enviar: (op: OperacionPendiente) => Promise<void>): Promise<{ enviadas: number; fallidas: number }> {
  let enviadas = 0;
  let fallidas = 0;
  const ahora = Date.now();
  for (const op of await listar()) {
    if (op.estado !== "PENDIENTE" || op.proximoIntento > ahora) continue;
    try {
      await enviar(op);
      await eliminar(op.uuid);
      enviadas++;
    } catch {
      const intentos = op.intentos + 1;
      await guardar({
        ...op,
        intentos,
        estado: intentos >= MAX_INTENTOS ? "ERROR" : "PENDIENTE",
        proximoIntento: ahora + 2 ** intentos * 1000,
      });
      fallidas++;
    }
  }
  return { enviadas, fallidas };
}

export async function reintentarErrores(): Promise<void> {
  for (const op of await listar()) {
    if (op.estado === "ERROR") await guardar({ ...op, estado: "PENDIENTE", intentos: 0, proximoIntento: 0 });
  }
}
