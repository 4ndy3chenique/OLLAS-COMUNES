// Matchers de jest-dom (p. ej. toBeInTheDocument) para las pruebas con React Testing Library.
// Nota: se importa el subpath "/vitest" (no el import plano) porque es el que registra los
// matchers en el `expect` de Vitest y añade sus tipos; el import plano solo trae los de Jest.
import '@testing-library/jest-dom/vitest';

// jsdom no implementa scrollIntoView, que usa el Stepper del wizard de la olla: se anula en pruebas.
window.HTMLElement.prototype.scrollIntoView = () => {};
