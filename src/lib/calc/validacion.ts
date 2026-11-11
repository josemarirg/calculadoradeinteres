/**
 * Validación de entradas común a todas las calculadoras.
 * Sin dependencias de la interfaz: devuelve mensajes en español por campo.
 */

/** Mapa campo → mensaje de error. Vacío si todo es válido. */
export type Errores = Record<string, string>;

export class ErrorValidacion extends Error {
  readonly errores: Errores;
  constructor(errores: Errores) {
    super(Object.values(errores)[0] ?? 'Datos no válidos.');
    this.name = 'ErrorValidacion';
    this.errores = errores;
  }
}

export interface ReglaNumero {
  /** Nombre del campo tal como se muestra al usuario, con artículo: «El capital inicial». */
  etiqueta: string;
  min: number;
  max: number;
  /** Si es true, el mínimo queda excluido (el valor debe ser estrictamente mayor). */
  minExcluido?: boolean;
  entero?: boolean;
  /** Cómo mostrar los límites en el mensaje. */
  formato?: (n: number) => string;
}

const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions);

export const fmtEuros = (n: number) => `${numero.format(n)} €`;
export const fmtPorcentaje = (n: number) => `${numero.format(n * 100)} %`;
export const fmtNumero = (n: number) => numero.format(n);

/** Comprueba un número y anota el error en `errores[campo]` si no cumple la regla. */
export function comprobarNumero(errores: Errores, campo: string, valor: unknown, regla: ReglaNumero): void {
  const f = regla.formato ?? fmtNumero;
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    errores[campo] = `${regla.etiqueta} debe ser un número.`;
    return;
  }
  if (valor < 0 && regla.min >= 0) {
    errores[campo] = `${regla.etiqueta} no puede ser negativo.`;
    return;
  }
  if (regla.entero && !Number.isInteger(valor)) {
    errores[campo] = `${regla.etiqueta} debe ser un número entero.`;
    return;
  }
  if (regla.minExcluido ? valor <= regla.min : valor < regla.min) {
    errores[campo] = regla.minExcluido
      ? `${regla.etiqueta} debe ser mayor que ${f(regla.min)}.`
      : `${regla.etiqueta} debe ser como mínimo ${f(regla.min)}.`;
    return;
  }
  if (valor > regla.max) {
    errores[campo] = `${regla.etiqueta} debe ser como máximo ${f(regla.max)}.`;
  }
}

export function comprobarOpcion<T>(errores: Errores, campo: string, valor: T, opciones: readonly T[], etiqueta: string): void {
  if (!opciones.includes(valor)) errores[campo] = `${etiqueta}: elige una de las opciones disponibles.`;
}

export function lanzarSiHayErrores(errores: Errores): void {
  if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
}

/** Límites compartidos, en un único sitio. */
export const LIMITES = {
  importeMax: 100_000_000,
  aportacionMax: 1_000_000,
  tipoMax: 0.5,
  aniosAhorroMax: 60,
  mesesPrestamoMax: 240,
  aniosHipotecaMax: 40,
  euriborMin: -0.01,
  euriborMax: 0.15,
  mesesDepositoMax: 120,
  diasDepositoMax: 3650,
} as const;
