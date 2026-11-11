/**
 * Préstamo con sistema de amortización francés (cuota constante).
 *
 *   Cuota = C·i / (1 − (1+i)^(−N)),  con i = TIN/12 y N = número de cuotas.
 *   Con TIN = 0 la cuota es C/N.
 */
import { calcularTAE } from './tae';
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface FilaAmortizacion {
  /** Número de cuota (1 = primera). */
  n: number;
  cuota: number;
  intereses: number;
  amortizacion: number;
  /** Capital pendiente después de pagar la cuota. */
  saldo: number;
}

export function cuotaFrancesa(capital: number, tin: number, meses: number): number {
  if (tin === 0) return capital / meses;
  const i = tin / 12;
  return (capital * i) / (1 - Math.pow(1 + i, -meses));
}

/**
 * Cuadro de amortización. No se redondea: la última cuota liquida exactamente el
 * capital pendiente más sus intereses, de modo que el saldo final es 0 y no queda
 * residuo acumulado.
 */
export function cuadroAmortizacion(capital: number, tin: number, meses: number, cuota = cuotaFrancesa(capital, tin, meses)): FilaAmortizacion[] {
  const i = tin / 12;
  const filas: FilaAmortizacion[] = [];
  let saldo = capital;
  for (let n = 1; n <= meses; n++) {
    const intereses = saldo * i;
    const ultima = n === meses;
    const amortizacion = ultima ? saldo : cuota - intereses;
    saldo = ultima ? 0 : saldo - amortizacion;
    filas.push({ n, cuota: amortizacion + intereses, intereses, amortizacion, saldo });
  }
  return filas;
}

export interface EntradaPrestamo {
  importe: number;
  tin: number;
  meses: number;
  /** Comisión de apertura en tanto por uno del importe (1 % = 0.01). */
  comisionApertura?: number;
}

export interface ResultadoPrestamo {
  cuota: number;
  totalIntereses: number;
  comision: number;
  /** Lo que se recibe realmente: importe menos comisión de apertura (decisión n.º 3). */
  importeNeto: number;
  /** Suma de todas las cuotas. */
  totalPagado: number;
  /** Intereses más comisión. */
  costeTotal: number;
  tae: number;
  cuadro: FilaAmortizacion[];
}

export function validarPrestamo(e: EntradaPrestamo): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'importe', e.importe, { etiqueta: 'El importe', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tin', e.tin, { etiqueta: 'El TIN', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarNumero(err, 'meses', e.meses, { etiqueta: 'El plazo en meses', min: 1, max: LIMITES.mesesPrestamoMax, entero: true });
  comprobarNumero(err, 'comisionApertura', e.comisionApertura ?? 0, { etiqueta: 'La comisión de apertura', min: 0, max: 0.1, formato: fmtPorcentaje });
  return err;
}

export function calcularPrestamo(e: EntradaPrestamo): ResultadoPrestamo {
  lanzarSiHayErrores(validarPrestamo(e));
  const cuota = cuotaFrancesa(e.importe, e.tin, e.meses);
  const cuadro = cuadroAmortizacion(e.importe, e.tin, e.meses, cuota);
  const totalIntereses = cuadro.reduce((s, f) => s + f.intereses, 0);
  const comision = e.importe * (e.comisionApertura ?? 0);
  const importeNeto = e.importe - comision;
  return {
    cuota,
    totalIntereses,
    comision,
    importeNeto,
    totalPagado: e.importe + totalIntereses,
    costeTotal: totalIntereses + comision,
    tae: calcularTAE(importeNeto, cuadro.map((f) => f.cuota)),
    cuadro,
  };
}
