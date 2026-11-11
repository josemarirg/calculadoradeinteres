import { useMemo } from 'preact/hooks';
import { calcularSimple, validarSimple } from '../../lib/calc/simple';
import { euros, parseNumero } from '../../lib/formato';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';
import { BotonCopiar, CampoTexto, DesplegablePerezoso, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { c: '10000', t: '5', n: '10' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', n: 'num' };

export default function CalculadoraSimple({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo(() => ({ capital: parseNumero(s.c), tipoAnual: parseNumero(s.t) / 100, anios: parseNumero(s.n) }), [s]);
  const errores = useMemo(() => validarSimple(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularSimple(entrada)), [entrada, errores]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de interés simple">
      <div class="calc__campos">
        <CampoTexto id="is-c" etiqueta="Capital" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.capital} ancho />
        <CampoTexto id="is-t" etiqueta="Interés anual" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipoAnual} />
        <CampoTexto id="is-n" etiqueta="Duración" sufijo="años" valor={s.n} onInput={cambia('n')} error={errores.anios} entero />
      </div>
      <Resultado
        etiqueta={r ? `Intereses con interés simple en ${entrada.anios} ${entrada.anios === 1 ? 'año' : 'años'}` : undefined}
        cifra={r ? euros(r.intereses) : undefined}
        partidas={r ? [
          { nombre: 'Capital final', valor: euros(r.valorFinal), punto: 'aportado' },
          { nombre: 'Con interés compuesto', valor: euros(r.compuesto.valorFinal), punto: 'intereses' },
          { nombre: 'Intereses con compuesto', valor: euros(r.compuesto.intereses) },
          { nombre: 'Diferencia', valor: euros(r.diferencia) },
        ] : []}
        anuncio={r ? `Intereses con interés simple: ${euros(r.intereses)}. Capital final: ${euros(r.valorFinal)}. Con interés compuesto serían ${euros(r.compuesto.valorFinal)}.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Gráfica: simple frente a compuesto</summary>
            <div class="desplegable__cuerpo">
              <GraficaAportadoIntereses
                puntos={[{ anio: 0, aportado: entrada.capital, saldo: entrada.capital }, ...r.tabla.map((f) => ({ anio: f.anio, aportado: f.simple, saldo: f.compuesto }))]}
                nombres={['Capital con interés simple', 'Extra con interés compuesto']}
                descripcion={`Gráfica de áreas. Al cabo de ${entrada.anios} años, el interés simple da ${euros(r.valorFinal)} y el compuesto ${euros(r.compuesto.valorFinal)}. Los datos completos están en la tabla año a año.`}
              />
            </div>
          </details>
          <DesplegablePerezoso titulo="Tabla año a año">
            {() => (
              <table>
                <caption>Capital acumulado al final de cada año.</caption>
                <thead><tr><th scope="col">Año</th><th scope="col">Simple</th><th scope="col">Compuesto</th><th scope="col">Diferencia</th></tr></thead>
                <tbody>
                  {r.tabla.map((f) => (
                    <tr><td>{f.anio}</td><td>{euros(f.simple)}</td><td>{euros(f.compuesto)}</td><td>{euros(f.compuesto - f.simple)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
