/**
 * TAE como TIR de los flujos reales, anualizada: TAE = (1 + i)^12 − 1,
 * donde i es el tipo mensual que iguala el importe neto recibido con el valor
 * actual de todos los pagos. Es el criterio de la Circular 5/2012 del Banco de
 * España: su norma decimotercera define la TAE como la tasa que iguala el valor
 * actual de lo entregado y lo recibido, y su anejo 7 («Cálculo de la Tasa Anual
 * Equivalente») fija el año de 365 días y el mes normalizado de 365/12 días.
 * https://www.boe.es/eli/es/cir/2012/06/27/5/con
 */

/** Valor actual de `pagos` (uno por mes, el primero al cabo de un mes) al tipo mensual i. */
function valorActual(pagos: readonly number[], i: number): number {
  let va = 0;
  let descuento = 1;
  for (const pago of pagos) {
    descuento /= 1 + i;
    va += pago * descuento;
  }
  return va;
}

/**
 * Tipo mensual i tal que importeNeto = Σ pago_k / (1+i)^k.
 * Se resuelve por bisección: es monótona en i y no depende de una semilla.
 */
export function tirMensual(importeNeto: number, pagos: readonly number[]): number {
  if (!(importeNeto > 0) || pagos.length === 0) {
    throw new RangeError('Para calcular la TAE hacen falta un importe neto positivo y al menos un pago.');
  }
  const total = pagos.reduce((a, b) => a + b, 0);
  if (total <= importeNeto) return 0; // sin coste: no se devuelve más de lo recibido

  let lo = 0;
  let hi = 1;
  while (valorActual(pagos, hi) > importeNeto) {
    hi *= 2;
    if (hi > 1e6) throw new RangeError('No se ha podido calcular la TAE con estos datos.');
  }
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (valorActual(pagos, mid) > importeNeto) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const anualizar = (tipoMensual: number) => Math.pow(1 + tipoMensual, 12) - 1;

/** TAE de una operación con pagos mensuales. */
export function calcularTAE(importeNeto: number, pagos: readonly number[]): number {
  return anualizar(tirMensual(importeNeto, pagos));
}
