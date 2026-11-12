import { describe, expect, it } from 'vitest';
import { calcularDeudas, simularPlan, validarDeudas, type Deuda } from '../src/lib/calc/deudas';
import { calcularFijaVariable, validarFijaVariable } from '../src/lib/calc/fijavariable';
import { calcularFire, validarFire, type EntradaFire } from '../src/lib/calc/fire';
import { calcularFondos, validarFondos, type EntradaFondos } from '../src/lib/calc/fondos';
import { calcularGastosCompra, validarGastosCompra, type EntradaGastosCompra } from '../src/lib/calc/gastoscompra';
import { calcularIrpfAhorro, cuotaAhorro, validarIrpfAhorro } from '../src/lib/calc/irpfahorro';
import { calcularLetras, precioDesdeTipo, tipoDesdePrecio, validarLetras, type EntradaLetras } from '../src/lib/calc/letras';
import { calcularPensiones, validarPensiones, type EntradaPensiones } from '../src/lib/calc/pensiones';
import { calcularPrestamo } from '../src/lib/calc/prestamo';
import { calcularRevolving, validarRevolving, type EntradaRevolving } from '../src/lib/calc/revolving';
import { FISCAL } from '../src/config/fiscal';

const TRAMOS = FISCAL.tramosAhorro.valor;

describe('Letras del Tesoro', () => {
  it('reproduce los resultados de subasta del BOE (BOE-A-2025-5905)', () => {
    // 9 meses, 266 días: precio mínimo 98,343 ↔ tipo 2,281 %; precio medio 98,352 ↔ 2,269 %.
    expect(tipoDesdePrecio(98.343, 266) * 100).toBeCloseTo(2.281, 2);
    expect(tipoDesdePrecio(98.352, 266) * 100).toBeCloseTo(2.269, 2);
    // 3 meses, 84 días: precio mínimo 99,448 ↔ tipo 2,379 %.
    expect(tipoDesdePrecio(99.448, 84) * 100).toBeCloseTo(2.379, 2);
    expect(precioDesdeTipo(0.02281, 266)).toBeCloseTo(98.343, 2);
  });
  const base: EntradaLetras = { nominal: 10_000, dias: 364, modo: 'tipo', tipo: 0.02, tipoIrpf: 0.19 };
  it('10.000 € nominales a 364 días al 2 %: se pagan 9.801,79 € y se ganan 198,21 €', () => {
    const r = calcularLetras(base);
    expect(r.precio).toBeCloseTo(98.018, 3);
    expect(r.importeInvertido).toBeCloseTo(9_801.79, 2);
    expect(r.rendimientoBruto).toBeCloseTo(198.21, 2);
    expect(r.irpf).toBeCloseTo(37.66, 2);
    expect(r.rendimientoTrasImpuestos).toBeCloseTo(160.55, 2);
    expect(r.taeEquivalente * 100).toBeCloseTo(2.028, 3);
  });
  it('las comisiones bajan el rendimiento y el tipo efectivo, no el impuesto estimado', () => {
    const r = calcularLetras({ ...base, comisiones: 15 });
    expect(r.rendimientoNeto).toBeCloseTo(183.21, 2);
    expect(r.tipoTrasComisiones * 100).toBeCloseTo(1.849, 3);
    expect(r.irpf).toBeCloseTo(37.66, 2);
  });
  it('precio y tipo son inversos; tipo 0 % → precio 100', () => {
    const r = calcularLetras({ nominal: 1_000, dias: 182, modo: 'precio', precio: 99 });
    expect(precioDesdeTipo(r.tipo, 182)).toBeCloseTo(99, 10);
    expect(calcularLetras({ ...base, tipo: 0 }).rendimientoBruto).toBe(0);
  });
  it('valida entradas', () => {
    expect(validarLetras({ ...base, nominal: 1_500 }).nominal).toMatch(/múltiplo de 1\.000/);
    expect(validarLetras({ ...base, nominal: 500 }).nominal).toBe('El importe nominal debe ser como mínimo 1.000 €.');
    expect(validarLetras({ ...base, dias: 400 }).dias).toBe('El plazo en días debe ser como máximo 376.');
    expect(validarLetras({ nominal: 1_000, dias: 90, modo: 'precio' }).precio).toBe('El precio debe ser un número.');
    expect(validarLetras(base)).toEqual({});
  });
});

describe('tarjeta revolving', () => {
  const base: EntradaRevolving = { saldo: 3_000, tipo: 0.2, claseTipo: 'TIN', cuota: 75 };
  it('3.000 € al 20 % TIN con 75 € al mes: 67 cuotas y 1.984,99 € de intereses', () => {
    const r = calcularRevolving(base);
    expect(r.meses).toBe(67);
    expect(r.interesPrimerMes).toBeCloseTo(50, 10);
    expect(r.amortizacionPrimerMes).toBeCloseTo(25, 10);
    expect(r.totalIntereses).toBeCloseTo(1_984.99, 2);
    expect(r.tae * 100).toBeCloseTo(21.939, 3);
    expect(r.cuadro[66].saldo).toBe(0);
    expect(r.cuadro.reduce((s, f) => s + f.amortizacion, 0)).toBeCloseTo(3_000, 6);
  });
  it('doblar la cuota a 150 € lo deja en 25 cuotas y 679,82 € de intereses', () => {
    const r = calcularRevolving({ ...base, cuota: 150 });
    expect(r.meses).toBe(25);
    expect(r.totalIntereses).toBeCloseTo(679.82, 2);
  });
  it('las alternativas coinciden con un préstamo al mismo TIN', () => {
    const r = calcularRevolving(base);
    const p = calcularPrestamo({ importe: 3_000, tin: 0.2, meses: 24 });
    expect(r.alternativas[1].cuota).toBeCloseTo(p.cuota, 8);
    expect(r.alternativas[1].intereses).toBeCloseTo(p.totalIntereses, 6);
  });
  it('tipo 0 %, TAE como dato y cuota que liquida en un mes', () => {
    expect(calcularRevolving({ saldo: 1_200, tipo: 0, claseTipo: 'TIN', cuota: 100 }).meses).toBe(12);
    expect(calcularRevolving({ ...base, tipo: 0.2, claseTipo: 'TAE' }).tae).toBeCloseTo(0.2, 12);
    const r = calcularRevolving({ ...base, cuota: 5_000 });
    expect(r.meses).toBe(1);
    expect(r.totalPagado).toBeCloseTo(3_050, 8);
  });
  it('valida entradas: la cuota debe superar los intereses', () => {
    expect(validarRevolving({ ...base, cuota: 50 }).cuota).toBe('Con esa cuota la deuda no baja: solo los intereses del primer mes son 50 €.');
    expect(validarRevolving({ ...base, cuota: 50.000001 }).cuota).toMatch(/más de 50 años/);
    expect(validarRevolving({ ...base, saldo: 0 }).saldo).toBe('La deuda debe ser mayor que 0 €.');
    expect(validarRevolving(base)).toEqual({});
  });
});

describe('liquidar deudas', () => {
  const deudas: Deuda[] = [
    { saldo: 3_000, tin: 0.2, cuota: 90 },
    { saldo: 8_000, tin: 0.07, cuota: 160 },
    { saldo: 1_000, tin: 0.1, cuota: 50 },
  ];
  it('con 100 € extra: 35 meses; la avalancha paga menos intereses que la bola de nieve', () => {
    const r = calcularDeudas({ deudas, extra: 100, metodo: 'avalancha' });
    expect(r.deudaTotal).toBe(12_000);
    expect(r.presupuestoMensual).toBe(400);
    expect(r.avalancha.meses).toBe(35);
    expect(r.avalancha.intereses).toBeCloseTo(1_652.27, 2);
    expect(r.bola.intereses).toBeCloseTo(1_733.38, 2);
    expect(r.avalancha.intereses).toBeLessThan(r.bola.intereses);
    expect(r.avalancha.orden.map((o) => o.indice)).toEqual([0, 2, 1]);
    expect(r.bola.orden.map((o) => o.indice)).toEqual([2, 0, 1]);
    expect(r.elegido).toBe(r.avalancha);
  });
  it('solo con las cuotas actuales: 60 meses y 3.000,08 € de intereses', () => {
    const r = calcularDeudas({ deudas, extra: 100, metodo: 'bola' });
    expect(r.soloCuotas?.meses).toBe(60);
    expect(r.soloCuotas?.intereses).toBeCloseTo(3_000.08, 2);
    expect(r.elegido).toBe(r.bola);
  });
  it('una deuda sola equivale a su préstamo: 10.000 € al 7 % con la cuota de 60 meses', () => {
    const p = calcularPrestamo({ importe: 10_000, tin: 0.07, meses: 60 });
    const plan = simularPlan([{ saldo: 10_000, tin: 0.07, cuota: p.cuota }], 0, 'avalancha')!;
    expect(plan.meses).toBe(60);
    expect(plan.intereses).toBeCloseTo(p.totalIntereses, 6);
  });
  it('tipo 0 %: 1.200 € con 100 € de cuota y 100 € extra se liquidan en 6 meses', () => {
    const r = calcularDeudas({ deudas: [{ saldo: 1_200, tin: 0, cuota: 100 }], extra: 100, metodo: 'bola' });
    expect(r.elegido.meses).toBe(6);
    expect(r.elegido.intereses).toBe(0);
    expect(r.soloCuotas?.meses).toBe(12);
  });
  it('valida entradas y detecta deudas que no se liquidan', () => {
    expect(validarDeudas({ deudas: [], extra: 0, metodo: 'bola' }).deudas).toBe('Indica al menos una deuda.');
    expect(validarDeudas({ deudas: [{ saldo: 0, tin: 0.1, cuota: 50 }], extra: 0, metodo: 'bola' }).saldo1).toBe('El saldo pendiente debe ser mayor que 0 €.');
    expect(validarDeudas({ deudas: [{ saldo: 10_000, tin: 0.24, cuota: 100 }], extra: 0, metodo: 'bola' }).extra).toMatch(/no llegan a liquidarse/);
    expect(validarDeudas({ deudas, extra: 0, metodo: 'avalancha' })).toEqual({});
    expect(calcularDeudas({ deudas: [{ saldo: 10_000, tin: 0.24, cuota: 150 }, { saldo: 500, tin: 0.05, cuota: 100 }], extra: 0, metodo: 'bola' }).soloCuotas).toBeNull();
  });
});

describe('hipoteca fija o variable', () => {
  const base = { capital: 200_000, anios: 30, tinFijo: 0.03, diferencial: 0.007 };
  it('200.000 € a 30 años: fija al 3 % frente a Euríbor + 0,7 %', () => {
    const r = calcularFijaVariable({ ...base, euribor: 0.025 });
    expect(r.fija.cuota).toBeCloseTo(843.21, 2);
    expect(r.fija.intereses).toBeCloseTo(103_554.9, 1);
    expect(r.euriborEquilibrio).toBeCloseTo(0.023, 12);
    expect(r.variable?.tin).toBeCloseTo(0.032, 12);
    expect(r.variable?.cuota).toBeCloseTo(864.93, 2);
    expect(r.variable?.difCuota).toBeCloseTo(21.73, 2);
    expect(r.variable?.difIntereses).toBeCloseTo(7_821.24, 2);
  });
  it('en el Euríbor de equilibrio ambas cuestan lo mismo', () => {
    const r = calcularFijaVariable({ ...base, euribor: 0.023 });
    expect(r.variable?.difCuota).toBeCloseTo(0, 8);
    expect(r.variable?.difIntereses).toBeCloseTo(0, 6);
  });
  it('escenarios del 0 % al 5 %; sin Euríbor no hay escenario propio; suelo en 0 %', () => {
    const r = calcularFijaVariable(base);
    expect(r.variable).toBeNull();
    expect(r.escenarios.map((x) => x.euribor)).toEqual([0, 0.01, 0.02, 0.03, 0.04, 0.05]);
    expect(r.escenarios[2].difCuota).toBeLessThan(0);
    expect(r.escenarios[3].difCuota).toBeGreaterThan(0);
    const negativo = calcularFijaVariable({ ...base, euribor: -0.01 });
    expect(negativo.variable?.tin).toBe(0);
    expect(negativo.variable?.intereses).toBeCloseTo(0, 6);
  });
  it('valida entradas', () => {
    expect(validarFijaVariable({ ...base, capital: 0 }).capital).toBe('El importe de la hipoteca debe ser mayor que 0 €.');
    expect(validarFijaVariable({ ...base, anios: 41 }).anios).toBe('El plazo en años debe ser como máximo 40.');
    expect(validarFijaVariable({ ...base, euribor: 0.2 }).euribor).toBe('El Euríbor debe ser como máximo 15 %.');
    expect(validarFijaVariable(base)).toEqual({});
  });
});

describe('gastos de compra de una vivienda', () => {
  const base: EntradaGastosCompra = { precio: 200_000, vivienda: 'usada', tipoImpuesto: 0.07, gastosFijos: 1_500, entrada: 0.2 };
  it('usada de 200.000 € con ITP del 7 %: 14.000 € de impuesto y 15.500 € de gastos', () => {
    const r = calcularGastosCompra(base);
    expect(r.impuesto).toBeCloseTo(14_000, 8);
    expect(r.ajd).toBe(0);
    expect(r.totalGastos).toBeCloseTo(15_500, 8);
    expect(r.porcentaje).toBeCloseTo(0.0775, 12);
    expect(r.entrada).toBe(40_000);
    expect(r.hipoteca).toBe(160_000);
    expect(r.ahorroNecesario).toBeCloseTo(55_500, 8);
    expect(r.costeTotal).toBeCloseTo(215_500, 8);
  });
  it('nueva: IVA del 10 % más AJD del 1,2 % y otros gastos', () => {
    const r = calcularGastosCompra({ ...base, vivienda: 'nueva', tipoImpuesto: 0.1, tipoAjd: 0.012, otros: 400 });
    expect(r.impuesto).toBeCloseTo(20_000, 8);
    expect(r.ajd).toBeCloseTo(2_400, 8);
    expect(r.totalGastos).toBeCloseTo(24_300, 8);
    expect(r.ahorroNecesario).toBeCloseTo(64_300, 8);
  });
  it('en vivienda usada el AJD no se aplica aunque se indique', () => {
    expect(calcularGastosCompra({ ...base, tipoAjd: 0.015 }).ajd).toBe(0);
  });
  it('valida entradas', () => {
    expect(validarGastosCompra({ ...base, precio: 0 }).precio).toBe('El precio de la vivienda debe ser mayor que 0 €.');
    expect(validarGastosCompra({ ...base, tipoImpuesto: 0.3 }).tipoImpuesto).toBe('El ITP debe ser como máximo 25 %.');
    expect(validarGastosCompra({ ...base, vivienda: 'nueva' }).tipoAjd).toBe('El tipo de AJD debe ser un número.');
    expect(validarGastosCompra({ ...base, entrada: 1.2 }).entrada).toBe('La entrada debe ser como máximo 100 %.');
    expect(validarGastosCompra(base)).toEqual({});
  });
  it('la tabla de comunidades de la configuración tiene tipos plausibles', () => {
    const c = FISCAL.compraVivienda.valor.comunidades;
    expect(c).toHaveLength(18);
    expect(new Set(c.map((x) => x.id)).size).toBe(18);
    for (const x of c) {
      expect(x.itp).toBeGreaterThanOrEqual(0.03);
      expect(x.itp).toBeLessThan(0.11);
      if (x.ajd !== null) expect(x.ajd).toBeLessThanOrEqual(0.02);
    }
  });
});

describe('IRPF del ahorro', () => {
  it('10.000 € de base: 6.000 al 19 % y 4.000 al 21 % → 1.980 €', () => {
    const r = calcularIrpfAhorro({ rendimientos: 2_000, ganancias: 8_000, retenciones: 380, tramos: TRAMOS });
    expect(r.base).toBe(10_000);
    expect(r.cuota).toBeCloseTo(1_980, 8);
    expect(r.tipoMedio).toBeCloseTo(0.198, 12);
    expect(r.marginal).toBe(0.21);
    expect(r.diferencia).toBeCloseTo(1_600, 8);
    expect(r.neto).toBeCloseTo(8_020, 8);
  });
  it('350.000 € recorren los cinco tramos → 86.880 €', () => {
    const r = cuotaAhorro(350_000, TRAMOS);
    expect(r.desglose.map((f) => f.cuota)).toEqual([1_140, 9_240, 34_500, 27_000, 15_000]);
    expect(r.cuota).toBeCloseTo(86_880, 6);
    expect(r.marginal).toBe(0.3);
  });
  it('límites de tramo y base 0', () => {
    expect(cuotaAhorro(6_000, TRAMOS).cuota).toBeCloseTo(1_140, 8);
    expect(cuotaAhorro(6_000, TRAMOS).marginal).toBe(0.19);
    expect(cuotaAhorro(6_001, TRAMOS).marginal).toBe(0.21);
    expect(cuotaAhorro(0, TRAMOS).cuota).toBe(0);
  });
  it('si la retención supera la cuota, la diferencia es negativa (a devolver)', () => {
    const r = calcularIrpfAhorro({ rendimientos: 1_000, ganancias: 0, retenciones: 250, tramos: TRAMOS });
    expect(r.diferencia).toBeCloseTo(-60, 8);
  });
  it('valida entradas', () => {
    expect(validarIrpfAhorro({ rendimientos: 0, ganancias: 0, retenciones: 0, tramos: TRAMOS }).rendimientos).toMatch(/mayor que cero/);
    expect(validarIrpfAhorro({ rendimientos: -5, ganancias: 0, retenciones: 0, tramos: TRAMOS }).rendimientos).toBe('El importe de intereses y dividendos no puede ser negativo.');
  });
});

describe('fondos indexados', () => {
  const base: EntradaFondos = { capitalInicial: 10_000, aportacionMensual: 200, anios: 20, rentabilidad: 0.06, comision: 0.002, tramos: TRAMOS };
  it('10.000 € más 200 € al mes, 20 años al 6 % con un 0,2 % de comisiones', () => {
    const r = calcularFondos(base);
    expect(r.totalAportado).toBe(58_000);
    expect(r.valorFinal).toBeCloseTo(119_378.3, 1);
    expect(r.valorSinComisiones).toBeCloseTo(122_759.08, 2);
    expect(r.costeComisiones).toBeCloseTo(3_380.78, 2);
    expect(r.impuesto).toBeCloseTo(12_997.01, 2);
    expect(r.valorNeto).toBeCloseTo(106_381.29, 2);
    expect(r.tabla).toHaveLength(20);
  });
  it('con un 1,5 % de comisiones el coste sube a 22.972,54 €', () => {
    const r = calcularFondos({ ...base, comision: 0.015 });
    expect(r.valorFinal).toBeCloseTo(99_786.54, 2);
    expect(r.costeComisiones).toBeCloseTo(22_972.54, 2);
  });
  it('un año sin aportaciones ni comisiones: 10.000 € al 6 % → 10.600 €; impuesto 114 €', () => {
    const r = calcularFondos({ ...base, aportacionMensual: 0, anios: 1, comision: 0 });
    expect(r.valorFinal).toBeCloseTo(10_600, 8);
    expect(r.impuesto).toBeCloseTo(114, 8);
  });
  it('con pérdidas no hay impuesto; rentabilidad 0 % solo resta comisiones', () => {
    expect(calcularFondos({ ...base, rentabilidad: -0.05 }).impuesto).toBe(0);
    const r = calcularFondos({ ...base, rentabilidad: 0, aportacionMensual: 0, anios: 1, comision: 0.01 });
    expect(r.valorFinal).toBeCloseTo(9_900, 8);
  });
  it('valida entradas', () => {
    expect(validarFondos({ ...base, capitalInicial: 0, aportacionMensual: 0 }).capitalInicial).toMatch(/mayor que cero/);
    expect(validarFondos({ ...base, comision: 0.06 }).comision).toBe('La comisión debe ser como máximo 5 %.');
    expect(validarFondos(base)).toEqual({});
  });
});

describe('plan de pensiones', () => {
  const base: EntradaPensiones = { aportacionAnual: 1_500, anios: 25, rentabilidad: 0.04, comision: 0.01, tipoMarginal: 0.3, tipoRescate: 0.2, limiteAportacion: 10_000 };
  it('1.500 € al año, 25 años al 4 % con un 1 % de comisiones', () => {
    const r = calcularPensiones(base);
    expect(r.totalAportado).toBe(37_500);
    expect(r.capitalFinal).toBeCloseTo(54_402.59, 2);
    expect(r.ahorroFiscalAnual).toBeCloseTo(450, 10);
    expect(r.ahorroFiscalTotal).toBeCloseTo(11_250, 8);
    expect(r.impuestoRescate).toBeCloseTo(10_880.52, 2);
    expect(r.netoRescate).toBeCloseTo(43_522.07, 2);
    expect(r.saldoFiscal).toBeCloseTo(369.48, 2);
    expect(r.tipoRescateEquilibrio * 100).toBeCloseTo(20.68, 2);
  });
  it('coincide con la fórmula cerrada de una renta pospagable', () => {
    const g = 1.04 * 0.99 - 1;
    expect(calcularPensiones(base).capitalFinal).toBeCloseTo((1_500 * (Math.pow(1 + g, 25) - 1)) / g, 6);
  });
  it('rentabilidad 0 % sin comisiones: el capital es lo aportado', () => {
    const r = calcularPensiones({ ...base, rentabilidad: 0, comision: 0, anios: 1 });
    expect(r.capitalFinal).toBe(1_500);
    expect(r.ganancia).toBe(0);
  });
  it('valida entradas', () => {
    expect(validarPensiones({ ...base, aportacionAnual: 12_000 }).aportacionAnual).toBe('La aportación anual debe ser como máximo 10.000 €.');
    expect(validarPensiones({ ...base, aportacionAnual: 0 }).aportacionAnual).toBe('La aportación anual debe ser mayor que 0 €.');
    expect(validarPensiones(base)).toEqual({});
  });
});

describe('jubilación y FIRE', () => {
  const base: EntradaFire = { gastoAnual: 24_000, tasaRetirada: 0.04, patrimonio: 50_000, ahorroMensual: 1_000, rentabilidadReal: 0.04 };
  it('24.000 € de gasto al 4 %: objetivo de 600.000 €, 287 meses desde 50.000 € ahorrando 1.000 € al mes', () => {
    const r = calcularFire(base);
    expect(r.objetivo).toBeCloseTo(600_000, 6);
    expect(r.progreso).toBeCloseTo(1 / 12, 12);
    expect(r.meses).toBe(287);
    expect(r.falta).toBeCloseTo(550_000, 6);
    expect(r.rentaMensualActual).toBeCloseTo(166.67, 2);
    expect(r.tabla).toHaveLength(24);
    expect(r.tabla[23].saldo).toBeGreaterThanOrEqual(600_000);
  });
  it('sin rentabilidad: 600.000 € a 1.000 € al mes son 600 meses', () => {
    expect(calcularFire({ ...base, patrimonio: 0, rentabilidadReal: 0 }).meses).toBe(600);
  });
  it('objetivo ya alcanzado → 0 meses; sin ahorro ni rentabilidad → no se alcanza', () => {
    const r = calcularFire({ ...base, patrimonio: 700_000 });
    expect(r.meses).toBe(0);
    expect(r.falta).toBe(0);
    expect(calcularFire({ ...base, ahorroMensual: 0, rentabilidadReal: 0 }).meses).toBeNull();
  });
  it('valida entradas', () => {
    expect(validarFire({ ...base, gastoAnual: 0 }).gastoAnual).toBe('El gasto anual debe ser mayor que 0 €.');
    expect(validarFire({ ...base, tasaRetirada: 0.005 }).tasaRetirada).toBe('La tasa de retirada debe ser como mínimo 1 %.');
    expect(validarFire(base)).toEqual({});
  });
});

describe('ejemplo de la página «Liquidar deudas»', () => {
  it('6.000 € al 20 % y 2.000 € al 7 % con 100 € extra: avalancha 33 meses, bola de nieve 34', () => {
    const r = calcularDeudas({ deudas: [{ saldo: 6_000, tin: 0.2, cuota: 150 }, { saldo: 2_000, tin: 0.07, cuota: 60 }], extra: 100, metodo: 'avalancha' });
    expect(r.avalancha.meses).toBe(33);
    expect(r.avalancha.intereses).toBeCloseTo(1_951.26, 2);
    expect(r.bola.meses).toBe(34);
    expect(r.bola.intereses).toBeCloseTo(2_297.47, 2);
    expect(r.soloCuotas?.meses).toBe(67);
    expect(r.soloCuotas?.intereses).toBeCloseTo(4_200.5, 2);
  });
});
