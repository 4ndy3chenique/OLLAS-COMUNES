import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "../ui/Icono";

function Seccion({ id, titulo, intro, children, fondo }: { id: string; titulo: string; intro?: string; children: ReactNode; fondo?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`scroll-mt-24 py-12 lg:py-16 ${fondo ? "bg-surface" : ""}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id={`${id}-titulo`} className="text-2xl font-semibold text-primary-dark sm:text-3xl">{titulo}</h2>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function SeccionQueEs() {
  const tarjetas: { icono: NombreIcono; titulo: string; texto: string }[] = [
    { icono: "olla", titulo: "¿Qué es una olla común?", texto: "Una organización vecinal que prepara alimentos para varias familias a la vez. Está a cargo de una dirigenta o dirigente." },
    { icono: "nutricion", titulo: "¿Qué entrega el programa?", texto: "Si tu olla es declarada apta, el programa le asigna insumos y porciones diarias calculados según el número de integrantes aprobados." },
    { icono: "familia", titulo: "¿Quién puede participar?", texto: "Ollas comunes cuya dirigenta o dirigente tenga DNI vigente y pueda registrar a las personas que se alimentan en ella." },
  ];
  return (
    <Seccion id="que-es" titulo="¿Qué es el Programa?" intro="Una plataforma para que tu olla común se registre y reciba apoyo alimentario de forma ordenada y transparente.">
      <ul className="grid gap-4 md:grid-cols-3">
        {tarjetas.map((t) => (
          <li key={t.titulo} className="card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-dark"><Icono nombre={t.icono} className="h-6 w-6" /></span>
            <h3 className="mt-4 text-lg font-medium text-ink">{t.titulo}</h3>
            <p className="mt-1 text-muted">{t.texto}</p>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

export function SeccionProceso() {
  const pasos = [
    ["Registra tu cuenta", "Con tu DNI vigente y tu correo. Tus nombres se validan con RENIEC."],
    ["Completa la ficha de tu olla", "Nombre, fecha de creación, dirección, distrito y cantidad de personas."],
    ["Registra a tus integrantes", "Agrega el DNI de cada persona; verificamos su identidad y su registro en SISFOH."],
    ["Envía tu solicitud", "Revisa el resumen y envíala. El Estado la evalúa y te avisa por Notificaciones."],
    ["Recibe tu asignación", "Si tu olla es apta, verás los insumos y porciones asignados para tu comunidad."],
  ];
  return (
    <Seccion id="proceso" titulo="Proceso de empadronamiento" intro="Cinco pasos, desde tu celular." fondo>
      <ol className="grid gap-4 md:grid-cols-5">
        {pasos.map(([titulo, texto], i) => (
          <li key={titulo} className="rounded-lg border border-border bg-bg p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white" aria-hidden>{i + 1}</span>
            <h3 className="mt-3 font-medium text-ink"><span className="sr-only">Paso {i + 1}: </span>{titulo}</h3>
            <p className="mt-1 text-sm text-muted">{texto}</p>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}

export function SeccionRequisitos() {
  const items = [
    "Ser dirigenta o dirigente de una olla común (o su representante).",
    "Contar con un local o punto donde funciona la olla.",
    "Que tú y tus integrantes tengan DNI vigente (no vencido ni anulado).",
    "Indicar la dirección y el distrito donde opera la olla.",
    "Tener un correo electrónico para tu cuenta.",
  ];
  return (
    <Seccion id="requisitos" titulo="Requisitos de la olla" intro="Ten estos datos a la mano antes de empezar.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t} className="card flex items-start gap-3 p-4">
            <span className="mt-0.5 text-success"><Icono nombre="check" /></span>
            <span className="text-ink">{t}</span>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

export function SeccionTransparencia() {
  return (
    <Seccion id="transparencia" titulo="Transparencia y nutrición" fondo>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="flex items-center gap-2 text-lg font-medium text-ink"><Icono nombre="escudo" /> Tus datos, protegidos</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Pedimos tu DNI y el de tus integrantes solo para verificar su identidad y evaluar la solicitud.</li>
            <li>Tus nombres vienen de RENIEC; no puedes (ni necesitas) escribirlos a mano.</li>
            <li>De SISFOH solo te mostramos si una persona está registrada o no. La clasificación socioeconómica no se muestra.</li>
            <li>Al registrarte aceptas expresamente el tratamiento de tus datos conforme a la Ley N.° 29733, exclusivamente para este programa.</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="flex items-center gap-2 text-lg font-medium text-ink"><Icono nombre="nutricion" /> ¿Cómo se calcula la asignación?</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Se parte del número de integrantes aprobados en la evaluación.</li>
            <li>Cada integrante cuenta con 2 100 kcal por día, según las tablas del MIDIS.</li>
            <li>Se asignan 3 porciones diarias por integrante.</li>
            <li>Los kilos de insumos se calculan a partir de esas calorías.</li>
          </ul>
        </div>
      </div>
    </Seccion>
  );
}

export function SeccionFAQ() {
  const preguntas = [
    ["¿Tiene costo registrarse?", "No. El registro y el seguimiento de tu solicitud son gratuitos."],
    ["¿Qué pasa si un DNI está vencido o anulado?", "No se puede agregar a la lista de integrantes. Esa persona debe regularizar su documento en RENIEC."],
    ["¿Qué pasa si una persona no aparece en SISFOH?", "Puedes agregarla igual. Se te avisa que no está registrada y el evaluador lo tendrá en cuenta."],
    ["¿Puedo editar mi solicitud después de enviarla?", "No, salvo que el programa la devuelva como observada. Entonces podrás corregir la lista y volver a enviarla."],
    ["¿Qué hago si declaré más (o menos) personas que las registradas?", "Puedes enviar igual. Te mostramos una advertencia porque el evaluador podría observar la diferencia."],
    ["¿Cómo sé el resultado de mi solicitud?", "En la sección Mi solicitud y en Notificaciones. Si es apta, verás tu asignación."],
    ["¿Puedo volver a postular?", "Sí. Cuando tu solicitud tenga resultado final, puedes iniciar una renovación desde el Historial."],
  ];
  return (
    <Seccion id="faq" titulo="Preguntas frecuentes">
      <div className="mx-auto max-w-3xl divide-y divide-border rounded-lg border border-border bg-surface">
        {preguntas.map(([p, r]) => (
          <details key={p} className="group p-4">
            <summary className="toque flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-ink">
              {p}
              <Icono nombre="abajo" className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-muted">{r}</p>
          </details>
        ))}
      </div>
    </Seccion>
  );
}
