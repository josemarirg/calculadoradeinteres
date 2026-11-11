import { describe, expect, it } from 'vitest';
import { calcularHipoteca, simularAmortizacionAnticipada, validarAnticipada, validarHipoteca, type EntradaAnticipada, type EntradaHipoteca } from '../src/lib/calc/hipoteca';

const fija: EntradaHipoteca = { precio: 250_000, ahorro: 50_000, anios: 30, modalidad: 'fija', tin: 0.03 };

describe('cuota de hipoteca', () => {
  it('200.000 € al 3 % a 30 años → 843,21 €/mes, intereses 103.554,90 €, TAE 3,042 %', () => {
    const r = calcularHipoteca(fija);
    expect(r.capital).toBe(200_000);
    expect(r.financiacion).toBe(0.8);
    expect(r.meses).toBe(360);
    expect(r.cuota).toBeCloseTo(843.21, 2);
    expect(r.totalIntereses).toBeCloseTo(103_554.9, 2);
    expect(r.totalPagado).toBeCloseTo(303_554.9, 2);
    expect(r.taeOrientativa * 100).toBeCloseTo(3.042, 3);
    expect(r.cuadro[359].saldo).toBe(0);
  });
  it('variable: Euríbor 2,25 % + 0,75 % equivale a la fija al 3 %', () => {
    const r = calcularHipoteca({ ...fija, modalidad: 'variable', tin: undefined, euribor: 0.0225, diferencial: 0.0075 });
    expect(r.tinAplicado).toBeCloseTo(0.03, 12);
    expect(r.cuota).toBeCloseTo(843.21, 2);
  });
  it('variable con Euríbor negativo: suelo en 0 % y cuota = capital / meses', () => {
    const r = calcularHipoteca({ ...fija, modalidad: 'variable', euribor: -0.005, diferencial: 0.002 });
    expect(r.tinAplicado).toBe(0);
    expect(r.cuota).toBeCloseTo(200_000 / 360, 10);
    expect(r.totalIntereses).toBe(0);
  });
  it('importe grande: 10 M€ al 4,5 % a 40 años → 44.956,28 €/mes, intereses 11.579.016,19 €', () => {
    const r = calcularHipoteca({ precio: 12_500_000, ahorro: 2_500_000, anios: 40, modalidad: 'fija', tin: 0.045 });
    expect(r.cuota).toBeCloseTo(44_956.28, 2);
    expect(r.totalIntereses).toBeCloseTo(11_579_016.19, 2);
  });
  it('valida entradas', () => {
    expect(validarHipoteca({ ...fija, ahorro: 250_000 }).ahorro).toMatch(/menor que el precio/);
    expect(validarHipoteca({ ...fija, precio: -1 }).precio).toBe('El precio de la vivienda no puede ser negativo.');
    expect(validarHipoteca({ ...fija, anios: 41 }).anios).toBe('El plazo en años debe ser como máximo 40.');
    expect(validarHipoteca({ ...fija, tin: undefined }).tin).toBe('El TIN debe ser un número.');
    expect(validarHipoteca({ ...fija, modalidad: 'variable', euribor: undefined, diferencial: 0.01 }).euribor).toBe('El Euríbor debe ser un número.');
    expect(validarHipoteca({ ...fija, modalidad: 'variable', euribor: -0.05, diferencial: 0.01 }).euribor).toBe('El Euríbor debe ser como mínimo -1 %.');
  });
});

describe('amortización anticipada', () => {
  const base: EntradaAnticipada = { capital: 200_000, tin: 0.03, meses: 360, importe: 20_000, trasCuota: 60, modo: 'cuota' };

  it('reducir cuota: 20.000 € tras la cuota 60 → cuota de 748,37 € y 8.452,68 € menos de intereses', () => {
    const r = simularAmortizacionAnticipada(base);
    expect(r.saldoAntes).toBeCloseTo(177_812.73, 2);
    expect(r.saldoDespues).toBeCloseTo(157_812.73, 2);
    expect(r.cuotaOriginal).toBeCloseTo(843.21, 2);
    expect(r.nuevaCuota).toBeCloseTo(748.37, 2);
    expect(r.cuotasRestantes).toBe(300);
    expect(r.mesesAhorrados).toBe(0);
    expect(r.interesesConAmortizar).toBeCloseTo(95_102.23, 2);
    expect(r.ahorroIntereses).toBeCloseTo(8_452.68, 2);
    expect(r.cuadro).toHaveLength(360);
    expect(r.cuadro[359].saldo).toBe(0);
  });

  it('reducir plazo: quedan 253 cuotas en vez de 300 y se ahorran 19.900,22 € de intereses', () => {
    const r = simularAmortizacionAnticipada({ ...base, modo: 'plazo' });
    expect(r.nuevaCuota).toBeCloseTo(843.21, 2);
    expect(r.cuotasRestantes).toBe(253);
    expect(r.mesesAhorrados).toBe(47);
    expect(r.interesesConAmortizar).toBeCloseTo(83_654.69, 2);
    expect(r.ahorroIntereses).toBeCloseTo(19_900.22, 2);
    const ultima = r.cuadro[r.cuadro.length - 1];
    expect(ultima.n).toBe(313);
    expect(ultima.saldo).toBe(0);
    expect(ultima.cuota).toBeLessThan(r.nuevaCuota);
  });

  it('en ambos modos se amortiza exactamente el capital: cuotas + pago extra = capital + intereses', () => {
    for (const modo of ['cuota', 'plazo'] as const) {
      const r = simularAmortizacionAnticipada({ ...base, modo });
      const pagado = r.cuadro.reduce((s, f) => s + f.cuota, 0) + base.importe;
      expect(pagado).toBeCloseTo(200_000 + r.interesesConAmortizar, 6);
    }
  });

  it('reducir plazo siempre ahorra más intereses que reducir cuota', () => {
    const a = simularAmortizacionAnticipada(base);
    const b = simularAmortizacionAnticipada({ ...base, modo: 'plazo' });
    expect(b.ahorroIntereses).toBeGreaterThan(a.ahorroIntereses);
  });

  it('amortizar todo el capital pendiente cancela la hipoteca', () => {
    const saldo = simularAmortizacionAnticipada(base).saldoAntes;
    const r = simularAmortizacionAnticipada({ ...base, importe: saldo });
    expect(r.cuotasRestantes).toBe(0);
    expect(r.mesesAhorrados).toBe(300);
    expect(r.cuadro).toHaveLength(60);
  });

  it('tipo 0 %: no hay intereses que ahorrar, pero baja la cuota o el plazo', () => {
    const cuota = simularAmortizacionAnticipada({ capital: 120_000, tin: 0, meses: 120, importe: 12_000, trasCuota: 0, modo: 'cuota' });
    expect(cuota.nuevaCuota).toBeCloseTo(900, 10);
    expect(cuota.ahorroIntereses).toBe(0);
    const plazo = simularAmortizacionAnticipada({ capital: 120_000, tin: 0, meses: 120, importe: 12_000, trasCuota: 0, modo: 'plazo' });
    expect(plazo.cuotasRestantes).toBe(108);
  });

  it('valida entradas', () => {
    expect(validarAnticipada({ ...base, importe: 180_000 }).importe).toBe('El importe supera el capital pendiente en ese momento (177.812,73 €).');
    expect(validarAnticipada({ ...base, importe: 0 }).importe).toBe('El importe que amortizas debe ser mayor que 0 €.');
    expect(validarAnticipada({ ...base, trasCuota: 360 }).trasCuota).toBe('La cuota tras la que amortizas debe ser como máximo 359.');
  });
});
