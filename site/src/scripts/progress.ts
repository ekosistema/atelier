// Progreso de lectura del usuario: se guarda solo en su navegador (localStorage) y se comparte
// entre rutas y páginas de manual. Nunca sale del dispositivo.

const KEY = 'manuales:progress:v1';
const ROUTE_KEY = 'manuales:route';

export function readDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function writeDone(done: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    /* modo privado o almacenamiento bloqueado: la página sigue funcionando sin guardar */
  }
}

export function setDone(slug: string, value: boolean): void {
  const done = readDone();
  value ? done.add(slug) : done.delete(slug);
  writeDone(done);
}

/** Ruta "activa": la que el usuario eligió al llegar a un manual (parámetro ?ruta= o última visitada). */
export function rememberRoute(id: string): void {
  try {
    sessionStorage.setItem(ROUTE_KEY, id);
  } catch {
    /* ignorar */
  }
}

export function recallRoute(): string | null {
  try {
    return sessionStorage.getItem(ROUTE_KEY);
  } catch {
    return null;
  }
}
