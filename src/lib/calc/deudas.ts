/**
 * Plan para liquidar varias deudas con un extra mensual.
 *
 * Cada mes se pagan las cuotas de todas las deudas y el extra va entero a una sola:
 *   - 'avalancha': la de mayor tipo de interés (minimiza los intereses).
 *   - 'bola': la de menor saldo (se eliminan deudas antes; «bola de nieve»).
 * Cuando una deuda se liquida, su cuota se suma al extra de la siguiente: el
 * presupuesto mensual total no cambia hasta terminar.
 *
 * Supuestos: tipos constantes, sin deuda nueva y sin comisiones por amortizar.
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export const DEUDAS_MAX = 5;
/** Tope de la simulación: 100 años. */
const MESES_MAX = 1200;
const SALDO_CERO = 1e-6;

export type MetodoDeudas = 'avalancha' | 'bola';

export interface Deuda {
  saldo: number;
  tin: number;
  /** Cuota mensual actual. */
  cuota: number;
}

export interface EntradaDeudas {
  deudas: Deuda[];
  /** Dinero adicional al mes, además de las cuotas. */
  extra: number;
  metodo: MetodoDeudas;
}

export interface PlanDeudas {
  meses: number;
  intereses: number;
  totalPagado: number;
  /** Orden en que se liquidan: posición de la deuda en la entrada (desde 0) y mes. */
  orden: { indice: number; mes: number }[];
}

export interface ResultadoDeudas {
  deudaTotal: number;
  /** Suma de cuotas más el extra. */
  presupuestoMensual: number;
  elegido: PlanDeudas;
  avalancha: PlanDeudas;
  bola: PlanDeudas;
  /** Cada deuda con su cuota actual, sin extra ni traspaso de cuotas. null si alguna no se liquida nunca. */
  soloCuotas: PlanDeudas | null;
}

/** Simula el plan. Devuelve null si no se liquida todo en 100 años. */
export function simularPlan(deudas: readonly Deuda[], extra: number, metodo: MetodoDeudas | 'ninguno'): PlanDeudas | null {
  const saldos = deudas.map((d) => d.saldo);
  const presupuesto = deudas.reduce((s, d) => s + d.cuota, 0) + extra;
  const orden: PlanDeudas['orden'] = [];
  let intereses = 0;
  let mes = 0;

  while (saldos.some((s) => s > SALDO_CERO)) {
    if (++mes > MESES_MAX) return null;
    let disponible = metodo === 'ninguno' ? 0 : presupuesto;
    deudas.forEach((d, k) => {
      if (saldos[k] <= SALDO_CERO) return;
      const interes = (saldos[k] * d.tin) / 12;
      intereses += interes;
      saldos[k] += interes;
      const pago = Math.min(d.cuota, saldos[k]);
      saldos[k] -= pago;
      disponible -= pago;
    });
    if (metodo !== 'ninguno') {
      const pendientes = deudas
        .map((d, k) => ({ k, tin: d.tin, saldo: saldos[k] }))
        .filter((x) => x.saldo > SALDO_CERO)
        .sort((a, b) => (metodo === 'avalancha' ? b.tin - a.tin || a.saldo - b.saldo : a.saldo - b.saldo || b.tin - a.tin));
      for (const p of pendientes) {
        if (disponible <= SALDO_CERO) break;
        const pago = Math.min(disponible, saldos[p.k]);
        saldos[p.k] -= pago;
        disponible -= pago;
      }
    }
    saldos.forEach((s, k) => {
      if (s <= SALDO_CERO && !orden.some((o) => o.indice === k)) {
        saldos[k] = 0;
        orden.push({ indice: k, mes });
      }
    });
  }
  const deudaTotal = deudas.reduce((s, d) => s + d.saldo, 0);
  return { meses: mes, intereses, totalPagado: deudaTotal + intereses, orden };
}

/** Los errores de cada deuda llevan su posición (desde 1): `saldo1`, `tin1`, `cuota1`… */
export function validarDeudas(e: EntradaDeudas): Errores {
  const err: Errores = {};
  if (e.deudas.length === 0) err.deudas = 'Indica al menos una deuda.';
  if (e.deudas.length > DEUDAS_MAX) err.deudas = `Como máximo ${DEUDAS_MAX} deudas.`;
  e.deudas.forEach((d, k) => {
    const n = k + 1;
    comprobarNumero(err, `saldo${n}`, d.saldo, { etiqueta: 'El saldo pendiente', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
    comprobarNumero(err, `tin${n}`, d.tin, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
    comprobarNumero(err, `cuota${n}`, d.cuota, { etiqueta: 'La cuota mensual', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  });
  comprobarNumero(err, 'extra', e.extra, { etiqueta: 'El extra mensual', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarOpcion(err, 'metodo', e.metodo, ['avalancha', 'bola'] as const, 'Método');
  if (Object.keys(err).length === 0 && !simularPlan(e.deudas, e.extra, e.metodo)) {
    err.extra = 'Con estos pagos las deudas no llegan a liquidarse: las cuotas no cubren los intereses. Aumenta las cuotas o el extra.';
  }
  return err;
}

export function calcularDeudas(e: EntradaDeudas): ResultadoDeudas {
  lanzarSiHayErrores(validarDeudas(e));
  const avalancha = simularPlan(e.deudas, e.extra, 'avalancha')!;
  const bola = simularPlan(e.deudas, e.extra, 'bola')!;
  return {
    deudaTotal: e.deudas.reduce((s, d) => s + d.saldo, 0),
    presupuestoMensual: e.deudas.reduce((s, d) => s + d.cuota, 0) + e.extra,
    elegido: e.metodo === 'avalancha' ? avalancha : bola,
    avalancha,
    bola,
    soloCuotas: simularPlan(e.deudas, 0, 'ninguno'),
  };
}
