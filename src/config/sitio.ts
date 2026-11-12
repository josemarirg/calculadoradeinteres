/** Identidad del sitio, autor, registro de calculadoras y fuentes oficiales. */

export const SITIO = {
  nombre: 'Calculadora de Interés',
  dominio: 'calculadoradeinteres.com',
  url: 'https://calculadoradeinteres.com',
  idioma: 'es-ES',
  descripcion: 'Calculadoras financieras gratuitas para España: interés compuesto, préstamos, hipotecas, depósitos, fondos e impuestos del ahorro. Fórmulas explicadas y resultados comprobables.',
  aviso: 'Resultados orientativos. No constituye asesoramiento financiero.',
} as const;

export const AUTOR = {
  nombre: 'José María Rodríguez Gómez',
  url: '/sobre-el-autor/',
} as const;

export type ClusterId = 'ahorro' | 'deuda' | 'hipoteca' | 'inversion';

export const CLUSTERES: { id: ClusterId; nombre: string; descripcion: string }[] = [
  { id: 'ahorro', nombre: 'Ahorro', descripcion: 'Cuánto crece tu dinero en cuentas, depósitos, Letras del Tesoro y con interés compuesto.' },
  { id: 'deuda', nombre: 'Deuda', descripcion: 'Cuánto pagas de verdad por un préstamo o una tarjeta, y cómo quitarte las deudas antes.' },
  { id: 'hipoteca', nombre: 'Hipoteca', descripcion: 'Cuota mensual, fija o variable, gastos de la compra y qué ganas al amortizar antes.' },
  { id: 'inversion', nombre: 'Inversión', descripcion: 'Fondos indexados, planes de pensiones, independencia financiera e impuestos del ahorro.' },
];

export interface Calculadora {
  slug: string;
  nombre: string;
  corto: string;
  cluster: ClusterId;
  descripcion: string;
  /** false = prevista, todavía sin página. No se enlaza. */
  disponible: boolean;
}

export const CALCULADORAS: Calculadora[] = [
  { slug: 'interes-compuesto', nombre: 'Calculadora de interés compuesto', corto: 'Interés compuesto', cluster: 'ahorro', descripcion: 'Cuánto tendrás con un capital inicial y aportaciones periódicas.', disponible: true },
  { slug: 'interes-simple', nombre: 'Calculadora de interés simple', corto: 'Interés simple', cluster: 'ahorro', descripcion: 'Intereses sin reinversión, comparados con el compuesto.', disponible: true },
  { slug: 'rentabilidad-deposito', nombre: 'Calculadora de rentabilidad de un depósito', corto: 'Depósito a plazo', cluster: 'ahorro', descripcion: 'Intereses brutos, retención y netos de un depósito.', disponible: true },
  { slug: 'cuenta-remunerada', nombre: 'Calculadora de cuenta remunerada', corto: 'Cuenta remunerada', cluster: 'ahorro', descripcion: 'Intereses netos mes a mes de una cuenta que paga por el saldo.', disponible: true },
  { slug: 'letras-del-tesoro', nombre: 'Calculadora de Letras del Tesoro', corto: 'Letras del Tesoro', cluster: 'ahorro', descripcion: 'Precio, rentabilidad y ganancia de una Letra, antes y después de impuestos.', disponible: true },
  { slug: 'prestamo-personal', nombre: 'Calculadora de préstamo personal', corto: 'Préstamo personal', cluster: 'deuda', descripcion: 'Cuota, cuadro de amortización, intereses totales y TAE.', disponible: true },
  { slug: 'tin-tae', nombre: 'Calculadora de TIN y TAE', corto: 'TIN frente a TAE', cluster: 'deuda', descripcion: 'Convierte un TIN en TAE y al revés según los pagos al año.', disponible: true },
  { slug: 'tarjeta-revolving', nombre: 'Calculadora de tarjeta revolving', corto: 'Tarjeta revolving', cluster: 'deuda', descripcion: 'Cuánto tardas en liquidar la tarjeta y cuántos intereses pagas con tu cuota.', disponible: true },
  { slug: 'liquidar-deudas', nombre: 'Calculadora para liquidar deudas', corto: 'Liquidar deudas', cluster: 'deuda', descripcion: 'Plan para quitarte varias deudas: avalancha frente a bola de nieve.', disponible: true },
  { slug: 'cuota-hipoteca', nombre: 'Calculadora de cuota de hipoteca', corto: 'Cuota de hipoteca', cluster: 'hipoteca', descripcion: 'Cuota mensual, intereses totales y amortización anticipada.', disponible: true },
  { slug: 'amortizacion-anticipada', nombre: 'Calculadora de amortización anticipada', corto: 'Amortización anticipada', cluster: 'hipoteca', descripcion: 'Cuánto ahorras al amortizar: reducir cuota o reducir plazo.', disponible: true },
  { slug: 'hipoteca-fija-o-variable', nombre: 'Hipoteca fija o variable', corto: 'Fija o variable', cluster: 'hipoteca', descripcion: 'Compara cuota e intereses y calcula el Euríbor a partir del cual gana la fija.', disponible: true },
  { slug: 'gastos-compra-vivienda', nombre: 'Calculadora de gastos de compra', corto: 'Gastos de compra', cluster: 'hipoteca', descripcion: 'Impuestos, notaría y registro al comprar, y el ahorro que necesitas.', disponible: true },
  { slug: 'fondos-indexados', nombre: 'Calculadora de fondos indexados', corto: 'Fondos indexados', cluster: 'inversion', descripcion: 'Proyección con aportaciones mensuales, comisiones e impuestos al reembolsar.', disponible: true },
  { slug: 'plan-de-pensiones', nombre: 'Calculadora de plan de pensiones', corto: 'Plan de pensiones', cluster: 'inversion', descripcion: 'Capital acumulado, ahorro fiscal de las aportaciones e impuestos del rescate.', disponible: true },
  { slug: 'jubilacion-fire', nombre: 'Calculadora de jubilación y FIRE', corto: 'Jubilación / FIRE', cluster: 'inversion', descripcion: 'Qué patrimonio necesitas para vivir de tus inversiones y cuándo lo alcanzarías.', disponible: true },
  { slug: 'irpf-ahorro', nombre: 'Calculadora del IRPF del ahorro', corto: 'IRPF del ahorro', cluster: 'inversion', descripcion: 'Cuánto pagas por intereses, dividendos y ganancias, tramo a tramo.', disponible: true },
];

export const calculadora = (slug: string) => {
  const c = CALCULADORAS.find((x) => x.slug === slug);
  if (!c) throw new Error(`Calculadora desconocida: ${slug}`);
  return c;
};

/** Páginas del pie. Solo se enlazan las que ya existen (`disponible`). */
export const PAGINAS_PIE: { url: string; nombre: string; disponible: boolean }[] = [
  { url: '/metodologia/', nombre: 'Metodología', disponible: true },
  { url: '/sobre-el-autor/', nombre: 'Sobre el autor', disponible: true },
  { url: '/como-nos-financiamos/', nombre: 'Cómo nos financiamos', disponible: true },
  { url: '/contacto/', nombre: 'Contacto', disponible: true },
  { url: '/aviso-legal/', nombre: 'Aviso legal', disponible: true },
  { url: '/privacidad/', nombre: 'Privacidad', disponible: true },
  { url: '/cookies/', nombre: 'Cookies', disponible: true },
];

/**
 * Fuentes oficiales. La de la AEAT apunta a la página de retenciones; el resto, a la portada del organismo.
 */
export const FUENTES = {
  bde: { nombre: 'Banco de España · Portal del Cliente Bancario', url: 'https://clientebancario.bde.es/' },
  cnmv: { nombre: 'Comisión Nacional del Mercado de Valores (CNMV)', url: 'https://www.cnmv.es/' },
  aeat: { nombre: 'Agencia Tributaria (AEAT) · Retenciones del IRPF', url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/retenciones-ingresos-cuenta-pagos-fraccionados/retenciones-ingresos-cuenta/porcentajes-retencion-aplicables-distintas-rentas.html' },
  ine: { nombre: 'Instituto Nacional de Estadística (INE) · IPC', url: 'https://www.ine.es/' },
  boe: { nombre: 'Boletín Oficial del Estado (BOE)', url: 'https://www.boe.es/' },
  tesoro: { nombre: 'Tesoro Público', url: 'https://www.tesoro.es/' },
  hacienda: { nombre: 'Ministerio de Hacienda', url: 'https://www.hacienda.gob.es/' },
} as const;
