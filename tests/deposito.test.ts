import { describe, expect, it } from 'vitest';
import { calcularDeposito, validarDeposito, type EntradaDeposito } from '../src/lib/calc/deposito';

const base: EntradaDeposito = { importe: 10_000, tipo: 0.03, claseTipo: 'TAE', plazo: 6, unidad: 'meses', retencion: 0.19 };

describe('rentabilidad de un depósito', () => {
  it('10.000 € al 3 % TAE a 6 meses → 148,89 € brutos, 28,29 € de retención, 120,60 € netos', () => {
    const r = calcularDeposito(base);
    expect(r.interesesBrutos).toBeCloseTo(148.89, 2);
    expect(r.retencion).toBeCloseTo(28.29, 2);
    expect(r.interesesNetos).toBeCloseTo(120.6, 2);
    expect(r.totalAlVencimiento).toBeCloseTo(10_120.6, 2);
    expect(r.taeEquivalente).toBeCloseTo(0.03, 12);
  });
  it('10.000 € al 3 % TIN a 90 días → 73,97 € brutos (interés simple, base 365)', () => {
    const r = calcularDeposito({ ...base, claseTipo: 'TIN', plazo: 90, unidad: 'dias' });
    expect(r.interesesBrutos).toBeCloseTo(73.97, 2);
    expect(r.interesesNetos).toBeCloseTo(59.92, 2);
    expect(r.taeEquivalente).toBeGreaterThan(0.03);
  });
  it('a 12 meses TAE y TIN dan lo mismo: 300 € brutos, 243 € netos', () => {
    for (const claseTipo of ['TAE', 'TIN'] as const) {
      const r = calcularDeposito({ ...base, claseTipo, plazo: 12 });
      expect(r.interesesBrutos).toBeCloseTo(300, 8);
      expect(r.interesesNetos).toBeCloseTo(243, 8);
    }
  });
  it('12 meses y 365 días son el mismo plazo', () => {
    const a = calcularDeposito({ ...base, plazo: 12 });
    const b = calcularDeposito({ ...base, plazo: 365, unidad: 'dias' });
    expect(a.interesesBrutos).toBeCloseTo(b.interesesBrutos, 10);
  });
  it('tipo 0 %: sin intereses ni retención', () => {
    const r = calcularDeposito({ ...base, tipo: 0 });
    expect(r.interesesBrutos).toBe(0);
    expect(r.retencion).toBe(0);
    expect(r.totalAlVencimiento).toBe(10_000);
  });
  it('plazo de 1 mes y de 1 día', () => {
    expect(calcularDeposito({ ...base, claseTipo: 'TIN', plazo: 1 }).interesesBrutos).toBeCloseTo(25, 8);
    expect(calcularDeposito({ ...base, claseTipo: 'TIN', plazo: 1, unidad: 'dias' }).interesesBrutos).toBeCloseTo(0.82, 2);
  });
  it('importe grande: 100 M€ al 2,5 % TIN a 12 meses → 2,5 M€ brutos', () => {
    expect(calcularDeposito({ ...base, importe: 100_000_000, tipo: 0.025, claseTipo: 'TIN', plazo: 12 }).interesesBrutos).toBeCloseTo(2_500_000, 6);
  });
  it('valida entradas', () => {
    expect(validarDeposito({ ...base, importe: -1 }).importe).toBe('El importe no puede ser negativo.');
    expect(validarDeposito({ ...base, plazo: 0 }).plazo).toBe('El plazo en meses debe ser como mínimo 1.');
    expect(validarDeposito({ ...base, plazo: 4000, unidad: 'dias' }).plazo).toBe('El plazo en días debe ser como máximo 3.650.');
    expect(validarDeposito({ ...base, plazo: 1.5 }).plazo).toBe('El plazo en meses debe ser un número entero.');
  });
});
