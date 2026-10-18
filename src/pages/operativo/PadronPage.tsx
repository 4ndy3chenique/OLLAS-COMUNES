import { useEffect, useState } from "react";
import { MODO_DEMO, obtenerPadron, type IntegrantePadron } from "../../lib/apiOperativo";
import { enmascararDni } from "../../lib/formatos";
import { CargandoVista } from "../../components/ui/Estados";
import { BannerDemo } from "../../components/ui/BannerDemo";

/** Padrón consolidado de integrantes aptos (Plataforma Operativa, DEMO). */
export default function PadronPage() {
  const [padron, setPadron] = useState<IntegrantePadron[] | null>(null);

  useEffect(() => {
    void obtenerPadron().then(setPadron);
  }, []);

  if (!padron) return <CargandoVista />;

  return (
    <div>
      {MODO_DEMO && <BannerDemo />}
      <h1 className="mt-4 text-xl font-semibold text-ink">Padrón de la olla</h1>
      <p className="mt-1 text-muted">Integrantes aptos con sus porciones diarias. DNI enmascarado (Ley N.° 29733).</p>

      <div className="card mt-6 hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Padrón de integrantes aptos</caption>
          <thead className="border-b border-border bg-bg text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">DNI</th>
              <th scope="col" className="px-4 py-3 font-medium">Nombres y apellidos</th>
              <th scope="col" className="px-4 py-3 font-medium">Porciones diarias</th>
            </tr>
          </thead>
          <tbody>
            {padron.map((i) => (
              <tr key={i.dni} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{enmascararDni(i.dni)}</td>
                <td className="px-4 py-3 font-medium text-ink">{i.nombres} {i.apellidos}</td>
                <td className="px-4 py-3 text-ink">{i.porciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 flex flex-col gap-3 md:hidden">
        {padron.map((i) => (
          <li key={i.dni} className="card">
            <p className="font-medium text-ink">{i.nombres} {i.apellidos}</p>
            <p className="text-sm text-muted">DNI {enmascararDni(i.dni)} · {i.porciones} porciones diarias</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
