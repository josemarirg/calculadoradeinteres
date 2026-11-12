/**
 * Independencia financiera (FIRE): cuánto patrimonio hace falta para vivir de él
 * y cuánto se tarda en reunirlo.
 *
 *   Objetivo = Gasto anual / tasa de retirada          (con el 4 %, 25 veces el gasto)
 *
 * El plazo se simula mes a mes: el patrimonio crece con la rentabilidad real
 * (descontada la inflación) y se le suma el ahorro mensual. Al trabajar con
 * rentabilidad real, todas las cifras están en euros de hoy.
 *
 * La tasa de retirada es una regla orientativa basada en datos históricos, no una garantía.
 */
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

/** Tope de la simulación: 100 años. */
const MESES_MAX = 1200;

export interface EntradaFire {
  /** Gasto anual que se quiere cubrir, en euros de hoy. */
  gastoAnual: number;
  /** Tasa de retirada anual, en tanto por uno (0,04 = 4 %). */
  tasaRetirada: number;
  patrimonio: number;
  ahorroMensual: number;
  /** Rentabilidad anual esperada por encima de la inflación. */
  rentabilidadReal: number;
}

export interface FilaFire {
  anio: number;
  aportado: number;
  saldo: number;
}

export interface ResultadoFire {
  objetivo: number;
  /** Patrimonio actual sobre el objetivo (1 = alcanzado). */
  progreso: number;
  /** Meses hasta el objetivo. 0 si ya se ha alcanzado; null si no se alcanza en 100 años. */
  meses: number | null;
  /** Lo que falta hoy para el objetivo. */
  falta: number;
  /** Renta mensual que sostendría el patrimonio actual con la tasa indicada. */
  rentaMensualActual: number;
  /** Patrimonio al final de cada año hasta alcanzar el objetivo (60 años como máximo). */
  tabla: FilaFire[];
}

export function validarFire(e: EntradaFire): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'gastoAnual', e.gastoAnual, { etiqueta: 'El gasto anual', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tasaRetirada', e.tasaRetirada, { etiqueta: 'La tasa de retirada', min: 0.01, max: 0.1, formato: fmtPorcentaje });
  comprobarNumero(err, 'patrimonio', e.patrimonio, { etiqueta: 'El patrimonio actual', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'ahorroMensual', e.ahorroMensual, { etiqueta: 'El ahorro mensual', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'rentabilidadReal', e.rentabilidadReal, { etiqueta: 'La rentabilidad real', min: 0, max: 0.2, formato: fmtPorcentaje });
  return err;
}

export function calcularFire(e: EntradaFire): ResultadoFire {
  lanzarSiHayErrores(validarFire(e));
  const objetivo = e.gastoAnual / e.tasaRetirada;
  const factor = Math.pow(1 + e.rentabilidadReal, 1 / 12);
  let saldo = e.patrimonio;
  let aportado = e.patrimonio;
  let meses: number | null = saldo >= objetivo ? 0 : null;
  const tabla: FilaFire[] = [];
  for (let mes = 1; mes <= MESES_MAX && meses === null; mes++) {
    saldo = saldo * factor + e.ahorroMensual;
    aportado += e.ahorroMensual;
    if (saldo >= objetivo) meses = mes;
    if ((mes % 12 === 0 || meses !== null) && tabla.length < 60) tabla.push({ anio: Math.ceil(mes / 12), aportado, saldo });
  }
  return {
    objetivo,
    progreso: e.patrimonio / objetivo,
    meses,
    falta: Math.max(0, objetivo - e.patrimonio),
    rentaMensualActual: (e.patrimonio * e.tasaRetirada) / 12,
    tabla: meses === null ? [] : tabla,
  };
}
