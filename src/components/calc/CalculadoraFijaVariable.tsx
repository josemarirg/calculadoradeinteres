import { useMemo } from 'preact/hooks';
import { calcularFijaVariable, validarFijaVariable, type EntradaFijaVariable } from '../../lib/calc/fijavariable';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

/**
 * Valores de ejemplo: los del ejemplo resuelto de la página y de los tests.
 * El TIN y el diferencial son de ejemplo. El Euríbor (e) sale vacío a propósito: no se inventan tipos de mercado.
 */
const EJEMPLO = { c: '200000', n: '30', t: '3', d: '0,7', e: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', n: 'num', t: 'num', d: 'num', e: 'num' };

interface Props {
  embed?: boolean;
  urlPublica: string;
  /** Dónde consultar el Euríbor oficial. */
  urlEuribor: string;
}

const conSigno = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${euros(Math.abs(n))}`;

export default function CalculadoraFijaVariable({ embed = false, urlPublica, urlEuribor }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const conEuribor = s.e.trim() !== '';
  const entrada = useMemo<EntradaFijaVariable>(() => ({
    capital: parseNumero(s.c),
    anios: parseNumero(s.n),
    tinFijo: parseNumero(s.t) / 100,
    diferencial: parseNumero(s.d) / 100,
    euribor: conEuribor ? parseNumero(s.e) / 100 : undefined,
  }), [s, conEuribor]);
  const errores = useMemo(() => validarFijaVariable(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularFijaVariable(entrada)), [entrada, errores]);
  const v = r?.variable ?? null;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de hipoteca fija o variable">
      <div class="calc__campos">
        <CampoTexto id="fv-c" etiqueta="Importe de la hipoteca" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.capital} />
        <CampoTexto id="fv-n" etiqueta="Plazo" sufijo="años" valor={s.n} onInput={cambia('n')} error={errores.anios} entero />
        <CampoTexto id="fv-t" etiqueta="TIN de la fija" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tinFijo} />
        <CampoTexto id="fv-d" etiqueta="Diferencial de la variable" sufijo="%" valor={s.d} onInput={cambia('d')} error={errores.diferencial} />
        <CampoTexto id="fv-e" etiqueta="Euríbor que quieres probar (opcional)" sufijo="%" valor={s.e} onInput={cambia('e')} error={errores.euribor} conSigno ancho
          ayuda={<><a href={urlEuribor} target="_blank" rel="noopener">Consulta el valor oficial</a> en el Banco de España.</>} />
      </div>
      <Resultado
        etiqueta="La fija gana si el Euríbor medio supera el"
        cifra={r ? porcentaje(r.euriborEquilibrio) : undefined}
        partidas={r ? [
          { nombre: 'Cuota de la fija', valor: euros(r.fija.cuota) },
          { nombre: 'Intereses de la fija', valor: euros(r.fija.intereses), punto: 'intereses' },
          ...(v ? [
            { nombre: `Cuota de la variable (TIN ${porcentaje(v.tin)})`, valor: euros(v.cuota) },
            { nombre: 'Intereses de la variable', valor: euros(v.intereses), punto: 'intereses' as const },
            { nombre: 'Variable frente a fija, al mes', valor: conSigno(v.difCuota) },
            { nombre: 'Variable frente a fija, en total', valor: conSigno(v.difIntereses) },
          ] : []),
        ] : []}
        anuncio={r ? `La fija sale mejor si el Euríbor medio supera el ${porcentaje(r.euriborEquilibrio)}. Cuota de la fija: ${euros(r.fija.cuota)}.${v ? ` Cuota de la variable: ${euros(v.cuota)}.` : ''}` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <p class="aviso">Cálculo con el Euríbor constante durante todo el plazo: en la práctica cambia en cada revisión. Sin comisiones ni productos vinculados.</p>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>La variable según el Euríbor</summary>
            <div class="desplegable__cuerpo tabla-scroll">
              <table class="tabla-cuadro">
                <caption>Cuota de la variable con cada Euríbor y diferencia con la fija ({euros(r.fija.cuota)} al mes).</caption>
                <thead><tr><th scope="col">Euríbor</th><th scope="col">Cuota</th><th scope="col">Al mes</th><th scope="col">Intereses totales</th></tr></thead>
                <tbody>
                  {r.escenarios.map((x) => (
                    <tr><td>{porcentaje(x.euribor, 0)}</td><td>{euros(x.cuota)}</td><td>{conSigno(x.difCuota)}</td><td>{conSigno(x.difIntereses)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </form>
  );
}
