import { useFormContext } from "react-hook-form";
import { DISTRITOS, hoyISO } from "../../lib/formOlla";
import type { FormOlla } from "../../lib/schemas";
import { Campo } from "../ui/Campo";

const OTRO = "Otro";

/** Los campos de la olla se reparten en bloques para que el wizard los muestre por pasos y el perfil juntos. */

export function CamposNombreFecha() {
  const { register, formState: { errors } } = useFormContext<FormOlla>();
  return (
    <>
      <Campo id="olla-nombre" etiqueta="Nombre de la olla común" error={errors.nombre?.message}>
        <input
          id="olla-nombre"
          className="input-field"
          placeholder="Ej. Olla Común Unidas Venceremos"
          maxLength={150}
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? "olla-nombre-error" : undefined}
          {...register("nombre")}
        />
      </Campo>
      <Campo id="olla-fecha" etiqueta="Fecha de creación de la olla" error={errors.fecha_fundacion?.message}>
        <input
          id="olla-fecha"
          type="date"
          max={hoyISO()}
          className="input-field"
          aria-invalid={!!errors.fecha_fundacion}
          aria-describedby={errors.fecha_fundacion ? "olla-fecha-error" : undefined}
          {...register("fecha_fundacion")}
        />
      </Campo>
    </>
  );
}

export function CamposUbicacion() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FormOlla>();
  const distrito = watch("distrito");
  const esListado = DISTRITOS.includes(distrito);

  return (
    <>
      <Campo id="olla-distrito" etiqueta="Distrito" error={errors.distrito?.message}>
        <select
          id="olla-distrito"
          className="input-field"
          value={esListado ? distrito : OTRO}
          onChange={(e) => setValue("distrito", e.target.value === OTRO ? "" : e.target.value, { shouldValidate: true })}
        >
          {DISTRITOS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          <option value={OTRO}>Otro distrito</option>
        </select>
        {!esListado && (
          <input
            aria-label="Nombre del distrito"
            className="input-field mt-2"
            placeholder="Escribe el nombre del distrito"
            maxLength={100}
            aria-invalid={!!errors.distrito}
            aria-describedby={errors.distrito ? "olla-distrito-error" : undefined}
            {...register("distrito")}
          />
        )}
      </Campo>
      <Campo id="olla-direccion" etiqueta="Dirección del local" error={errors.direccion?.message}>
        <input
          id="olla-direccion"
          className="input-field"
          placeholder="Jirón, número, manzana/lote y referencia"
          maxLength={255}
          aria-invalid={!!errors.direccion}
          aria-describedby={errors.direccion ? "olla-direccion-error" : undefined}
          {...register("direccion")}
        />
      </Campo>
    </>
  );
}

export function CampoPersonas() {
  const { register, formState: { errors } } = useFormContext<FormOlla>();
  return (
    <Campo
      id="olla-personas"
      etiqueta="Cantidad de personas involucradas"
      error={errors.num_personas_declaradas?.message}
      ayuda="Cuántas personas se alimentan en tu olla. Luego registrarás a cada integrante con su DNI."
    >
      <input
        id="olla-personas"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        className="input-field"
        aria-invalid={!!errors.num_personas_declaradas}
        aria-describedby={errors.num_personas_declaradas ? "olla-personas-error" : undefined}
        {...register("num_personas_declaradas")}
      />
    </Campo>
  );
}

export function CampoDirigenta({ nombre }: { nombre: string }) {
  return (
    <div>
      <label className="label-field" htmlFor="olla-dirigenta">Nombre de la dirigenta</label>
      <input id="olla-dirigenta" className="input-field bg-bg text-muted" value={nombre} disabled />
      <p className="mt-1 text-sm text-muted">Se toma de tu cuenta (datos de RENIEC).</p>
    </div>
  );
}

/** Todos los campos juntos (perfil). */
export function CamposOlla({ nombreDirigenta }: { nombreDirigenta: string }) {
  return (
    <>
      <CamposNombreFecha />
      <CampoDirigenta nombre={nombreDirigenta} />
      <CamposUbicacion />
      <CampoPersonas />
    </>
  );
}
