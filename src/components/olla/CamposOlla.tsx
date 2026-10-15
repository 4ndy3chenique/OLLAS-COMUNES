import { DISTRITOS, hoyISO, type FormOlla } from "../../lib/formOlla";

const OTRO = "Otro";

interface CamposOllaProps {
  form: FormOlla;
  onChange: (form: FormOlla) => void;
  nombreDirigenta: string;
}

/** Campos de la olla común compartidos por la Vista 2 (registro) y la Vista 9 (perfil). */
export function CamposOlla({ form, onChange, nombreDirigenta }: CamposOllaProps) {
  const esDistritoListado = DISTRITOS.includes(form.distrito);
  const set = (campos: Partial<FormOlla>) => onChange({ ...form, ...campos });

  return (
    <>
      <div>
        <label className="label-field" htmlFor="olla-nombre">Nombre de la olla común</label>
        <input
          id="olla-nombre"
          className="input-field"
          placeholder="Ej. Olla Común Unidas Venceremos"
          value={form.nombre}
          onChange={(e) => set({ nombre: e.target.value })}
          maxLength={150}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="olla-personas">Cantidad de personas involucradas</label>
          <input
            id="olla-personas"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="input-field"
            value={form.num_personas_declaradas}
            onChange={(e) => set({ num_personas_declaradas: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="olla-fecha">Fecha de creación de la olla</label>
          <input
            id="olla-fecha"
            type="date"
            max={hoyISO()}
            className="input-field"
            value={form.fecha_fundacion}
            onChange={(e) => set({ fecha_fundacion: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="olla-dirigenta">Nombre de la dirigenta</label>
        <input id="olla-dirigenta" className="input-field bg-bg text-muted" value={nombreDirigenta} disabled />
        <p className="mt-1 text-sm text-muted">Se toma de tu cuenta. Puedes cambiarlo desde tu perfil.</p>
      </div>

      <div>
        <label className="label-field" htmlFor="olla-distrito">Distrito</label>
        <select
          id="olla-distrito"
          className="input-field"
          value={esDistritoListado ? form.distrito : OTRO}
          onChange={(e) => set({ distrito: e.target.value === OTRO ? "" : e.target.value })}
        >
          {DISTRITOS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          <option value={OTRO}>Otro distrito</option>
        </select>
        {!esDistritoListado && (
          <input
            aria-label="Nombre del distrito"
            className="input-field mt-2"
            placeholder="Escribe el nombre del distrito"
            value={form.distrito}
            onChange={(e) => set({ distrito: e.target.value })}
            maxLength={100}
            required
          />
        )}
      </div>

      <div>
        <label className="label-field" htmlFor="olla-direccion">Dirección</label>
        <input
          id="olla-direccion"
          className="input-field"
          placeholder="Jirón, número, manzana/lote y referencia"
          value={form.direccion}
          onChange={(e) => set({ direccion: e.target.value })}
          maxLength={255}
          required
        />
      </div>
    </>
  );
}
