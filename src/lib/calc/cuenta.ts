/**
 * Cuenta remunerada: intereses liquidados cada mes sobre el saldo, con retención
 * en cada abono. El interés neto se queda en la cuenta y pasa a generar intereses.
 *
 *   Interés del mes = min(saldo, límite remunerado) · tipo mensual
 *   Tipo mensual    = TIN/12, o (1 + TAE)^(1/12) − 1 si se introduce la TAE
 *
 * Supuestos: tipo constante, liquidación mensual y saldo sin más movimientos que
 * la aportación indicada, que entra al final de cada mes.
 */
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface EntradaCuenta {
  saldo: number;
  tipo: number;
  claseTipo: 'TIN' | 'TAE';
  meses: number;
  aportacionMensual?: number;
  /** Saldo máximo que remunera la entidad. 0 o sin indicar = sin límite. */
  limiteRemunerado?: number;
  retencion: number;
}

export interface FilaCuenta {
  mes: number;
  interesBruto: number;
  interesNeto: number;
  saldo: number;
}

export interface ResultadoCuenta {
  interesesBrutos: number;
  retencion: number;
  interesesNetos: number;
  totalAportado: number;
  saldoFinal: number;
  tabla: FilaCuenta[];
}

export function validarCuenta(e: EntradaCuenta): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'saldo', e.saldo, { etiqueta: 'El saldo', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tipo', e.tipo, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarOpcion(err, 'claseTipo', e.claseTipo, ['TIN', 'TAE'] as const, 'Clase de tipo');
  comprobarNumero(err, 'meses', e.meses, { etiqueta: 'El número de meses', min: 1, max: LIMITES.mesesDepositoMax, entero: true });
  comprobarNumero(err, 'aportacionMensual', e.aportacionMensual ?? 0, { etiqueta: 'La aportación mensual', min: 0, max: LIMITES.aportacionMax, formato: fmtEuros });
  comprobarNumero(err, 'limiteRemunerado', e.limiteRemunerado ?? 0, { etiqueta: 'El saldo máximo remunerado', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'retencion', e.retencion, { etiqueta: 'La retención', min: 0, max: 0.6, formato: fmtPorcentaje });
  if (!err.saldo && !err.aportacionMensual && e.saldo === 0 && (e.aportacionMensual ?? 0) === 0) {
    err.saldo = 'Indica un saldo o una aportación mensual mayor que cero.';
  }
  return err;
}

export function calcularCuenta(e: EntradaCuenta): ResultadoCuenta {
  lanzarSiHayErrores(validarCuenta(e));
  const tipoMes = e.claseTipo === 'TAE' ? Math.pow(1 + e.tipo, 1 / 12) - 1 : e.tipo / 12;
  const limite = e.limiteRemunerado && e.limiteRemunerado > 0 ? e.limiteRemunerado : Infinity;
  const aportacion = e.aportacionMensual ?? 0;

  let saldo = e.saldo;
  let brutos = 0;
  let retenido = 0;
  const tabla: FilaCuenta[] = [];
  for (let mes = 1; mes <= e.meses; mes++) {
    const interesBruto = Math.min(saldo, limite) * tipoMes;
    const retencion = interesBruto * e.retencion;
    brutos += interesBruto;
    retenido += retencion;
    saldo += interesBruto - retencion + aportacion;
    tabla.push({ mes, interesBruto, interesNeto: interesBruto - retencion, saldo });
  }
  return {
    interesesBrutos: brutos,
    retencion: retenido,
    interesesNetos: brutos - retenido,
    totalAportado: e.saldo + aportacion * e.meses,
    saldoFinal: saldo,
    tabla,
  };
}
