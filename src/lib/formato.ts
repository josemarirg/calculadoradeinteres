/** Formato y lectura de números al estilo español. Solo para mostrar: los cálculos no redondean. */

const opciones = (min: number, max: number) =>
  ({ minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: 'always' }) as Intl.NumberFormatOptions;

const fmt2 = new Intl.NumberFormat('es-ES', opciones(2, 2));
const fmt0 = new Intl.NumberFormat('es-ES', opciones(0, 0));
const fmtLibre = new Intl.NumberFormat('es-ES', opciones(0, 6));
const fmtCompacto = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

/** 109333.1366 → «109.333,14 €» */
export const euros = (n: number) => `${fmt2.format(n)} €`;
/** 109333.1366 → «109.333 €» */
export const eurosSinCentimos = (n: number) => `${fmt0.format(n)} €`;
/** 50000 → «50 mil €» (para ejes de gráficas) */
export const eurosCompacto = (n: number) => `${fmtCompacto.format(n)} €`;
/** 0.07229 → «7,23 %» */
export const porcentaje = (n: number, decimales = 2) =>
  `${new Intl.NumberFormat('es-ES', opciones(decimales, decimales)).format(n * 100)} %`;
/** Número sin unidad y sin ceros de relleno: 2.5 → «2,5» */
export const numero = (n: number) => fmtLibre.format(n);

/**
 * Lee lo que escribe una persona: «10.000,50», «10000,5», «10000.5» o «10 000».
 * Devuelve NaN si no es un número.
 */
export function parseNumero(texto: string): number {
  let s = texto.trim().replace(/[\s€%]/g, '');
  if (s === '') return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «2026-11-11» → «11 de noviembre de 2026» */
export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
