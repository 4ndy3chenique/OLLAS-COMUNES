import { useEffect, useRef, useState } from "react";
import { useColaOffline } from "../../hooks/useColaOffline";
import { ConnectivityBadge } from "../../components/ui/ConnectivityBadge";
import { Icono } from "../../components/ui/Icono";
import { BannerDemo } from "../../components/ui/BannerDemo";
import { MODO_DEMO } from "../../lib/apiOperativo";

// BarcodeDetector aún no está en los tipos de TypeScript
interface DetectorQr {
  detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opciones: { formats: string[] }) => DetectorQr;
  }
}

/** Escaneo de la guía QR (Plataforma Operativa, DEMO): cámara con BarcodeDetector o código manual. */
export default function EscaneoPage() {
  const cola = useColaOffline();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [detectado, setDetectado] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [registrado, setRegistrado] = useState<string | null>(null);

  const hayDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => {
    if (!camaraActiva) return;
    let flujo: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelado = false;

    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelado || !videoRef.current) return flujo.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = flujo;
        await videoRef.current.play();
        if (!window.BarcodeDetector) return;
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (!videoRef.current) return;
          const [hallazgo] = await detector.detect(videoRef.current).catch(() => []);
          if (hallazgo) {
            navigator.vibrate?.(80);
            setDetectado(hallazgo.rawValue);
            setCamaraActiva(false);
          }
        }, 300);
      } catch {
        setErrorCamara("No pudimos usar la cámara. Revisa los permisos o ingresa el código a mano.");
        setCamaraActiva(false);
      }
    })();

    return () => {
      cancelado = true;
      if (timer) clearInterval(timer);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [camaraActiva]);

  async function confirmar(codigo: string) {
    await cola.registrarEscaneo(codigo);
    setRegistrado(codigo);
    setDetectado(null);
    setManual("");
  }

  return (
    <div>
      {MODO_DEMO && <BannerDemo />}
      <h1 className="mt-4 text-xl font-semibold text-ink">Escanear guía de despacho</h1>
      <p className="mt-1 text-muted">Los escaneos se guardan en el dispositivo y se envían cuando hay conexión.</p>

      <div className="card mt-6 flex flex-col gap-4">
        {hayDetector ? (
          <>
            {camaraActiva ? (
              <div className="relative overflow-hidden rounded bg-ink">
                <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" aria-label="Vista de la cámara" />
                <div aria-hidden className="pointer-events-none absolute inset-8 rounded-lg border-4 border-white/80" />
              </div>
            ) : (
              <button className="btn-primary self-start" onClick={() => { setErrorCamara(null); setRegistrado(null); setCamaraActiva(true); }}>
                <Icono nombre="camara" className="mr-2 h-5 w-5" /> Escanear con la cámara
              </button>
            )}
            {camaraActiva && <button className="btn-secondary self-start" onClick={() => setCamaraActiva(false)}>Cancelar</button>}
          </>
        ) : (
          <p className="text-sm text-muted">Este navegador no puede leer códigos QR con la cámara. Ingresa el código a mano.</p>
        )}
        {errorCamara && <p role="alert" className="flex items-start gap-2 text-sm text-danger"><Icono nombre="alerta" className="mt-0.5 h-4 w-4" /> {errorCamara}</p>}

        <form
          className="flex flex-col gap-2 border-t border-border pt-4"
          onSubmit={(e) => { e.preventDefault(); if (manual.trim()) setDetectado(manual.trim()); }}
        >
          <label className="label-field" htmlFor="qr-manual">Código de la guía (manual)</label>
          <div className="flex gap-2">
            <input id="qr-manual" className="input-field" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Ej. GD-000123" />
            <button type="submit" className="btn-secondary shrink-0 px-4">Leer</button>
          </div>
        </form>
      </div>

      {detectado && (
        <div role="alertdialog" aria-labelledby="qr-confirmar" className="card mt-4 border-info-light bg-info-light">
          <p id="qr-confirmar" className="font-medium text-info">Confirma la guía antes de registrar</p>
          <p className="mt-1 break-all text-lg font-semibold text-ink">{detectado}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => void confirmar(detectado)}>Registrar escaneo</button>
            <button className="btn-secondary" onClick={() => setDetectado(null)}>Descartar</button>
          </div>
        </div>
      )}

      {registrado && (
        <p role="status" className="mt-4 flex items-start gap-2 text-sm text-success">
          <Icono nombre="check" className="mt-0.5 h-4 w-4" /> Escaneo de {registrado} guardado{cola.enLinea ? "" : " en el dispositivo (se enviará al volver la conexión)"}.
        </p>
      )}

      {cola.conError > 0 && (
        <div className="card mt-4 border-danger-light bg-danger-light">
          <p className="text-sm text-danger">{cola.conError} escaneo(s) no pudieron enviarse tras varios intentos.</p>
          <button className="btn-secondary mt-2 h-11" onClick={() => void cola.reintentarErrores()}>Reintentar</button>
        </div>
      )}

      <ConnectivityBadge enLinea={cola.enLinea} sincronizando={cola.sincronizando} pendientes={cola.pendientes} conError={cola.conError} />
    </div>
  );
}
