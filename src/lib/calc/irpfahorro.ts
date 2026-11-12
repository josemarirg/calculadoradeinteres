/**
 * IRPF de la base del ahorro: escala progresiva por tramos.
 * Cada tipo se aplica solo a la parte de la base que cae en su tramo.
 *
 * La escala no vive aquí: se recibe como parámetro desde `config/fiscal.ts`.
 *
 * Simplificaciones: no compensa pérdidas ni aplica la parte del mínimo personal y
 * familiar que pueda quedar sin usar en la base general.
 */
import { comprobarNumero, fmtEuros, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface TramoAhorro {
  /** Límite superior del tramo en euros; null = sin límite. */
  hasta: number | null;
  tipo: number;
}

export interface FilaTramo {
  desde: number;
  hasta: number | null;
  tipo: number;
  /** Parte de la base que tributa en este tramo. */
  base: number;
  cuota: number;
}

export interface CuotaAhorro {
  cuota: number;
  /** Tipo del último tramo alcanzado. */
  marginal: number;
  desglose: FilaTramo[];
}

/** Cuota de la escala del ahorro para una base dada. */
export function cuotaAhorro(base: number, tramos: readonly TramoAhorro[]): CuotaAhorro {
  let desde = 0;
  let cuota = 0;
  let marginal = tramos[0]?.tipo ?? 0;
  const desglose: FilaTramo[] = [];
  for (const t of tramos) {
    const techo = t.hasta ?? Infinity;
    const parte = Math.max(0, Math.min(base, techo) - desde);
    if (parte > 0) marginal = t.tipo;
    cuota += parte * t.tipo;
    desglose.push({ desde, hasta: t.hasta, tipo: t.tipo, base: parte, cuota: parte * t.tipo });
    desde = techo;
  }
  return { cuota, marginal, desglose };
}

export interface EntradaIrpfAhorro {
  /** Intereses, dividendos y otros rendimientos del capital mobiliario. */
  rendimientos: number;
  /** Ganancias patrimoniales netas (ventas de fondos, acciones…). */
  ganancias: number;
  /** Retenciones ya practicadas, en euros. */
  retenciones: number;
  tramos: readonly TramoAhorro[];
}

export interface ResultadoIrpfAhorro extends CuotaAhorro {
  base: number;
  /** Cuota entre base. */
  tipoMedio: number;
  retenciones: number;
  /** Cuota menos retenciones: positivo, a pagar en la declaración; negativo, a devolver. */
  diferencia: number;
  /** Lo que queda después del impuesto. */
  neto: number;
}

export function validarIrpfAhorro(e: EntradaIrpfAhorro): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'rendimientos', e.rendimientos, { etiqueta: 'El importe de intereses y dividendos', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'ganancias', e.ganancias, { etiqueta: 'El importe de las ganancias', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'retenciones', e.retenciones, { etiqueta: 'El importe de las retenciones', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  if (!err.rendimientos && !err.ganancias && e.rendimientos === 0 && e.ganancias === 0) {
    err.rendimientos = 'Indica un importe mayor que cero en intereses y dividendos o en ganancias.';
  }
  return err;
}

export function calcularIrpfAhorro(e: EntradaIrpfAhorro): ResultadoIrpfAhorro {
  lanzarSiHayErrores(validarIrpfAhorro(e));
  const base = e.rendimientos + e.ganancias;
  const c = cuotaAhorro(base, e.tramos);
  return {
    ...c,
    base,
    tipoMedio: c.cuota / base,
    retenciones: e.retenciones,
    diferencia: c.cuota - e.retenciones,
    neto: base - c.cuota,
  };
}
