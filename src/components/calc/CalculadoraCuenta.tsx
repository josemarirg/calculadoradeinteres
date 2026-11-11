import { useMemo } from 'preact/hooks';
import { calcularCuenta, validarCuenta, type EntradaCuenta } from '../../lib/calc/cuenta';
import { euros, numero, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, DesplegablePerezoso, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. El 2 % es un tipo de ejemplo, no una oferta. */
const EJEMPLO = { c: '10000', t: '2', cl: 'TIN', m: '12', a: '', lim: '', ret: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', cl: ['TIN', 'TAE'], m: 'num', a: 'num', lim: 'num', ret: 'num' };

interface Props {
  /** Retención sobre intereses de la configuración fiscal, en tanto por uno. */
  retencionPorDefecto: number;
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraCuenta({ retencionPorDefecto, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const vacio = (v: string) => (v.trim() === '' ? 0 : parseNumero(v));
  const entrada = useMemo<EntradaCuenta>(() => ({
    saldo: vacio(s.c),
    tipo: parseNumero(s.t) / 100,
    claseTipo: s.cl === 'TAE' ? 'TAE' : 'TIN',
    meses: parseNumero(s.m),
    aportacionMensual: vacio(s.a),
    limiteRemunerado: vacio(s.lim),
    retencion: s.ret.trim() === '' ? retencionPorDefecto : parseNumero(s.ret) / 100,
  }), [s, retencionPorDefecto]);
  const errores = useMemo(() => validarCuenta(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularCuenta(entrada)), [entrada, errores]);
  const meses = entrada.meses;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de cuenta remunerada">
      <div class="calc__campos">
        <CampoTexto id="cr-c" etiqueta="Saldo en la cuenta" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.saldo} />
        <CampoTexto id="cr-m" etiqueta="Tiempo" sufijo="meses" valor={s.m} onInput={cambia('m')} error={errores.meses} entero />
        <CampoTexto id="cr-t" etiqueta="Tipo de interés" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipo} />
        <CampoSelect id="cr-cl" etiqueta="El tipo es" valor={s.cl} onChange={cambia('cl')} opciones={[['TIN', 'TIN'], ['TAE', 'TAE']]} />
      </div>
      <details class="desplegable">
        <summary><span class="resumen-fijo">Más opciones</span><span class="resumen-suave">aportación, saldo máximo, retención</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          <CampoTexto id="cr-a" etiqueta="Aportación mensual" sufijo="€" valor={s.a} onInput={cambia('a')} error={errores.aportacionMensual} placeholder="0" />
          <CampoTexto id="cr-ret" etiqueta="Retención" sufijo="%" valor={s.ret} onInput={cambia('ret')} error={errores.retencion} placeholder={numero(retencionPorDefecto * 100)} />
          <CampoTexto id="cr-lim" etiqueta="Saldo máximo remunerado" sufijo="€" valor={s.lim} onInput={cambia('lim')} error={errores.limiteRemunerado} placeholder="Sin límite" ancho
            ayuda="Si la entidad solo paga intereses hasta cierto saldo, indícalo aquí." />
        </div>
      </details>
      <Resultado
        etiqueta={`Intereses netos en ${meses} ${meses === 1 ? 'mes' : 'meses'}`}
        cifra={r ? euros(r.interesesNetos) : undefined}
        partidas={r ? [
          { nombre: 'Intereses brutos', valor: euros(r.interesesBrutos) },
          { nombre: `Retención (${porcentaje(entrada.retencion, 0)})`, valor: euros(r.retencion) },
          { nombre: 'Saldo final', valor: euros(r.saldoFinal) },
          { nombre: 'Media neta al mes', valor: euros(r.interesesNetos / meses) },
        ] : []}
        anuncio={r ? `Intereses netos: ${euros(r.interesesNetos)}. Saldo final: ${euros(r.saldoFinal)}.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <DesplegablePerezoso titulo="Tabla mes a mes">
            {() => (
              <table class="tabla-cuadro">
                <caption>Intereses de cada mes y saldo tras el abono.</caption>
                <thead><tr><th scope="col">Mes</th><th scope="col">Bruto</th><th scope="col">Neto</th><th scope="col">Saldo</th></tr></thead>
                <tbody>
                  {r.tabla.map((f) => <tr><td>{f.mes}</td><td>{euros(f.interesBruto)}</td><td>{euros(f.interesNeto)}</td><td>{euros(f.saldo)}</td></tr>)}
                </tbody>
              </table>
            )}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
