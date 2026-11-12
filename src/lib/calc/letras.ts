/**
 * Letras del Tesoro: valores emitidos al descuento. Se pagan por debajo del nominal
 * y a vencimiento se cobra el nominal (1.000 € por Letra).
 *
 * Para plazos de hasta 376 días el Tesoro usa interés simple con año de 360 días:
 *
 *   Precio = 100 / (1 + i · d/360)        i = (100/Precio − 1) · 360/d
 *
 * Comprobado contra los resultados de subasta publicados en el BOE (BOE-A-2025-5905):
 * a 266 días, un precio de 98,343 corresponde a un tipo del 2,281 %.
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

/** Plazo máximo al que se aplica la fórmula de interés simple. */
export const DIAS_MAX_LETRA = 376;
export const NOMINAL_LETRA = 1_000;

export type ModoLetras = 'precio' | 'tipo';

export interface EntradaLetras {
  /** Importe nominal: lo que se cobra al vencimiento. Múltiplo de 1.000 €. */
  nominal: number;
  /** Días naturales hasta el vencimiento. */
  dias: number;
  /** 'precio': se conoce el precio y se calcula el tipo. 'tipo': al revés. */
  modo: ModoLetras;
  /** Precio en porcentaje del nominal (98,352 = 983,52 € por Letra). */
  precio?: number;
  /** Tipo de interés anual, en tanto por uno. */
  tipo?: number;
  /** Comisiones totales de la operación, en euros. */
  comisiones?: number;
  /** Tipo del IRPF para la estimación del impuesto, en tanto por uno. */
  tipoIrpf?: number;
}

export interface ResultadoLetras {
  precio: number;
  tipo: number;
  importeInvertido: number;
  rendimientoBruto: number;
  comisiones: number;
  /** Rendimiento después de comisiones y antes de impuestos. */
  rendimientoNeto: number;
  /** Tipo anual (simple, base 360) una vez restadas las comisiones. */
  tipoTrasComisiones: number;
  /** Rentabilidad anual compuesta con año de 365 días, comparable con la TAE de un depósito. */
  taeEquivalente: number;
  /** Estimación del IRPF: rendimiento bruto por el tipo indicado. */
  irpf: number;
  rendimientoTrasImpuestos: number;
}

export const precioDesdeTipo = (tipo: number, dias: number) => 100 / (1 + (tipo * dias) / 360);
export const tipoDesdePrecio = (precio: number, dias: number) => ((100 / precio - 1) * 360) / dias;

export function validarLetras(e: EntradaLetras): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'nominal', e.nominal, { etiqueta: 'El importe nominal', min: NOMINAL_LETRA, max: LIMITES.importeMax, formato: fmtEuros });
  if (!err.nominal && e.nominal % NOMINAL_LETRA !== 0) err.nominal = 'El importe nominal debe ser múltiplo de 1.000 €: cada Letra vale 1.000 €.';
  comprobarNumero(err, 'dias', e.dias, { etiqueta: 'El plazo en días', min: 1, max: DIAS_MAX_LETRA, entero: true });
  comprobarOpcion(err, 'modo', e.modo, ['precio', 'tipo'] as const, 'Dato conocido');
  if (e.modo === 'tipo') {
    comprobarNumero(err, 'tipo', e.tipo, { etiqueta: 'El tipo de interés', min: -0.02, max: 0.25, formato: fmtPorcentaje });
  } else {
    comprobarNumero(err, 'precio', e.precio, { etiqueta: 'El precio', min: 80, max: 102 });
  }
  comprobarNumero(err, 'comisiones', e.comisiones ?? 0, { etiqueta: 'El importe de las comisiones', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'tipoIrpf', e.tipoIrpf ?? 0, { etiqueta: 'El tipo del IRPF', min: 0, max: 0.6, formato: fmtPorcentaje });
  return err;
}

export function calcularLetras(e: EntradaLetras): ResultadoLetras {
  lanzarSiHayErrores(validarLetras(e));
  const precio = e.modo === 'tipo' ? precioDesdeTipo(e.tipo!, e.dias) : e.precio!;
  const tipo = e.modo === 'tipo' ? e.tipo! : tipoDesdePrecio(precio, e.dias);
  const importeInvertido = (e.nominal * precio) / 100;
  const rendimientoBruto = e.nominal - importeInvertido;
  const comisiones = e.comisiones ?? 0;
  const rendimientoNeto = rendimientoBruto - comisiones;
  const irpf = Math.max(0, rendimientoBruto) * (e.tipoIrpf ?? 0);
  return {
    precio,
    tipo,
    importeInvertido,
    rendimientoBruto,
    comisiones,
    rendimientoNeto,
    tipoTrasComisiones: ((rendimientoNeto / importeInvertido) * 360) / e.dias,
    taeEquivalente: Math.pow(100 / precio, 365 / e.dias) - 1,
    irpf,
    rendimientoTrasImpuestos: rendimientoNeto - irpf,
  };
}
