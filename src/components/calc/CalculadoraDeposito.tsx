import { useMemo } from 'preact/hooks';
import { calcularDeposito, validarDeposito, type EntradaDeposito } from '../../lib/calc/deposito';
import { euros, numero, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { c: '10000', t: '3', cl: 'TAE', p: '12', u: 'm', ret: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', cl: ['TAE', 'TIN'], p: 'num', u: ['m', 'd'], ret: 'num' };

interface Props {
  /** Retención sobre intereses de la configuración fiscal, en tanto por uno. */
  retencionPorDefecto: number;
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraDeposito({ retencionPorDefecto, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo<EntradaDeposito>(() => ({
    importe: parseNumero(s.c),
    tipo: parseNumero(s.t) / 100,
    claseTipo: s.cl === 'TIN' ? 'TIN' : 'TAE',
    plazo: parseNumero(s.p),
    unidad: s.u === 'd' ? 'dias' : 'meses',
    retencion: s.ret.trim() === '' ? retencionPorDefecto : parseNumero(s.ret) / 100,
  }), [s, retencionPorDefecto]);
  const errores = useMemo(() => validarDeposito(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularDeposito(entrada)), [entrada, errores]);
  const pctDefecto = numero(retencionPorDefecto * 100);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de rentabilidad de un depósito">
      <div class="calc__campos">
        <CampoTexto id="dp-c" etiqueta="Importe" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.importe} />
        <CampoTexto id="dp-ret" etiqueta="Retención" sufijo="%" valor={s.ret} onInput={cambia('ret')} error={errores.retencion} placeholder={pctDefecto} />
        <CampoTexto id="dp-t" etiqueta="Tipo de interés" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipo} />
        <CampoSelect id="dp-cl" etiqueta="El tipo es" valor={s.cl} onChange={cambia('cl')} opciones={[['TAE', 'TAE'], ['TIN', 'TIN']]} />
        <CampoTexto id="dp-p" etiqueta="Plazo" sufijo="" valor={s.p} onInput={cambia('p')} error={errores.plazo} entero />
        <CampoSelect id="dp-u" etiqueta="Unidad del plazo" valor={s.u} onChange={cambia('u')} opciones={[['m', 'Meses'], ['d', 'Días']]} />
      </div>
      <Resultado
        etiqueta="Intereses netos al vencimiento"
        cifra={r ? euros(r.interesesNetos) : undefined}
        partidas={r ? [
          { nombre: 'Intereses brutos', valor: euros(r.interesesBrutos) },
          { nombre: `Retención (${porcentaje(entrada.retencion, 0)})`, valor: euros(r.retencion) },
          { nombre: 'Recibes en total', valor: euros(r.totalAlVencimiento) },
          { nombre: entrada.claseTipo === 'TIN' ? 'TAE equivalente' : 'TAE', valor: porcentaje(r.taeEquivalente) },
        ] : []}
        anuncio={r ? `Intereses netos: ${euros(r.interesesNetos)}. Brutos: ${euros(r.interesesBrutos)}. Retención: ${euros(r.retencion)}.` : 'Hay campos con errores.'}
      />
      {r && <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />}
    </form>
  );
}
