/**
 * Gastos e impuestos de la compra de una vivienda.
 *
 *   Vivienda usada: ITP = Precio · tipo de ITP
 *   Vivienda nueva: IVA = Precio · tipo de IVA   y   AJD = Precio · tipo de AJD
 *
 * Los tipos no viven aquí: los pone la interfaz desde `config/fiscal.ts` y la
 * persona puede cambiarlos. Notaría, registro y gestoría entran como importe en euros.
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export type TipoVivienda = 'usada' | 'nueva';

export interface EntradaGastosCompra {
  precio: number;
  vivienda: TipoVivienda;
  /** ITP si es usada; IVA (o impuesto equivalente) si es nueva. Tanto por uno. */
  tipoImpuesto: number;
  /** Actos jurídicos documentados. Solo en vivienda nueva. */
  tipoAjd?: number;
  /** Notaría, registro y gestoría, en euros. */
  gastosFijos: number;
  /** Otros gastos (tasación, etc.), en euros. */
  otros?: number;
  /** Parte del precio que se paga con ahorro, en tanto por uno (0,2 = 20 %). */
  entrada: number;
}

export interface ResultadoGastosCompra {
  impuesto: number;
  ajd: number;
  gastosFijos: number;
  otros: number;
  totalGastos: number;
  /** Gastos sobre el precio (0,1 = 10 %). */
  porcentaje: number;
  entrada: number;
  hipoteca: number;
  /** Entrada más gastos: el ahorro que hace falta. */
  ahorroNecesario: number;
  /** Precio más gastos. */
  costeTotal: number;
}

export function validarGastosCompra(e: EntradaGastosCompra): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'precio', e.precio, { etiqueta: 'El precio de la vivienda', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarOpcion(err, 'vivienda', e.vivienda, ['usada', 'nueva'] as const, 'Tipo de vivienda');
  comprobarNumero(err, 'tipoImpuesto', e.tipoImpuesto, { etiqueta: e.vivienda === 'nueva' ? 'El IVA' : 'El ITP', min: 0, max: 0.25, formato: fmtPorcentaje });
  if (e.vivienda === 'nueva') {
    comprobarNumero(err, 'tipoAjd', e.tipoAjd, { etiqueta: 'El tipo de AJD', min: 0, max: 0.05, formato: fmtPorcentaje });
  }
  comprobarNumero(err, 'gastosFijos', e.gastosFijos, { etiqueta: 'El importe de notaría, registro y gestoría', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'otros', e.otros ?? 0, { etiqueta: 'El importe de otros gastos', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'entrada', e.entrada, { etiqueta: 'La entrada', min: 0, max: 1, formato: fmtPorcentaje });
  return err;
}

export function calcularGastosCompra(e: EntradaGastosCompra): ResultadoGastosCompra {
  lanzarSiHayErrores(validarGastosCompra(e));
  const impuesto = e.precio * e.tipoImpuesto;
  const ajd = e.vivienda === 'nueva' ? e.precio * (e.tipoAjd ?? 0) : 0;
  const otros = e.otros ?? 0;
  const totalGastos = impuesto + ajd + e.gastosFijos + otros;
  const entrada = e.precio * e.entrada;
  return {
    impuesto,
    ajd,
    gastosFijos: e.gastosFijos,
    otros,
    totalGastos,
    porcentaje: totalGastos / e.precio,
    entrada,
    hipoteca: e.precio - entrada,
    ahorroNecesario: entrada + totalGastos,
    costeTotal: e.precio + totalGastos,
  };
}
