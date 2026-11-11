/**
 * Cuota de hipoteca (sistema francés) y simulación de amortización anticipada.
 *
 * Hipoteca variable: se aplica Euríbor + diferencial y se supone constante durante
 * todo el plazo. Es una simplificación: el tipo real se revisa cada 6 o 12 meses, según el contrato.
 */
import { cuadroAmortizacion, cuotaFrancesa, type FilaAmortizacion } from './prestamo';
import { anualizar } from './tae';
import { comprobarNumero, comprobarOpcion, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export type Modalidad = 'fija' | 'variable';

export interface EntradaHipoteca {
  precio: number;
  ahorro: number;
  anios: number;
  modalidad: Modalidad;
  /** TIN de la hipoteca fija. */
  tin?: number;
  /** Euríbor actual (puede ser negativo). Solo en variable. */
  euribor?: number;
  /** Diferencial sobre el Euríbor. Solo en variable. */
  diferencial?: number;
}

export interface ResultadoHipoteca {
  capital: number;
  /** Porcentaje del precio que se financia (0.8 = 80 %). */
  financiacion: number;
  tinAplicado: number;
  meses: number;
  cuota: number;
  totalIntereses: number;
  totalPagado: number;
  /** TAE sin gastos vinculados (tasación, seguros, comisiones): decisión n.º 4. */
  taeOrientativa: number;
  cuadro: FilaAmortizacion[];
}

/** Tipo aplicado. En variable, Euríbor + diferencial con suelo en 0 %. */
export function tinDeHipoteca(e: Pick<EntradaHipoteca, 'modalidad' | 'tin' | 'euribor' | 'diferencial'>): number {
  if (e.modalidad === 'fija') return e.tin ?? NaN;
  return Math.max(0, (e.euribor ?? NaN) + (e.diferencial ?? NaN));
}

export function validarHipoteca(e: EntradaHipoteca): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'precio', e.precio, { etiqueta: 'El precio de la vivienda', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'ahorro', e.ahorro, { etiqueta: 'El ahorro aportado', min: 0, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El plazo en años', min: 1, max: LIMITES.aniosHipotecaMax, entero: true });
  comprobarOpcion(err, 'modalidad', e.modalidad, ['fija', 'variable'] as const, 'Tipo de hipoteca');
  if (e.modalidad === 'variable') {
    comprobarNumero(err, 'euribor', e.euribor, { etiqueta: 'El Euríbor', min: LIMITES.euriborMin, max: LIMITES.euriborMax, formato: fmtPorcentaje });
    comprobarNumero(err, 'diferencial', e.diferencial, { etiqueta: 'El diferencial', min: 0, max: 0.1, formato: fmtPorcentaje });
  } else {
    comprobarNumero(err, 'tin', e.tin, { etiqueta: 'El TIN', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  }
  if (!err.precio && !err.ahorro && e.ahorro >= e.precio) {
    err.ahorro = 'El ahorro aportado debe ser menor que el precio: si cubre todo el precio no necesitas hipoteca.';
  }
  return err;
}

export function calcularHipoteca(e: EntradaHipoteca): ResultadoHipoteca {
  lanzarSiHayErrores(validarHipoteca(e));
  const capital = e.precio - e.ahorro;
  const tin = tinDeHipoteca(e);
  const meses = e.anios * 12;
  const cuota = cuotaFrancesa(capital, tin, meses);
  const cuadro = cuadroAmortizacion(capital, tin, meses, cuota);
  const totalIntereses = cuadro.reduce((s, f) => s + f.intereses, 0);
  return {
    capital,
    financiacion: capital / e.precio,
    tinAplicado: tin,
    meses,
    cuota,
    totalIntereses,
    totalPagado: capital + totalIntereses,
    taeOrientativa: anualizar(tin / 12),
    cuadro,
  };
}

export type ModoAnticipada = 'cuota' | 'plazo';

export interface EntradaAnticipada {
  capital: number;
  tin: number;
  meses: number;
  /** Importe que se amortiza de golpe. */
  importe: number;
  /** Se amortiza justo después de pagar esta cuota (0 = nada más firmar). */
  trasCuota: number;
  /** 'cuota': se mantiene el plazo y baja la cuota. 'plazo': se mantiene la cuota y se acaba antes. */
  modo: ModoAnticipada;
}

export interface ResultadoAnticipada {
  cuotaOriginal: number;
  saldoAntes: number;
  saldoDespues: number;
  nuevaCuota: number;
  /** Cuotas que quedan por pagar después de amortizar. */
  cuotasRestantes: number;
  mesesAhorrados: number;
  interesesSinAmortizar: number;
  interesesConAmortizar: number;
  ahorroIntereses: number;
  /** Cuadro completo: cuotas ya pagadas más las nuevas. */
  cuadro: FilaAmortizacion[];
}

/** Por debajo de esto (una millonésima de euro) el saldo se considera liquidado. */
const SALDO_CERO = 1e-6;

export function validarAnticipada(e: EntradaAnticipada): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'capital', e.capital, { etiqueta: 'El capital de la hipoteca', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tin', e.tin, { etiqueta: 'El TIN', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarNumero(err, 'meses', e.meses, { etiqueta: 'El plazo en meses', min: 1, max: LIMITES.aniosHipotecaMax * 12, entero: true });
  comprobarNumero(err, 'importe', e.importe, { etiqueta: 'El importe que amortizas', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarOpcion(err, 'modo', e.modo, ['cuota', 'plazo'] as const, 'Qué reducir');
  if (!err.meses) {
    comprobarNumero(err, 'trasCuota', e.trasCuota, { etiqueta: 'La cuota tras la que amortizas', min: 0, max: e.meses - 1, entero: true });
  }
  if (Object.keys(err).length === 0) {
    const saldo = e.trasCuota === 0 ? e.capital : cuadroAmortizacion(e.capital, e.tin, e.meses)[e.trasCuota - 1].saldo;
    if (e.importe > saldo + SALDO_CERO) {
      err.importe = `El importe supera el capital pendiente en ese momento (${fmtEuros(Math.round(saldo * 100) / 100)}).`;
    }
  }
  return err;
}

export function simularAmortizacionAnticipada(e: EntradaAnticipada): ResultadoAnticipada {
  lanzarSiHayErrores(validarAnticipada(e));
  const i = e.tin / 12;
  const cuotaOriginal = cuotaFrancesa(e.capital, e.tin, e.meses);
  const original = cuadroAmortizacion(e.capital, e.tin, e.meses, cuotaOriginal);
  const interesesSinAmortizar = original.reduce((s, f) => s + f.intereses, 0);

  const pagadas = original.slice(0, e.trasCuota);
  const saldoAntes = e.trasCuota === 0 ? e.capital : pagadas[pagadas.length - 1].saldo;
  const saldoDespues = Math.max(0, saldoAntes - e.importe);
  const mesesPendientes = e.meses - e.trasCuota;

  let nuevas: FilaAmortizacion[] = [];
  let nuevaCuota = 0;
  if (saldoDespues > SALDO_CERO) {
    if (e.modo === 'cuota') {
      nuevaCuota = cuotaFrancesa(saldoDespues, e.tin, mesesPendientes);
      nuevas = cuadroAmortizacion(saldoDespues, e.tin, mesesPendientes, nuevaCuota);
    } else {
      nuevaCuota = cuotaOriginal;
      let saldo = saldoDespues;
      while (saldo > SALDO_CERO) {
        const intereses = saldo * i;
        const ultima = saldo + intereses <= cuotaOriginal + SALDO_CERO;
        const amortizacion = ultima ? saldo : cuotaOriginal - intereses;
        saldo = ultima ? 0 : saldo - amortizacion;
        nuevas.push({ n: 0, cuota: amortizacion + intereses, intereses, amortizacion, saldo });
      }
    }
  }
  const cuadro = [...pagadas, ...nuevas.map((f, k) => ({ ...f, n: e.trasCuota + k + 1 }))];
  const interesesConAmortizar = cuadro.reduce((s, f) => s + f.intereses, 0);

  return {
    cuotaOriginal,
    saldoAntes,
    saldoDespues,
    nuevaCuota,
    cuotasRestantes: nuevas.length,
    mesesAhorrados: mesesPendientes - nuevas.length,
    interesesSinAmortizar,
    interesesConAmortizar,
    ahorroIntereses: interesesSinAmortizar - interesesConAmortizar,
    cuadro,
  };
}

/* ───────── Comparativa para una hipoteca ya en marcha ───────── */

export interface EntradaComparativa {
  capitalPendiente: number;
  tin: number;
  mesesRestantes: number;
  importe: number;
  /** Comisión por amortización anticipada, en tanto por uno del importe amortizado. */
  comision?: number;
}

export interface ResultadoComparativa {
  cuotaActual: number;
  interesesSinAmortizar: number;
  /** Comisión en euros. */
  comision: number;
  reducirCuota: { nuevaCuota: number; ahorroIntereses: number; ahorroNeto: number };
  reducirPlazo: { cuotasRestantes: number; mesesAhorrados: number; ahorroIntereses: number; ahorroNeto: number };
}

export function validarComparativa(e: EntradaComparativa): Errores {
  const base = validarAnticipada({ capital: e.capitalPendiente, tin: e.tin, meses: e.mesesRestantes, importe: e.importe, trasCuota: 0, modo: 'cuota' });
  const err: Errores = {};
  if (base.capital) err.capitalPendiente = base.capital.replace('El capital de la hipoteca', 'El capital pendiente');
  if (base.tin) err.tin = base.tin;
  if (base.meses) err.mesesRestantes = base.meses.replace('El plazo en meses', 'El plazo restante');
  if (base.importe) err.importe = base.importe.replace(' en ese momento', '');
  comprobarNumero(err, 'comision', e.comision ?? 0, { etiqueta: 'La comisión', min: 0, max: 0.05, formato: fmtPorcentaje });
  return err;
}

/** Amortizar hoy una hipoteca en marcha: compara reducir cuota y reducir plazo, con la comisión descontada. */
export function compararAmortizacion(e: EntradaComparativa): ResultadoComparativa {
  lanzarSiHayErrores(validarComparativa(e));
  const comun = { capital: e.capitalPendiente, tin: e.tin, meses: e.mesesRestantes, importe: e.importe, trasCuota: 0 };
  const c = simularAmortizacionAnticipada({ ...comun, modo: 'cuota' });
  const p = simularAmortizacionAnticipada({ ...comun, modo: 'plazo' });
  const comision = e.importe * (e.comision ?? 0);
  return {
    cuotaActual: c.cuotaOriginal,
    interesesSinAmortizar: c.interesesSinAmortizar,
    comision,
    reducirCuota: { nuevaCuota: c.nuevaCuota, ahorroIntereses: c.ahorroIntereses, ahorroNeto: c.ahorroIntereses - comision },
    reducirPlazo: { cuotasRestantes: p.cuotasRestantes, mesesAhorrados: p.mesesAhorrados, ahorroIntereses: p.ahorroIntereses, ahorroNeto: p.ahorroIntereses - comision },
  };
}
