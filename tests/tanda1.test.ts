import { describe, expect, it } from 'vitest';
import { calcularCuenta, validarCuenta, type EntradaCuenta } from '../src/lib/calc/cuenta';
import { compararAmortizacion, validarComparativa } from '../src/lib/calc/hipoteca';
import { convertirTipo, validarConversion } from '../src/lib/calc/tintae';

describe('amortización anticipada de una hipoteca en marcha', () => {
  const base = { capitalPendiente: 150_000, tin: 0.03, mesesRestantes: 240, importe: 10_000 };
  it('150.000 € al 3 % con 240 cuotas pendientes, amortizando 10.000 €', () => {
    const r = compararAmortizacion(base);
    expect(r.cuotaActual).toBeCloseTo(831.9, 2);
    expect(r.interesesSinAmortizar).toBeCloseTo(49_655.14, 2);
    expect(r.reducirCuota.nuevaCuota).toBeCloseTo(776.44, 2);
    expect(r.reducirCuota.ahorroIntereses).toBeCloseTo(3_310.34, 2);
    expect(r.reducirPlazo.cuotasRestantes).toBe(219);
    expect(r.reducirPlazo.mesesAhorrados).toBe(21);
    expect(r.reducirPlazo.ahorroIntereses).toBeCloseTo(7_748.79, 2);
    expect(r.comision).toBe(0);
  });
  it('la comisión se resta del ahorro: 0,5 % de 10.000 € son 50 €', () => {
    const r = compararAmortizacion({ ...base, comision: 0.005 });
    expect(r.comision).toBeCloseTo(50, 10);
    expect(r.reducirCuota.ahorroNeto).toBeCloseTo(3_260.34, 2);
    expect(r.reducirPlazo.ahorroNeto).toBeCloseTo(7_698.79, 2);
  });
  it('tipo 0 %: no hay intereses que ahorrar y la comisión deja el ahorro neto en negativo', () => {
    const r = compararAmortizacion({ ...base, tin: 0, comision: 0.01 });
    expect(r.reducirPlazo.ahorroIntereses).toBe(0);
    expect(r.reducirPlazo.ahorroNeto).toBeCloseTo(-100, 10);
    expect(r.reducirPlazo.mesesAhorrados).toBe(16);
  });
  it('amortizar todo el capital pendiente ahorra todos los intereses', () => {
    const r = compararAmortizacion({ ...base, importe: 150_000 });
    expect(r.reducirPlazo.cuotasRestantes).toBe(0);
    expect(r.reducirPlazo.ahorroIntereses).toBeCloseTo(49_655.14, 2);
  });
  it('valida entradas', () => {
    expect(validarComparativa({ ...base, importe: 200_000 }).importe).toBe('El importe supera el capital pendiente (150.000 €).');
    expect(validarComparativa({ ...base, capitalPendiente: 0 }).capitalPendiente).toBe('El capital pendiente debe ser mayor que 0 €.');
    expect(validarComparativa({ ...base, mesesRestantes: 0 }).mesesRestantes).toBe('El plazo restante debe ser como mínimo 1.');
    expect(validarComparativa({ ...base, comision: 0.2 }).comision).toBe('La comisión debe ser como máximo 5 %.');
    expect(validarComparativa(base)).toEqual({});
  });
});

describe('conversión entre TIN y TAE', () => {
  it('7 % TIN con pagos mensuales → 7,229 % TAE', () => {
    const r = convertirTipo({ tipo: 0.07, sentido: 'tin-a-tae', pagosPorAnio: 12 });
    expect(r.tae * 100).toBeCloseTo(7.229, 3);
    expect(r.tipoPorPeriodo).toBeCloseTo(0.07 / 12, 12);
  });
  it('7 % TIN con pagos trimestrales → 7,186 % TAE', () => {
    expect(convertirTipo({ tipo: 0.07, sentido: 'tin-a-tae', pagosPorAnio: 4 }).tae * 100).toBeCloseTo(7.186, 3);
  });
  it('3 % TAE con liquidación mensual → 2,960 % TIN; semestral → 2,978 %', () => {
    expect(convertirTipo({ tipo: 0.03, sentido: 'tae-a-tin', pagosPorAnio: 12 }).tin * 100).toBeCloseTo(2.96, 3);
    expect(convertirTipo({ tipo: 0.03, sentido: 'tae-a-tin', pagosPorAnio: 2 }).tin * 100).toBeCloseTo(2.978, 3);
  });
  it('con un solo pago al año TIN y TAE coinciden', () => {
    const r = convertirTipo({ tipo: 0.05, sentido: 'tin-a-tae', pagosPorAnio: 1 });
    expect(r.tae).toBeCloseTo(0.05, 12);
  });
  it('ida y vuelta devuelve el tipo original', () => {
    for (const n of [1, 2, 4, 12] as const) {
      const tae = convertirTipo({ tipo: 0.0899, sentido: 'tin-a-tae', pagosPorAnio: n }).tae;
      expect(convertirTipo({ tipo: tae, sentido: 'tae-a-tin', pagosPorAnio: n }).tin).toBeCloseTo(0.0899, 12);
    }
  });
  it('tipo 0 % y validación', () => {
    expect(convertirTipo({ tipo: 0, sentido: 'tin-a-tae', pagosPorAnio: 12 }).tae).toBe(0);
    expect(validarConversion({ tipo: -0.01, sentido: 'tin-a-tae', pagosPorAnio: 12 }).tipo).toBe('El tipo de interés no puede ser negativo.');
    expect(validarConversion({ tipo: 0.6, sentido: 'tin-a-tae', pagosPorAnio: 12 }).tipo).toBe('El tipo de interés debe ser como máximo 50 %.');
  });
});

describe('cuenta remunerada', () => {
  const base: EntradaCuenta = { saldo: 10_000, tipo: 0.02, claseTipo: 'TIN', meses: 12, retencion: 0.19 };
  it('10.000 € al 2 % TIN durante 12 meses: 201,49 € brutos, 38,28 € de retención, 163,21 € netos', () => {
    const r = calcularCuenta(base);
    expect(r.interesesBrutos).toBeCloseTo(201.49, 2);
    expect(r.retencion).toBeCloseTo(38.28, 2);
    expect(r.interesesNetos).toBeCloseTo(163.21, 2);
    expect(r.saldoFinal).toBeCloseTo(10_163.21, 2);
    expect(r.saldoFinal).toBeCloseTo(10_000 * Math.pow(1 + (0.02 / 12) * 0.81, 12), 8);
    expect(r.tabla).toHaveLength(12);
  });
  it('con TAE y sin retención, 12 meses al 2 % dan exactamente 200 €', () => {
    const r = calcularCuenta({ ...base, claseTipo: 'TAE', retencion: 0 });
    expect(r.interesesBrutos).toBeCloseTo(200, 8);
  });
  it('saldo máximo remunerado: 50.000 € con límite de 30.000 € al 2,4 % → 60 € brutos al mes', () => {
    const r = calcularCuenta({ ...base, saldo: 50_000, tipo: 0.024, limiteRemunerado: 30_000 });
    expect(r.tabla[0].interesBruto).toBeCloseTo(60, 10);
    expect(r.interesesBrutos).toBeCloseTo(720, 8);
    expect(r.interesesNetos).toBeCloseTo(583.2, 8);
    expect(r.saldoFinal).toBeCloseTo(50_583.2, 8);
  });
  it('con aportación: 5.000 € más 300 € al mes, 24 meses al 2 % → 277,43 € netos', () => {
    const r = calcularCuenta({ ...base, saldo: 5_000, meses: 24, aportacionMensual: 300 });
    expect(r.interesesBrutos).toBeCloseTo(342.51, 2);
    expect(r.interesesNetos).toBeCloseTo(277.43, 2);
    expect(r.totalAportado).toBe(12_200);
    expect(r.saldoFinal).toBeCloseTo(12_477.43, 2);
  });
  it('tipo 0 %, plazo de 1 mes e importe grande', () => {
    expect(calcularCuenta({ ...base, tipo: 0 }).interesesBrutos).toBe(0);
    expect(calcularCuenta({ ...base, meses: 1 }).interesesBrutos).toBeCloseTo(16.67, 2);
    expect(calcularCuenta({ ...base, saldo: 100_000_000, meses: 1 }).interesesBrutos).toBeCloseTo(166_666.67, 2);
  });
  it('valida entradas', () => {
    expect(validarCuenta({ ...base, saldo: -1 }).saldo).toBe('El saldo no puede ser negativo.');
    expect(validarCuenta({ ...base, saldo: 0 }).saldo).toMatch(/mayor que cero/);
    expect(validarCuenta({ ...base, meses: 121 }).meses).toBe('El número de meses debe ser como máximo 120.');
    expect(validarCuenta(base)).toEqual({});
  });
});
