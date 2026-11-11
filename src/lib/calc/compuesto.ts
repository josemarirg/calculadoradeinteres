/**
 * Interés compuesto con aportaciones periódicas, inflación y retención opcionales.
 *
 * Todos los tipos se expresan en tanto por uno (5 % = 0.05).
 * No se redondea nada: el redondeo a céntimos se hace solo al mostrar.
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export const CAPITALIZACIONES = [1, 2, 4, 12, 365] as const;
export type Capitalizacion = (typeof CAPITALIZACIONES)[number];
export type FrecuenciaAportacion = 'mensual' | 'anual';
export type MomentoAportacion = 'inicio' | 'final';
/** 'anual': se retiene cada año sobre los intereses de ese año (cuenta o depósito).
 *  'final': se retiene una sola vez, al final, sobre la ganancia total (fondo). */
export type ModoRetencion = 'anual' | 'final';

export interface EntradaCompuesto {
  capitalInicial: number;
  aportacion: number;
  frecuenciaAportacion: FrecuenciaAportacion;
  momento: MomentoAportacion;
  tipoAnual: number;
  anios: number;
  capitalizacionesPorAnio: Capitalizacion;
  /** Inflación anual, opcional. 0 = no ajustar. */
  inflacion?: number;
  /** Retención sobre intereses, opcional. 0 = sin retención. */
  retencion?: number;
  modoRetencion?: ModoRetencion;
}

export interface FilaCompuesto {
  anio: number;
  /** Capital inicial más aportaciones hasta ese año. */
  aportado: number;
  /** Intereses acumulados, ya descontada la retención practicada hasta ese año. */
  intereses: number;
  /** Retención acumulada. */
  retenido: number;
  saldo: number;
  /** Saldo en euros de hoy (descontada la inflación). Igual a `saldo` si no hay inflación. */
  saldoReal: number;
}

export interface ResultadoCompuesto {
  valorFinal: number;
  totalAportado: number;
  interesesBrutos: number;
  retencionTotal: number;
  interesesNetos: number;
  valorFinalReal: number;
  tabla: FilaCompuesto[];
}

export function validarCompuesto(e: EntradaCompuesto): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'capitalInicial', e.capitalInicial, { etiqueta: 'El capital inicial', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'aportacion', e.aportacion, { etiqueta: 'La aportación', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'tipoAnual', e.tipoAnual, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El número de años', min: 1, max: LIMITES.aniosAhorroMax, entero: true });
  comprobarNumero(err, 'inflacion', e.inflacion ?? 0, { etiqueta: 'La inflación', min: 0, max: 0.3, formato: fmtPorcentaje });
  comprobarNumero(err, 'retencion', e.retencion ?? 0, { etiqueta: 'La retención', min: 0, max: 0.6, formato: fmtPorcentaje });
  comprobarOpcion(err, 'capitalizacionesPorAnio', e.capitalizacionesPorAnio, CAPITALIZACIONES, 'Frecuencia de capitalización');
  comprobarOpcion(err, 'frecuenciaAportacion', e.frecuenciaAportacion, ['mensual', 'anual'] as const, 'Frecuencia de aportación');
  comprobarOpcion(err, 'momento', e.momento, ['inicio', 'final'] as const, 'Momento de la aportación');
  if (!err.capitalInicial && !err.aportacion && e.capitalInicial === 0 && e.aportacion === 0) {
    err.capitalInicial = 'Indica un capital inicial o una aportación periódica mayor que cero.';
  }
  return err;
}

/**
 * Fórmula cerrada del valor futuro. Válida cuando la aportación se hace con la
 * misma frecuencia con la que se capitaliza (n veces al año):
 *
 *   VF = P·(1+r/n)^(n·t) + A·[((1+r/n)^(n·t) − 1)/(r/n)] · (1+r/n si es al inicio)
 */
export function valorFuturo(P: number, A: number, r: number, n: number, t: number, alInicio = false): number {
  const N = n * t;
  if (r === 0) return P + A * N;
  const i = r / n;
  const g = Math.pow(1 + i, N);
  return P * g + A * ((g - 1) / i) * (alInicio ? 1 + i : 1);
}

/**
 * Simulación mes a mes. Cubre todos los casos, incluidos aquellos en los que la
 * frecuencia de aportación no coincide con la de capitalización.
 *
 * Decisión documentada (n.º 1): dentro de cada periodo de capitalización el saldo
 * crece con el tipo mensual equivalente, (1+r/n)^(n/12). Así el tipo efectivo anual
 * es exactamente (1+r/n)^n − 1 y las aportaciones hechas a mitad de periodo generan
 * intereses desde el día en que se ingresan.
 */
export function calcularCompuesto(e: EntradaCompuesto): ResultadoCompuesto {
  lanzarSiHayErrores(validarCompuesto(e));

  const inflacion = e.inflacion ?? 0;
  const retencion = e.retencion ?? 0;
  const modoRetencion = e.modoRetencion ?? 'anual';
  const n = e.capitalizacionesPorAnio;
  const factorMes = Math.pow(1 + e.tipoAnual / n, n / 12);
  const mensual = e.frecuenciaAportacion === 'mensual';

  let saldo = e.capitalInicial;
  let aportado = e.capitalInicial;
  let brutos = 0;
  let retenido = 0;
  const tabla: FilaCompuesto[] = [];

  for (let anio = 1; anio <= e.anios; anio++) {
    let interesAnio = 0;
    for (let mes = 1; mes <= 12; mes++) {
      if (e.momento === 'inicio' && (mensual || mes === 1)) {
        saldo += e.aportacion;
        aportado += e.aportacion;
      }
      const interes = saldo * (factorMes - 1);
      saldo += interes;
      interesAnio += interes;
      if (e.momento === 'final' && (mensual || mes === 12)) {
        saldo += e.aportacion;
        aportado += e.aportacion;
      }
    }
    brutos += interesAnio;
    if (retencion > 0 && modoRetencion === 'anual') {
      const r = interesAnio * retencion;
      saldo -= r;
      retenido += r;
    }
    if (retencion > 0 && modoRetencion === 'final' && anio === e.anios) {
      const r = brutos * retencion;
      saldo -= r;
      retenido += r;
    }
    tabla.push({
      anio,
      aportado,
      intereses: saldo - aportado,
      retenido,
      saldo,
      saldoReal: saldo / Math.pow(1 + inflacion, anio),
    });
  }

  return {
    valorFinal: saldo,
    totalAportado: aportado,
    interesesBrutos: brutos,
    retencionTotal: retenido,
    interesesNetos: brutos - retenido,
    valorFinalReal: saldo / Math.pow(1 + inflacion, e.anios),
    tabla,
  };
}
