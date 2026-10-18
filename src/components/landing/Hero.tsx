import { Link } from "react-router-dom";

/** Ilustración SVG inline: una olla comunitaria con personas alrededor (cero peso de imagen). */
function Ilustracion() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="Ilustración de una olla común con familias alrededor" className="mx-auto w-full max-w-md">
      <rect width="400" height="300" rx="28" fill="#EAF2EF" />
      <ellipse cx="200" cy="262" rx="150" ry="14" fill="#1F4D3F" opacity=".12" />
      <g fill="none" stroke="#B5651D" strokeWidth="7" strokeLinecap="round">
        <path d="M170 98c-12-16 12-26 0-42" />
        <path d="M200 98c-12-16 12-26 0-42" />
        <path d="M230 98c-12-16 12-26 0-42" />
      </g>
      <rect x="118" y="116" width="164" height="18" rx="9" fill="#153A2F" />
      <path d="M128 134h144v52a50 50 0 0 1-50 50h-44a50 50 0 0 1-50-50z" fill="#1F4D3F" />
      <rect x="92" y="160" width="34" height="14" rx="7" fill="#153A2F" />
      <rect x="274" y="160" width="34" height="14" rx="7" fill="#153A2F" />
      <g>
        <circle cx="62" cy="206" r="16" fill="#B5651D" /><path d="M34 262c0-18 12-32 28-32s28 14 28 32z" fill="#356480" />
        <circle cx="110" cy="222" r="12" fill="#F7EADC" stroke="#B5651D" strokeWidth="3" /><path d="M90 262c0-14 9-24 20-24s20 10 20 24z" fill="#2F6B4F" />
        <circle cx="290" cy="222" r="12" fill="#F7EADC" stroke="#B5651D" strokeWidth="3" /><path d="M270 262c0-14 9-24 20-24s20 10 20 24z" fill="#B5651D" />
        <circle cx="338" cy="206" r="16" fill="#B5651D" /><path d="M310 262c0-18 12-32 28-32s28 14 28 32z" fill="#A23B2E" />
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-primary-light to-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 text-center sm:px-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:py-20 lg:text-left">
        <div className="flex flex-col items-center gap-5 lg:items-start">
          <h1 className="text-balance text-3xl font-semibold text-primary-dark sm:text-4xl lg:text-5xl">
            Empadrona tu Olla Común
          </h1>
          <p className="max-w-xl text-balance text-lg text-ink">
            Registra tu olla, declara a tus integrantes y sigue tu solicitud paso a paso. Una alimentación segura para
            tu comunidad, con el acompañamiento del Estado.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/?auth=registro" className="btn-primary">Registrar mi olla</Link>
            <a href="#proceso" className="btn-secondary">Ver cómo funciona</a>
          </div>
          <p className="text-sm text-muted">¿Ya tienes cuenta? <Link to="/?auth=login" className="toque inline-flex items-center font-medium text-primary underline">Inicia sesión</Link></p>
        </div>
        <Ilustracion />
      </div>
    </section>
  );
}
