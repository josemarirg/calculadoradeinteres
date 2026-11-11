/**
 * Interés simple y su comparación con el compuesto (capitalización anual).
 *
 *   Simple:    VF = P·(1 + r·t)
 *   Compuesto: VF = P·(1 + r)^t
 */
import { comprobarNumero, fmtEuros, fmtPorcentaje, lanzarSiHayErrores, LIMITES, type Errores } from './validacion';

export interface EntradaSimple {
  capital: number;
  tipoAnual: number;
  anios: number;
}

export interface FilaSimple {
  anio: number;
  simple: number;
  compuesto: number;
}

export interface ResultadoSimple {
  intereses: number;
  valorFinal: number;
  compuesto: { intereses: number; valorFinal: number };
  /** Cuánto más se obtiene con interés compuesto. */
  diferencia: number;
  tabla: FilaSimple[];
}

export function validarSimple(e: EntradaSimple): Errores {
  const err: Errores = {};
  comprobarNumero(err, 'capital', e.capital, { etiqueta: 'El capital', min: 0, minExcluido: true, max: LIMITES.importeMax, formato: fmtEuros });
  comprobarNumero(err, 'tipoAnual', e.tipoAnual, { etiqueta: 'El tipo de interés', min: 0, max: LIMITES.tipoMax, formato: fmtPorcentaje });
  comprobarNumero(err, 'anios', e.anios, { etiqueta: 'El número de años', min: 1, max: LIMITES.aniosAhorroMax, entero: true });
  return err;
}

export function calcularSimple(e: EntradaSimple): ResultadoSimple {
  lanzarSiHayErrores(validarSimple(e));
  const tabla: FilaSimple[] = [];
  for (let anio = 1; anio <= e.anios; anio++) {
    tabla.push({
      anio,
      simple: e.capital * (1 + e.tipoAnual * anio),
      compuesto: e.capital * Math.pow(1 + e.tipoAnual, anio),
    });
  }
  const valorFinal = e.capital * (1 + e.tipoAnual * e.anios);
  const vfCompuesto = e.capital * Math.pow(1 + e.tipoAnual, e.anios);
  return {
    intereses: valorFinal - e.capital,
    valorFinal,
    compuesto: { intereses: vfCompuesto - e.capital, valorFinal: vfCompuesto },
    diferencia: vfCompuesto - valorFinal,
    tabla,
  };
}
