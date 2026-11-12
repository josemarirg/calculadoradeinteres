/**
 * Plan de pensiones: capital acumulado, ahorro fiscal de las aportaciones e
 * impuestos del rescate.
 *
 *   Ahorro fiscal de cada año = Aportación · tipo marginal del IRPF
 *   Capital final = A · ((1 + g)^n − 1) / g        g = (1 + rentabilidad)·(1 − comisión) − 1
 *   Impuesto del rescate = Capital final · tipo medio que pagues al rescatar
 *
 * Las aportaciones reducen la base imponible; el rescate tributa entero como
 * rendimiento del trabajo. Se supone una aportación al final de cada año y que
 * el ahorro fiscal no se reinvierte.
 */
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface EntradaPensiones {
  aportacionAnual: number;
  anios: number;
  rentabilidad: number;
  /** Comisiones anuales del plan (gestión y depósito), en tanto por uno. */
  comision: number;
  /** Tipo marginal del IRPF mientras aportas. */
  tipoMarginal: number;
  /** Tipo que esperas pagar por el dinero rescatado. */
  tipoRescate: number;
  /** Aportación máxima anual admitida, desde `config/fiscal.ts`. */
  limiteAportacion: number;
}

export interface FilaPensiones {
  anio: number;
  aportado: number;
  saldo: number;
  ahorroFiscal: number;
}

export interface ResultadoPensiones {
  capitalFinal: number;
  totalAportado: number;
  ganancia: number;
  ahorroFiscalAnual: number;
  ahorroFiscalTotal: number;
  impuestoRescate: number;
  netoRescate: number;
  /** Ahorro fiscal total menos impuesto del rescate. Negativo si el rescate cuesta más de lo ahorrado. */
  saldoFiscal: number;
  /** Tipo de rescate por debajo del cual el saldo fiscal es positivo. */
  tipoRescateEquilibrio: number;
  tabla: FilaPensiones[];
}

export function validarPensiones(e: EntradaPensiones): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'aportacionAnual', e.aportacionAnual, { etiqueta: 'La aportación anual', min: 0, minExcluido: true, max: e.limiteAportacion, formato: fmtEuros });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El número de años', min: 1, max: LIMITES.aniosAhorroMax, entero: true });
  comprobarNumero(err, 'rentabilidad', e.rentabilidad, { etiqueta: 'La rentabilidad', min: -0.2, max: 0.3, formato: fmtPorcentaje });
  comprobarNumero(err, 'comision', e.comision, { etiqueta: 'La comisión', min: 0, max: 0.05, formato: fmtPorcentaje });
  comprobarNumero(err, 'tipoMarginal', e.tipoMarginal, { etiqueta: 'El tipo marginal', min: 0, max: 0.6, formato: fmtPorcentaje });
  comprobarNumero(err, 'tipoRescate', e.tipoRescate, { etiqueta: 'El tipo al rescatar', min: 0, max: 0.6, formato: fmtPorcentaje });
  return err;
}

export function calcularPensiones(e: EntradaPensiones): ResultadoPensiones {
  lanzarSiHayErrores(validarPensiones(e));
  const factor = (1 + e.rentabilidad) * (1 - e.comision);
  const ahorroFiscalAnual = e.aportacionAnual * e.tipoMarginal;
  let saldo = 0;
  const tabla: FilaPensiones[] = [];
  for (let anio = 1; anio <= e.anios; anio++) {
    saldo = saldo * factor + e.aportacionAnual;
    tabla.push({ anio, aportado: e.aportacionAnual * anio, saldo, ahorroFiscal: ahorroFiscalAnual * anio });
  }
  const totalAportado = e.aportacionAnual * e.anios;
  const ahorroFiscalTotal = ahorroFiscalAnual * e.anios;
  const impuestoRescate = saldo * e.tipoRescate;
  return {
    capitalFinal: saldo,
    totalAportado,
    ganancia: saldo - totalAportado,
    ahorroFiscalAnual,
    ahorroFiscalTotal,
    impuestoRescate,
    netoRescate: saldo - impuestoRescate,
    saldoFiscal: ahorroFiscalTotal - impuestoRescate,
    tipoRescateEquilibrio: ahorroFiscalTotal / saldo,
    tabla,
  };
}
