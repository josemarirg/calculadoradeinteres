import { describe, expect, it } from 'vitest';
import { calcularPrestamo, cuadroAmortizacion, cuotaFrancesa, validarPrestamo } from '../src/lib/calc/prestamo';
import { anualizar, calcularTAE, tirMensual } from '../src/lib/calc/tae';

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('cuota francesa', () => {
  it('10.000 € al 7 % TIN a 5 años → 198,01 €/mes', () => {
    expect(cuotaFrancesa(10_000, 0.07, 60)).toBeCloseTo(198.01, 2);
  });
  it('200.000 € al 3 % a 30 años → 843,21 €/mes', () => {
    expect(cuotaFrancesa(200_000, 0.03, 360)).toBeCloseTo(843.21, 2);
  });
  it('tipo 0 %: 12.000 € a 12 meses → 1.000 €/mes exactos', () => {
    expect(cuotaFrancesa(12_000, 0, 12)).toBe(1_000);
  });
  it('plazo de 1 mes: 10.000 € al 7 % → 10.058,33 €', () => {
    expect(cuotaFrancesa(10_000, 0.07, 1)).toBeCloseTo(10_058.33, 2);
  });
  it('importe grande: 10 M€ al 4,5 % a 40 años → 44.956,28 €/mes', () => {
    expect(cuotaFrancesa(10_000_000, 0.045, 480)).toBeCloseTo(44_956.28, 2);
  });
});

describe('cuadro de amortización', () => {
  it('10.000 € al 7 % a 5 años: primera fila, totales y saldo final 0', () => {
    const c = cuadroAmortizacion(10_000, 0.07, 60);
    expect(c).toHaveLength(60);
    expect(c[0].intereses).toBeCloseTo(58.33, 2); // 10.000 × 0,07/12
    expect(c[0].amortizacion).toBeCloseTo(139.68, 2); // 198,01 − 58,33
    expect(c[0].saldo).toBeCloseTo(9_860.32, 2);
    expect(c[59].saldo).toBe(0);
    expect(suma(c.map((f) => f.amortizacion))).toBeCloseTo(10_000, 8);
    expect(suma(c.map((f) => f.intereses))).toBeCloseTo(1_880.72, 2);
  });
  it('la última cuota absorbe el residuo y no se desvía de las demás', () => {
    const c = cuadroAmortizacion(200_000, 0.03, 360);
    expect(c[359].saldo).toBe(0);
    expect(c[359].cuota).toBeCloseTo(c[0].cuota, 6);
  });
  it('cada fila cumple cuota = intereses + amortización y el saldo nunca sube', () => {
    const c = cuadroAmortizacion(37_500, 0.0895, 84);
    let anterior = 37_500;
    for (const f of c) {
      expect(f.cuota).toBeCloseTo(f.intereses + f.amortizacion, 10);
      expect(f.saldo).toBeLessThan(anterior);
      anterior = f.saldo;
    }
  });
  it('tipo 0 %: todo es amortización', () => {
    const c = cuadroAmortizacion(12_000, 0, 12);
    expect(suma(c.map((f) => f.intereses))).toBe(0);
    expect(c[11].saldo).toBe(0);
  });
});

describe('TAE', () => {
  it('sin comisiones coincide con (1+TIN/12)^12 − 1: 7 % TIN → 7,229 %', () => {
    const r = calcularPrestamo({ importe: 10_000, tin: 0.07, meses: 60 });
    expect(r.tae).toBeCloseTo(Math.pow(1 + 0.07 / 12, 12) - 1, 10);
    expect(r.tae * 100).toBeCloseTo(7.229, 3);
  });
  it('coincide con la fórmula sin comisiones para varios tipos y plazos', () => {
    for (const tin of [0.0001, 0.02, 0.0599, 0.12, 0.25, 0.5]) {
      for (const meses of [1, 7, 60, 240]) {
        expect(calcularPrestamo({ importe: 15_000, tin, meses }).tae).toBeCloseTo(anualizar(tin / 12), 9);
      }
    }
  });
  it('con comisión de apertura del 1 % (se reciben 9.900 €) → 7,680 %', () => {
    const r = calcularPrestamo({ importe: 10_000, tin: 0.07, meses: 60, comisionApertura: 0.01 });
    expect(r.comision).toBe(100);
    expect(r.importeNeto).toBe(9_900);
    expect(r.tae * 100).toBeCloseTo(7.68, 3);
  });
  it('tipo 0 % sin comisión → TAE 0 %; con comisión → TAE positiva', () => {
    expect(calcularPrestamo({ importe: 12_000, tin: 0, meses: 12 }).tae).toBe(0);
    expect(calcularPrestamo({ importe: 12_000, tin: 0, meses: 12, comisionApertura: 0.02 }).tae).toBeGreaterThan(0.03);
  });
  it('un solo pago: recibir 100 € y devolver 101 € al mes es un 1 % mensual → 12,68 % TAE', () => {
    expect(tirMensual(100, [101])).toBeCloseTo(0.01, 12);
    expect(calcularTAE(100, [101]) * 100).toBeCloseTo(12.68, 2);
  });
  it('rechaza flujos sin sentido', () => {
    expect(() => tirMensual(0, [10])).toThrow(RangeError);
    expect(() => tirMensual(100, [])).toThrow(RangeError);
  });
});

describe('calcularPrestamo', () => {
  it('10.000 € al 7 % a 5 años: cuota 198,01 €, intereses 1.880,72 €', () => {
    const r = calcularPrestamo({ importe: 10_000, tin: 0.07, meses: 60 });
    expect(r.cuota).toBeCloseTo(198.01, 2);
    expect(r.totalIntereses).toBeCloseTo(1_880.72, 2);
    expect(r.totalPagado).toBeCloseTo(11_880.72, 2);
    expect(r.costeTotal).toBeCloseTo(1_880.72, 2);
  });
  it('plazo de 1 mes: una sola cuota de 10.058,33 €', () => {
    const r = calcularPrestamo({ importe: 10_000, tin: 0.07, meses: 1 });
    expect(r.cuadro).toHaveLength(1);
    expect(r.cuadro[0].cuota).toBeCloseTo(10_058.33, 2);
    expect(r.totalIntereses).toBeCloseTo(58.33, 2);
  });
  it('importe grande: 10 M€ al 4,5 % a 240 meses, totales coherentes', () => {
    const r = calcularPrestamo({ importe: 10_000_000, tin: 0.045, meses: 240 });
    expect(r.cuota).toBeCloseTo(63_264.94, 2);
    expect(r.totalPagado).toBeCloseTo(r.cuota * 240, 4);
  });
  it('valida entradas', () => {
    expect(validarPrestamo({ importe: 0, tin: 0.07, meses: 60 }).importe).toBe('El importe debe ser mayor que 0 €.');
    expect(validarPrestamo({ importe: 1000, tin: -0.07, meses: 60 }).tin).toBe('El TIN no puede ser negativo.');
    expect(validarPrestamo({ importe: 1000, tin: 0.07, meses: 0 }).meses).toBe('El plazo en meses debe ser como mínimo 1.');
    expect(validarPrestamo({ importe: 1000, tin: 0.07, meses: 241 }).meses).toBe('El plazo en meses debe ser como máximo 240.');
    expect(validarPrestamo({ importe: 1000, tin: 0.07, meses: 12, comisionApertura: 0.2 }).comisionApertura).toBe('La comisión de apertura debe ser como máximo 10 %.');
  });
});
