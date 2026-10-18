import { useCallback, useEffect, useRef, useState } from "react";
import { encolar, listar, reintentarErrores, vaciarCola, type OperacionPendiente } from "../lib/colaSincronizacion";
import { enviarOperacion } from "../lib/apiOperativo";

/** Estado de conectividad + cola offline de la Plataforma Operativa. */
export function useColaOffline() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [operaciones, setOperaciones] = useState<OperacionPendiente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const enCurso = useRef(false);

  const refrescar = useCallback(async () => setOperaciones(await listar()), []);

  const sincronizar = useCallback(async () => {
    if (enCurso.current || !navigator.onLine) return;
    enCurso.current = true;
    setSincronizando(true);
    try {
      await vaciarCola(enviarOperacion);
    } finally {
      enCurso.current = false;
      setSincronizando(false);
      await refrescar();
    }
  }, [refrescar]);

  // Se vacía al volver la red, al recuperar el foco y cada 15 s (los reintentos respetan el backoff)
  useEffect(() => {
    const alCambiarRed = () => {
      setEnLinea(navigator.onLine);
      void sincronizar();
    };
    const alFoco = () => void sincronizar();
    const intervalo = setInterval(() => void sincronizar(), 15000);
    window.addEventListener("online", alCambiarRed);
    window.addEventListener("offline", alCambiarRed);
    window.addEventListener("focus", alFoco);
    void sincronizar();
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("online", alCambiarRed);
      window.removeEventListener("offline", alCambiarRed);
      window.removeEventListener("focus", alFoco);
    };
  }, [sincronizar]);

  /** Registra un escaneo QR: siempre se encola (offline-first) y se intenta enviar enseguida. */
  async function registrarEscaneo(codigoQr: string) {
    await encolar({
      tipo: "ESCANEO_QR",
      endpoint: "/operativo/escaneos",
      metodo: "POST",
      cuerpo: { codigo_qr: codigoQr, escaneado_en: new Date().toISOString() },
    });
    await refrescar();
    void sincronizar();
  }

  const pendientes = operaciones.filter((o) => o.estado === "PENDIENTE").length;
  const conError = operaciones.filter((o) => o.estado === "ERROR").length;

  return {
    enLinea,
    sincronizando,
    pendientes,
    conError,
    operaciones,
    registrarEscaneo,
    sincronizar,
    reintentarErrores: async () => {
      await reintentarErrores();
      await sincronizar();
    },
  };
}
