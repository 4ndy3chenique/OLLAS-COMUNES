import { Link } from "react-router-dom";

export function FooterPublico() {
  return (
    <footer className="border-t border-border bg-primary-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7" /> Ollas Comunes
          </p>
          <p className="mt-2 text-sm text-white/80">Plataforma del Solicitante. Registro y seguimiento de ollas comunes.</p>
        </div>
        <nav aria-label="Enlaces del pie">
          <p className="font-medium">Ayuda</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><a className="toque inline-flex items-center underline" href="#faq">Preguntas frecuentes</a></li>
            <li><a className="toque inline-flex items-center underline" href="#transparencia">Privacidad y datos personales (Ley N.° 29733)</a></li>
            <li><Link className="toque inline-flex items-center underline" to="/?auth=login">Iniciar sesión</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-medium">Atención</p>
          <p className="mt-2 text-sm text-white/80">
            Si necesitas apoyo para registrarte, acércate al centro de atención del programa en tu distrito.
          </p>
        </div>
      </div>
      <p className="border-t border-white/20 px-4 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} Programa Ollas Comunes. Proyecto académico (Capstone).
      </p>
    </footer>
  );
}
