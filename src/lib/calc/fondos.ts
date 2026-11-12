/**
 * Fondos indexados: proyección con aportaciones mensuales, comisiones e impuestos al reembolsar.
 *
 *   Crecimiento anual neto = (1 + rentabilidad) · (1 − comisión) − 1
 *
 * Las comisiones (gastos corrientes del fondo) se descuentan del patrimonio cada año.
 * Los impuestos se pagan una sola vez, al reembolsar, sobre la ganancia y con la
 * escala del ahorro. Se simula mes a mes, con la aportación al final de cada mes.
 *
 * Es una proyección con rentabilidad constante: un fondo de renta variable no la tiene.
 */
import { cuotaAhorro, type TramoAhorro } from './irpfahorro';
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface EntradaFondos {
  capitalInicial: number;
  aportacionMensual: number;
  anios: number;
  /** Rentabilidad anual esperada antes de comisiones. */
  rentabilidad: number;
  /** Comisiones anuales (gastos corrientes, TER), en tanto por uno. */
  comision: number;
  /** Escala del ahorro, desde `config/fiscal.ts`. */
  tramos: readonly TramoAhorro[];
}

export interface FilaFondos {
  anio: number;
  aportado: number;
  saldo: number;
  /** Saldo que habría sin comisiones. */
  sinComisiones: number;
}

export interface ResultadoFondos {
  valorFinal: number;
  totalAportado: number;
  ganancia: number;
  valorSinComisiones: number;
  /** Lo que dejan de valer tus participaciones por las comisiones. */
  costeComisiones: number;
  /** IRPF si se reembolsa todo de una vez al final. */
  impuesto: number;
  valorNeto: number;
  tabla: FilaFondos[];
}

export function validarFondos(e: EntradaFondos): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'capitalInicial', e.capitalInicial, { etiqueta: 'El capital inicial', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'aportacionMensual', e.aportacionMensual, { etiqueta: 'La aportación mensual', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El número de años', min: 1, max: LIMITES.aniosAhorroMax, entero: true });
  comprobarNumero(err, 'rentabilidad', e.rentabilidad, { etiqueta: 'La rentabilidad', min: -0.2, max: 0.3, formato: fmtPorcentaje });
  comprobarNumero(err, 'comision', e.comision, { etiqueta: 'La comisión', min: 0, max: 0.05, formato: fmtPorcentaje });
  if (!err.capitalInicial && !err.aportacionMensual && e.capitalInicial === 0 && e.aportacionMensual === 0) {
    err.capitalInicial = 'Indica un capital inicial o una aportación mensual mayor que cero.';
  }
  return err;
}

export function calcularFondos(e: EntradaFondos): ResultadoFondos {
  lanzarSiHayErrores(validarFondos(e));
  const bruto = Math.pow(1 + e.rentabilidad, 1 / 12);
  const neto = Math.pow((1 + e.rentabilidad) * (1 - e.comision), 1 / 12);
  let saldo = e.capitalInicial;
  let sinComisiones = e.capitalInicial;
  let aportado = e.capitalInicial;
  const tabla: FilaFondos[] = [];
  for (let anio = 1; anio <= e.anios; anio++) {
    for (let mes = 1; mes <= 12; mes++) {
      saldo = saldo * neto + e.aportacionMensual;
      sinComisiones = sinComisiones * bruto + e.aportacionMensual;
      aportado += e.aportacionMensual;
    }
    tabla.push({ anio, aportado, saldo, sinComisiones });
  }
  const ganancia = saldo - aportado;
  const impuesto = cuotaAhorro(Math.max(0, ganancia), e.tramos).cuota;
  return {
    valorFinal: saldo,
    totalAportado: aportado,
    ganancia,
    valorSinComisiones: sinComisiones,
    costeComisiones: sinComisiones - saldo,
    impuesto,
    valorNeto: saldo - impuesto,
    tabla,
  };
}
