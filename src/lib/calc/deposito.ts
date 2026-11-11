/**
 * Rentabilidad de un depósito a plazo con pago de intereses al vencimiento.
 *
 *   Con TAE: intereses = C·((1 + TAE)^t − 1)      t en años (meses/12 o días/365)
 *   Con TIN: intereses = C·TIN·t                  interés simple, base 365 días
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export type ClaseTipo = 'TAE' | 'TIN';
export type UnidadPlazo = 'meses' | 'dias';

export interface EntradaDeposito {
  importe: number;
  tipo: number;
  claseTipo: ClaseTipo;
  plazo: number;
  unidad: UnidadPlazo;
  /** Retención a cuenta del IRPF en tanto por uno. Viene de la configuración fiscal. */
  retencion: number;
}

export interface ResultadoDeposito {
  /** Plazo en años. */
  anios: number;
  interesesBrutos: number;
  retencion: number;
  interesesNetos: number;
  /** Importe más intereses netos. */
  totalAlVencimiento: number;
  /** TAE equivalente de la operación (igual al tipo introducido si ya era TAE). */
  taeEquivalente: number;
}

export function validarDeposito(e: EntradaDeposito): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'importe', e.importe, { etiqueta: 'El importe', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tipo', e.tipo, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarOpcion(err, 'claseTipo', e.claseTipo, ['TAE', 'TIN'] as const, 'Clase de tipo');
  comprobarOpcion(err, 'unidad', e.unidad, ['meses', 'dias'] as const, 'Unidad del plazo');
  comprobarNumero(err, 'plazo', e.plazo, {
    etiqueta: e.unidad === 'dias' ? 'El plazo en días' : 'El plazo en meses',
    min: 1,
    max: e.unidad === 'dias' ? LIMITES.diasDepositoMax : LIMITES.mesesDepositoMax,
    entero: true,
  });
  comprobarNumero(err, 'retencion', e.retencion, { etiqueta: 'La retención', min: 0, max: 0.6, formato: fmtPorcentaje });
  return err;
}

export function calcularDeposito(e: EntradaDeposito): ResultadoDeposito {
  lanzarSiHayErrores(validarDeposito(e));
  const anios = e.unidad === 'dias' ? e.plazo / 365 : e.plazo / 12;
  const rendimiento = e.claseTipo === 'TAE' ? Math.pow(1 + e.tipo, anios) - 1 : e.tipo * anios;
  const interesesBrutos = e.importe * rendimiento;
  const retencion = interesesBrutos * e.retencion;
  const interesesNetos = interesesBrutos - retencion;
  return {
    anios,
    interesesBrutos,
    retencion,
    interesesNetos,
    totalAlVencimiento: e.importe + interesesNetos,
    taeEquivalente: Math.pow(1 + rendimiento, 1 / anios) - 1,
  };
}
