/**
 * Cookies y scripts de terceros que necesitan consentimiento (guía de cookies de la AEPD).
 *
 * Mientras `TERCEROS` esté vacío, el sitio no usa ninguna cookie no necesaria y por eso
 * NO muestra banner: no hay nada que consentir. En cuanto añadas una entrada (analítica,
 * publicidad display…), el banner aparece solo y el script no se carga hasta que la
 * persona acepta su categoría. Nunca cargues scripts de terceros por otra vía.
 *
 * ⚠️ Google AdSense: para servir anuncios personalizados en el EEE, Google exige una
 * plataforma de consentimiento (CMP) certificada por Google e integrada con el TCF de IAB.
 * Este banner propio NO lo es. Si activas AdSense, usa la CMP de Google (AdSense →
 * «Privacidad y mensajes») u otra certificada EN LUGAR de este banner, no las dos a la vez,
 * y lista aquí los proveedores solo a efectos informativos para la página /cookies/.
 */
export type Categoria = 'analitica' | 'publicidad';

export interface Tercero {
  id: string;
  /** Nombre visible en la página de cookies. */
  nombre: string;
  proveedor: string;
  categoria: Categoria;
  finalidad: string;
  /** Duración máxima de sus cookies, tal como la declara el proveedor. */
  duracion: string;
  /** URL del script que se cargará solo tras el consentimiento. */
  src: string;
}

export const TERCEROS: Tercero[] = [
  // TODO(titular): añadir aquí la analítica o la publicidad cuando las contrates. Ejemplo:
  // { id: 'analitica', nombre: '[HERRAMIENTA]', proveedor: '[EMPRESA]', categoria: 'analitica',
  //   finalidad: 'Medir visitas de forma agregada', duracion: '[SEGÚN PROVEEDOR]', src: 'https://…' },
];

export const CATEGORIAS: Record<Categoria, { nombre: string; descripcion: string }> = {
  analitica: { nombre: 'Analítica', descripcion: 'Nos permite saber cuántas personas usan cada calculadora para mejorarlas.' },
  publicidad: { nombre: 'Publicidad', descripcion: 'Permite mostrar anuncios y medir su rendimiento.' },
};

/** Sube este número si cambian las finalidades o los terceros: se volverá a pedir el consentimiento. */
export const VERSION_CONSENTIMIENTO = 1;
/** Meses tras los que se vuelve a preguntar. La guía de la AEPD considera buena práctica renovar cada 24 meses. */
export const MESES_VALIDEZ = 24;
