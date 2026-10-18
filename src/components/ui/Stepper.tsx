import { useEffect, useRef } from "react";

interface StepperProps {
  pasos: { clave: string; etiqueta: string }[];
  /** Índice (0-based) del paso actual. */
  pasoActualIndex: number;
}

/** Pasos horizontales con scroll en pantallas angostas; el paso actual lleva aria-current="step". */
export function Stepper({ pasos, pasoActualIndex }: StepperProps) {
  const actualRef = useRef<HTMLLIElement>(null);

  // Si no caben todos los pasos, el actual siempre queda a la vista
  useEffect(() => {
    actualRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pasoActualIndex]);

  return (
    <ol className="flex w-full items-start overflow-x-auto pb-1" aria-label="Progreso">
      {pasos.map((paso, index) => {
        const completado = index < pasoActualIndex;
        const actual = index === pasoActualIndex;
        return (
          <li key={paso.clave} ref={actual ? actualRef : undefined} aria-current={actual ? "step" : undefined} className="flex min-w-[4.25rem] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${index === 0 ? "bg-transparent" : index <= pasoActualIndex ? "bg-primary" : "bg-border"}`} />
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  completado
                    ? "border-primary bg-primary text-white"
                    : actual
                    ? "border-primary bg-white text-primary"
                    : "border-border bg-white text-muted"
                }`}
              >
                {completado ? "✓" : index + 1}
              </div>
              <div className={`h-0.5 flex-1 ${index === pasos.length - 1 ? "bg-transparent" : completado ? "bg-primary" : "bg-border"}`} />
            </div>
            <p className={`mt-2 px-1 text-sm ${actual || completado ? "font-medium text-ink" : "text-muted"}`}>
              <span className="sr-only">{completado ? "Completado: " : actual ? "Paso actual: " : "Pendiente: "}</span>
              {paso.etiqueta}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
