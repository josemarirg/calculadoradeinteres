import { describe, expect, it } from 'vitest';
import { calcularCompuesto, validarCompuesto, valorFuturo, type EntradaCompuesto } from '../src/lib/calc/compuesto';
import { ErrorValidacion } from '../src/lib/calc/validacion';

const base: EntradaCompuesto = {
  capitalInicial: 10_000,
  aportacion: 200,
  frecuenciaAportacion: 'mensual',
  momento: 'final',
  tipoAnual: 0.05,
  anios: 20,
  capitalizacionesPorAnio: 12,
};

describe('valorFuturo (fórmula cerrada)', () => {
  it('10.000 € + 200 €/mes al 5 % durante 20 años, aportación al final → 109.333,14 €', () => {
    expect(valorFuturo(10_000, 200, 0.05, 12, 20)).toBeCloseTo(109_333.14, 2);
  });
  it('mismo caso con aportación al inicio → 109.675,66 €', () => {
    expect(valorFuturo(10_000, 200, 0.05, 12, 20, true)).toBeCloseTo(109_675.66, 2);
  });
  it('sin aportaciones equivale a P·(1+r)^t: 10.000 € al 5 % anual 10 años → 16.288,95 €', () => {
    expect(valorFuturo(10_000, 0, 0.05, 1, 10)).toBeCloseTo(16_288.95, 2);
  });
  it('tipo 0 %: devuelve solo lo aportado', () => {
    expect(valorFuturo(10_000, 200, 0, 12, 20)).toBe(58_000);
  });
});

describe('calcularCompuesto (simulación)', () => {
  it('caso de referencia: coincide con la fórmula cerrada y desglosa aportado e intereses', () => {
    const r = calcularCompuesto(base);
    expect(r.valorFinal).toBeCloseTo(109_333.14, 2);
    expect(r.totalAportado).toBe(58_000);
    expect(r.interesesBrutos).toBeCloseTo(51_333.14, 2);
    expect(r.retencionTotal).toBe(0);
    expect(r.tabla).toHaveLength(20);
    expect(r.tabla[19].saldo).toBe(r.valorFinal);
  });

  it('aportación al inicio → 109.675,66 €', () => {
    expect(calcularCompuesto({ ...base, momento: 'inicio' }).valorFinal).toBeCloseTo(109_675.66, 2);
  });

  it('inflación del 2 %: valor real 73.578,07 €', () => {
    const r = calcularCompuesto({ ...base, inflacion: 0.02 });
    expect(r.valorFinal).toBeCloseTo(109_333.14, 2);
    expect(r.valorFinalReal).toBeCloseTo(73_578.07, 2);
  });

  it('frecuencias distintas: capitalización mensual y 1.200 € al final de cada año, 10 años → 31.645,67 €', () => {
    const r = calcularCompuesto({ ...base, aportacion: 1200, frecuenciaAportacion: 'anual', anios: 10 });
    expect(r.valorFinal).toBeCloseTo(31_645.67, 2);
    expect(r.totalAportado).toBe(22_000);
  });

  it('frecuencias distintas: 100 €/mes con capitalización anual al 5 %, 10 años → 15.436,32 € (tipo mensual equivalente)', () => {
    const r = calcularCompuesto({ ...base, capitalInicial: 0, aportacion: 100, capitalizacionesPorAnio: 1, anios: 10 });
    expect(r.valorFinal).toBeCloseTo(15_436.32, 2);
  });

  it('coincide con la fórmula cerrada para toda combinación en la que frecuencias coinciden', () => {
    for (const momento of ['inicio', 'final'] as const) {
      const mensual = calcularCompuesto({ ...base, momento, tipoAnual: 0.073, anios: 37 });
      expect(mensual.valorFinal).toBeCloseTo(valorFuturo(10_000, 200, 0.073, 12, 37, momento === 'inicio'), 4);
      const anual = calcularCompuesto({ ...base, momento, frecuenciaAportacion: 'anual', capitalizacionesPorAnio: 1, aportacion: 2400 });
      expect(anual.valorFinal).toBeCloseTo(valorFuturo(10_000, 2400, 0.05, 1, 20, momento === 'inicio'), 4);
    }
  });

  it('capitalización diaria sin aportaciones: 10.000 € al 5 % un año → 10.512,67 €', () => {
    const r = calcularCompuesto({ ...base, aportacion: 0, anios: 1, capitalizacionesPorAnio: 365 });
    expect(r.valorFinal).toBeCloseTo(10_000 * Math.pow(1 + 0.05 / 365, 365), 6);
    expect(r.valorFinal).toBeCloseTo(10_512.67, 2);
  });

  it('retención anual del 19 % sobre capital sin aportaciones equivale a un tipo neto del 4,05 %', () => {
    const r = calcularCompuesto({ ...base, aportacion: 0, capitalizacionesPorAnio: 1, anios: 10, retencion: 0.19, modoRetencion: 'anual' });
    expect(r.valorFinal).toBeCloseTo(10_000 * Math.pow(1 + 0.05 * 0.81, 10), 6);
    expect(r.valorFinal).toBeCloseTo(14_873.76, 2);
    expect(r.interesesNetos).toBeCloseTo(r.valorFinal - 10_000, 6);
  });

  it('retención al final: 19 % de la ganancia total', () => {
    const r = calcularCompuesto({ ...base, retencion: 0.19, modoRetencion: 'final' });
    expect(r.interesesBrutos).toBeCloseTo(51_333.14, 2);
    expect(r.retencionTotal).toBeCloseTo(9_753.3, 2);
    expect(r.valorFinal).toBeCloseTo(99_579.84, 2);
    expect(r.tabla[18].retenido).toBe(0);
  });

  it('tipo 0 %: el valor final es lo aportado y no hay intereses', () => {
    const r = calcularCompuesto({ ...base, tipoAnual: 0 });
    expect(r.valorFinal).toBe(58_000);
    expect(r.interesesBrutos).toBe(0);
  });

  it('importes grandes: 100 M€ al 10 % durante 60 años sigue siendo finito y exacto', () => {
    const r = calcularCompuesto({ ...base, capitalInicial: 100_000_000, aportacion: 0, tipoAnual: 0.1, anios: 60, capitalizacionesPorAnio: 1 });
    expect(r.valorFinal / (1e8 * Math.pow(1.1, 60))).toBeCloseTo(1, 12);
  });

  it('cada fila cumple saldo = aportado + intereses', () => {
    const r = calcularCompuesto({ ...base, retencion: 0.19, inflacion: 0.02 });
    for (const f of r.tabla) expect(f.saldo).toBeCloseTo(f.aportado + f.intereses, 8);
  });
});

describe('validación de interés compuesto', () => {
  it('rechaza negativos con mensaje en español', () => {
    expect(validarCompuesto({ ...base, capitalInicial: -1 }).capitalInicial).toBe('El capital inicial no puede ser negativo.');
    expect(validarCompuesto({ ...base, tipoAnual: -0.01 }).tipoAnual).toBe('El tipo de interés no puede ser negativo.');
  });
  it('rechaza valores fuera de límites', () => {
    expect(validarCompuesto({ ...base, tipoAnual: 0.9 }).tipoAnual).toBe('El tipo de interés debe ser como máximo 50 %.');
    expect(validarCompuesto({ ...base, anios: 0 }).anios).toBe('El número de años debe ser como mínimo 1.');
    expect(validarCompuesto({ ...base, anios: 2.5 }).anios).toBe('El número de años debe ser un número entero.');
    expect(validarCompuesto({ ...base, anios: NaN }).anios).toBe('El número de años debe ser un número.');
  });
  it('exige capital o aportación', () => {
    expect(validarCompuesto({ ...base, capitalInicial: 0, aportacion: 0 }).capitalInicial).toMatch(/mayor que cero/);
  });
  it('calcular lanza ErrorValidacion con todos los errores', () => {
    try {
      calcularCompuesto({ ...base, capitalInicial: -5, anios: 200 });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorValidacion);
      expect(Object.keys((e as ErrorValidacion).errores)).toEqual(['capitalInicial', 'anios']);
    }
  });
  it('una entrada válida no produce errores', () => {
    expect(validarCompuesto(base)).toEqual({});
  });
});
