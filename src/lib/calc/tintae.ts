/**
 * Conversión entre TIN y TAE cuando no hay comisiones ni gastos.
 *
 *   TAE = (1 + TIN/n)^n − 1        TIN = n · ((1 + TAE)^(1/n) − 1)
 *
 * n es el número de liquidaciones o pagos al año. Con comisiones, la TAE se
 * calcula con los flujos reales (véase tae.ts y la calculadora de préstamos).
 */
import { comprobarNumero, comprobarOpcion, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export const FRECUENCIAS = [1, 2, 4, 12] as const;
export type Frecuencia = (typeof FRECUENCIAS)[number];
export type Sentido = 'tin-a-tae' | 'tae-a-tin';

export interface EntradaConversion {
  tipo: number;
  sentido: Sentido;
  pagosPorAnio: Frecuencia;
}

export interface ResultadoConversion {
  tin: number;
  tae: number;
  /** Tipo que se aplica en cada periodo: TIN / n. */
  tipoPorPeriodo: number;
}

export function validarConversion(e: EntradaConversion): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'tipo', e.tipo, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarOpcion(err, 'sentido', e.sentido, ['tin-a-tae', 'tae-a-tin'] as const, 'Conversión');
  comprobarOpcion(err, 'pagosPorAnio', e.pagosPorAnio, FRECUENCIAS, 'Frecuencia');
  return err;
}

export function convertirTipo(e: EntradaConversion): ResultadoConversion {
  lanzarSiHayErrores(validarConversion(e));
  const n = e.pagosPorAnio;
  const tin = e.sentido === 'tin-a-tae' ? e.tipo : n * (Math.pow(1 + e.tipo, 1 / n) - 1);
  const tae = e.sentido === 'tin-a-tae' ? Math.pow(1 + e.tipo / n, n) - 1 : e.tipo;
  return { tin, tae, tipoPorPeriodo: tin / n };
}
