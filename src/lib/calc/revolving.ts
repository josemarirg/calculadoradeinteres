/**
 * Tarjeta revolving: deuda que se devuelve con una cuota fija mensual.
 * Cada mes se pagan primero los intereses del saldo y el resto de la cuota reduce la deuda.
 *
 *   Intereses del mes = Saldo · i          i = TIN/12, o (1 + TAE)^(1/12) − 1
 *   Meses = −ln(1 − Saldo·i/Cuota) / ln(1 + i)
 *
 * Supuestos: tipo constante, sin compras nuevas, sin comisiones ni seguros.
 */
import { cuotaFrancesa, type FilaAmortizacion } from './prestamo';
import { anualizar } from './tae';
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

/** Por encima de este plazo se considera que la cuota no liquida la deuda en la práctica. */
export const MESES_MAX_REVOLVING = 600;
const SALDO_CERO = 1e-6;

export interface EntradaRevolving {
  saldo: number;
  tipo: number;
  claseTipo: 'TIN' | 'TAE';
  /** Cuota fija mensual, en euros. */
  cuota: number;
}

export interface AlternativaRevolving {
  meses: number;
  cuota: number;
  intereses: number;
}

export interface ResultadoRevolving {
  tin: number;
  tae: number;
  meses: number;
  totalIntereses: number;
  totalPagado: number;
  interesPrimerMes: number;
  /** Parte de la primera cuota que reduce deuda. */
  amortizacionPrimerMes: number;
  /** Cuota necesaria para liquidar la deuda en 12, 24, 36 y 60 meses. */
  alternativas: AlternativaRevolving[];
  cuadro: FilaAmortizacion[];
}

const tipoMensual = (e: Pick<EntradaRevolving, 'tipo' | 'claseTipo'>) =>
  e.claseTipo === 'TAE' ? Math.pow(1 + e.tipo, 1 / 12) - 1 : e.tipo / 12;

export function validarRevolving(e: EntradaRevolving): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'saldo', e.saldo, { etiqueta: 'La deuda', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tipo', e.tipo, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarOpcion(err, 'claseTipo', e.claseTipo, ['TIN', 'TAE'] as const, 'Clase de tipo');
  comprobarNumero(err, 'cuota', e.cuota, { etiqueta: 'La cuota mensual', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  if (Object.keys(err).length === 0) {
    const i = tipoMensual(e);
    const interes = e.saldo * i;
    if (e.cuota <= interes) {
      err.cuota = `Con esa cuota la deuda no baja: solo los intereses del primer mes son ${fmtEuros(Math.round(interes * 100) / 100)}.`;
    } else {
      const meses = i === 0 ? e.saldo / e.cuota : -Math.log(1 - interes / e.cuota) / Math.log(1 + i);
      if (meses > MESES_MAX_REVOLVING) err.cuota = 'Con esa cuota tardarías más de 50 años en liquidar la deuda. Prueba con una cuota mayor.';
    }
  }
  return err;
}

export function calcularRevolving(e: EntradaRevolving): ResultadoRevolving {
  lanzarSiHayErrores(validarRevolving(e));
  const i = tipoMensual(e);
  const cuadro: FilaAmortizacion[] = [];
  let saldo = e.saldo;
  let totalIntereses = 0;
  while (saldo > SALDO_CERO) {
    const intereses = saldo * i;
    const ultima = saldo + intereses <= e.cuota + SALDO_CERO;
    const amortizacion = ultima ? saldo : e.cuota - intereses;
    saldo = ultima ? 0 : saldo - amortizacion;
    totalIntereses += intereses;
    cuadro.push({ n: cuadro.length + 1, cuota: amortizacion + intereses, intereses, amortizacion, saldo });
  }
  const tin = i * 12;
  return {
    tin,
    tae: anualizar(i),
    meses: cuadro.length,
    totalIntereses,
    totalPagado: e.saldo + totalIntereses,
    interesPrimerMes: cuadro[0].intereses,
    amortizacionPrimerMes: cuadro[0].amortizacion,
    alternativas: [12, 24, 36, 60].map((meses) => {
      const cuota = cuotaFrancesa(e.saldo, tin, meses);
      return { meses, cuota, intereses: cuota * meses - e.saldo };
    }),
    cuadro,
  };
}
