import { useMemo } from 'preact/hooks';
import { calcularPrestamo, validarPrestamo } from '../../lib/calc/prestamo';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import CuadroAmortizacion, { puntosDeCuadro } from './CuadroAmortizacion';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';
import { BotonCopiar, CampoTexto, DesplegablePerezoso, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { c: '10000', t: '7', m: '60', ap: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', m: 'num', ap: 'num' };

export default function CalculadoraPrestamo({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo(() => ({
    importe: parseNumero(s.c),
    tin: parseNumero(s.t) / 100,
    meses: parseNumero(s.m),
    comisionApertura: s.ap.trim() === '' ? 0 : parseNumero(s.ap) / 100,
  }), [s]);
  const errores = useMemo(() => validarPrestamo(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularPrestamo(entrada)), [entrada, errores]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de préstamo personal">
      <div class="calc__campos">
        <CampoTexto id="pp-c" etiqueta="Importe" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.importe} />
        <CampoTexto id="pp-t" etiqueta="TIN" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tin} />
        <CampoTexto id="pp-m" etiqueta="Plazo" sufijo="meses" valor={s.m} onInput={cambia('m')} error={errores.meses} entero
          ayuda={!errores.meses && entrada.meses >= 12 ? `Son ${duracion(entrada.meses)}.` : undefined} />
        <CampoTexto id="pp-ap" etiqueta="Comisión de apertura" sufijo="%" valor={s.ap} onInput={cambia('ap')} error={errores.comisionApertura} placeholder="0" />
      </div>
      <Resultado
        etiqueta="Cuota mensual"
        cifra={r ? euros(r.cuota) : undefined}
        partidas={r ? [
          { nombre: 'TAE', valor: porcentaje(r.tae) },
          { nombre: 'Intereses totales', valor: euros(r.totalIntereses), punto: 'intereses' },
          ...(r.comision > 0 ? [{ nombre: 'Comisión de apertura', valor: euros(r.comision) }] : []),
          { nombre: 'Total a pagar', valor: euros(r.totalPagado + r.comision) },
        ] : []}
        anuncio={r ? `Cuota mensual: ${euros(r.cuota)}. TAE: ${porcentaje(r.tae)}. Intereses totales: ${euros(r.totalIntereses)}.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Gráfica: capital devuelto e intereses pagados</summary>
            <div class="desplegable__cuerpo">
              <GraficaAportadoIntereses
                puntos={puntosDeCuadro(r.cuadro)}
                nombres={['Capital devuelto', 'Intereses pagados']}
                rotuloX={(m) => `Mes ${m}`}
                rotuloInicio="Inicio"
                descripcion={`Gráfica de áreas. Al terminar habrás devuelto ${euros(entrada.importe)} de capital y pagado ${euros(r.totalIntereses)} de intereses. Los datos completos están en el cuadro de amortización.`}
              />
            </div>
          </details>
          <DesplegablePerezoso titulo="Cuadro de amortización">
            {() => <CuadroAmortizacion filas={r.cuadro} />}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
