import { useMemo } from 'preact/hooks';
import { calcularRevolving, validarRevolving, type EntradaRevolving } from '../../lib/calc/revolving';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import CuadroAmortizacion from './CuadroAmortizacion';
import { BotonCopiar, CampoSelect, CampoTexto, DesplegablePerezoso, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. El 20 % es un tipo de ejemplo. */
const EJEMPLO = { c: '3000', t: '20', cl: 'TIN', q: '75' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', cl: ['TIN', 'TAE'], q: 'num' };

export default function CalculadoraRevolving({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo<EntradaRevolving>(() => ({
    saldo: parseNumero(s.c),
    tipo: parseNumero(s.t) / 100,
    claseTipo: s.cl === 'TAE' ? 'TAE' : 'TIN',
    cuota: parseNumero(s.q),
  }), [s]);
  const errores = useMemo(() => validarRevolving(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularRevolving(entrada)), [entrada, errores]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de tarjeta revolving">
      <div class="calc__campos">
        <CampoTexto id="rv-c" etiqueta="Deuda pendiente" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.saldo} />
        <CampoTexto id="rv-q" etiqueta="Cuota mensual" sufijo="€" valor={s.q} onInput={cambia('q')} error={errores.cuota} />
        <CampoTexto id="rv-t" etiqueta="Tipo de interés" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipo} />
        <CampoSelect id="rv-cl" etiqueta="El tipo es" valor={s.cl} onChange={cambia('cl')} opciones={[['TIN', 'TIN'], ['TAE', 'TAE']]} />
      </div>
      <Resultado
        etiqueta="Tardarás en liquidar la deuda"
        cifra={r ? duracion(r.meses) : undefined}
        partidas={r ? [
          { nombre: 'Intereses totales', valor: euros(r.totalIntereses), punto: 'intereses' },
          { nombre: 'Total que pagarás', valor: euros(r.totalPagado) },
          { nombre: 'Intereses en la primera cuota', valor: euros(r.interesPrimerMes) },
          entrada.claseTipo === 'TAE' ? { nombre: 'TIN equivalente', valor: porcentaje(r.tin) } : { nombre: 'TAE sin comisiones', valor: porcentaje(r.tae) },
        ] : []}
        anuncio={r ? `Tardarás ${duracion(r.meses)} en liquidar la deuda y pagarás ${euros(r.totalIntereses)} de intereses.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Qué cuota necesitas para acabar antes</summary>
            <div class="desplegable__cuerpo tabla-scroll">
              <table class="tabla-cuadro">
                <caption>Cuota fija para liquidar la misma deuda en cada plazo, sin compras nuevas.</caption>
                <thead><tr><th scope="col">Plazo</th><th scope="col">Cuota</th><th scope="col">Intereses</th></tr></thead>
                <tbody>
                  {r.alternativas.map((a) => <tr><td>{duracion(a.meses)}</td><td>{euros(a.cuota)}</td><td>{euros(a.intereses)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </details>
          <DesplegablePerezoso titulo="Cuadro de pagos, cuota a cuota">
            {() => <CuadroAmortizacion filas={r.cuadro} />}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
