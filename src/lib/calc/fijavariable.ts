/**
 * Hipoteca fija frente a variable.
 *
 * La variable paga Euríbor + diferencial. Si se supone un Euríbor constante, ambas
 * cuestan lo mismo cuando Euríbor + diferencial = TIN fijo, es decir:
 *
 *   Euríbor de equilibrio = TIN fijo − diferencial
 *
 * Por debajo de ese Euríbor medio sale mejor la variable; por encima, la fija.
 * Es una simplificación: el Euríbor real cambia en cada revisión.
 */
import { cuotaFrancesa } from './prestamo';
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface EntradaFijaVariable {
  capital: number;
  anios: number;
  tinFijo: number;
  diferencial: number;
  /** Euríbor que se quiere probar. Opcional. */
  euribor?: number;
}

export interface EscenarioVariable {
  euribor: number;
  /** Euríbor + diferencial, con suelo en 0 %. */
  tin: number;
  cuota: number;
  intereses: number;
  /** Variable menos fija: positivo si la variable sale más cara. */
  difCuota: number;
  difIntereses: number;
}

export interface ResultadoFijaVariable {
  meses: number;
  fija: { cuota: number; intereses: number };
  euriborEquilibrio: number;
  /** Escenario con el Euríbor indicado, si se indicó. */
  variable: EscenarioVariable | null;
  /** Euríbor del 0 % al 5 %, de punto en punto. */
  escenarios: EscenarioVariable[];
}

export function validarFijaVariable(e: EntradaFijaVariable): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'capital', e.capital, { etiqueta: 'El importe de la hipoteca', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El plazo en años', min: 1, max: LIMITES.aniosHipotecaMax, entero: true });
  comprobarNumero(err, 'tinFijo', e.tinFijo, { etiqueta: 'El TIN de la fija', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarNumero(err, 'diferencial', e.diferencial, { etiqueta: 'El diferencial', min: 0, max: 0.1, formato: fmtPorcentaje });
  if (e.euribor !== undefined) {
    comprobarNumero(err, 'euribor', e.euribor, { etiqueta: 'El Euríbor', min: LIMITES.euriborMin, max: LIMITES.euriborMax, formato: fmtPorcentaje });
  }
  return err;
}

export function calcularFijaVariable(e: EntradaFijaVariable): ResultadoFijaVariable {
  lanzarSiHayErrores(validarFijaVariable(e));
  const meses = e.anios * 12;
  const coste = (tin: number) => {
    const cuota = cuotaFrancesa(e.capital, tin, meses);
    return { cuota, intereses: cuota * meses - e.capital };
  };
  const fija = coste(e.tinFijo);
  const escenario = (euribor: number): EscenarioVariable => {
    const tin = Math.max(0, euribor + e.diferencial);
    const c = coste(tin);
    return { euribor, tin, ...c, difCuota: c.cuota - fija.cuota, difIntereses: c.intereses - fija.intereses };
  };
  return {
    meses,
    fija,
    euriborEquilibrio: e.tinFijo - e.diferencial,
    variable: e.euribor === undefined ? null : escenario(e.euribor),
    escenarios: [0, 0.01, 0.02, 0.03, 0.04, 0.05].map(escenario),
  };
}
