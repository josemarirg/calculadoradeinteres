import { describe, expect, it } from 'vitest';
import { calcularSimple, validarSimple } from '../src/lib/calc/simple';

describe('interés simple', () => {
  it('10.000 € al 5 % durante 10 años → 15.000 € (compuesto: 16.288,95 €)', () => {
    const r = calcularSimple({ capital: 10_000, tipoAnual: 0.05, anios: 10 });
    expect(r.valorFinal).toBeCloseTo(15_000, 8);
    expect(r.intereses).toBeCloseTo(5_000, 8);
    expect(r.compuesto.valorFinal).toBeCloseTo(16_288.95, 2);
    expect(r.diferencia).toBeCloseTo(1_288.95, 2);
    expect(r.tabla).toHaveLength(10);
  });
  it('a un año simple y compuesto coinciden', () => {
    const r = calcularSimple({ capital: 3_000, tipoAnual: 0.04, anios: 1 });
    expect(r.valorFinal).toBeCloseTo(3_120, 8);
    expect(r.diferencia).toBeCloseTo(0, 8);
  });
  it('tipo 0 %: sin intereses', () => {
    const r = calcularSimple({ capital: 10_000, tipoAnual: 0, anios: 5 });
    expect(r.intereses).toBe(0);
    expect(r.compuesto.intereses).toBe(0);
  });
  it('valida entradas', () => {
    expect(validarSimple({ capital: 0, tipoAnual: 0.05, anios: 10 }).capital).toBe('El capital debe ser mayor que 0 €.');
    expect(validarSimple({ capital: -10, tipoAnual: 0.05, anios: 10 }).capital).toBe('El capital no puede ser negativo.');
    expect(validarSimple({ capital: 10, tipoAnual: 0.05, anios: 61 }).anios).toBe('El número de años debe ser como máximo 60.');
  });
});
