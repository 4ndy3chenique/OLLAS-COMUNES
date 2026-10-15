import { useCallback, useEffect, useState } from "react";
import { api, mensajeDeError } from "../lib/api";
import type { Solicitud } from "../types";

/** Solicitud vigente (la más reciente) del dirigente autenticado. */
export function useSolicitudActual() {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setSolicitud(await api.get<Solicitud | null>("/solicitudes/actual"));
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos cargar tu solicitud."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { solicitud, setSolicitud, cargando, error, recargar };
}
