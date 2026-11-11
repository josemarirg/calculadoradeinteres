import { useMemo } from 'preact/hooks';
import { compararAmortizacion, validarComparativa } from '../../lib/calc/hipoteca';
import { euros, parseNumero } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { c: '150000', t: '3', m: '240', x: '10000', com: '', r: 'p' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', t: 'num', m: 'num', x: 'num', com: 'num', r: ['p', 'c'] };

export default function CalculadoraAnticipada({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo(() => ({
    capitalPendiente: parseNumero(s.c),
    tin: parseNumero(s.t) / 100,
    mesesRestantes: parseNumero(s.m),
    importe: parseNumero(s.x),
    comision: s.com.trim() === '' ? 0 : parseNumero(s.com) / 100,
  }), [s]);
  const errores = useMemo(() => validarComparativa(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : compararAmortizacion(entrada)), [entrada, errores]);
  const plazo = s.r === 'p';
  const elegido = r ? (plazo ? r.reducirPlazo : r.reducirCuota) : null;
  const otro = r ? (plazo ? r.reducirCuota : r.reducirPlazo) : null;
  const conComision = !!r && r.comision > 0;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de amortización anticipada">
      <div class="calc__campos">
        <CampoTexto id="aa-c" etiqueta="Capital pendiente" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.capitalPendiente} />
        <CampoTexto id="aa-t" etiqueta="TIN actual" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tin} />
        <CampoTexto id="aa-m" etiqueta="Cuotas que quedan" sufijo="meses" valor={s.m} onInput={cambia('m')} error={errores.mesesRestantes} entero />
        <CampoTexto id="aa-x" etiqueta="Importe que amortizas" sufijo="€" valor={s.x} onInput={cambia('x')} error={errores.importe} />
        <CampoSelect id="aa-r" etiqueta="Qué reduces" valor={s.r} onChange={cambia('r')} opciones={[['p', 'El plazo'], ['c', 'La cuota']]} />
        <CampoTexto id="aa-com" etiqueta="Comisión del banco" sufijo="%" valor={s.com} onInput={cambia('com')} error={errores.comision} placeholder="0" />
      </div>
      <Resultado
        etiqueta={conComision ? 'Ahorro de intereses, descontada la comisión' : 'Ahorro de intereses'}
        cifra={r && elegido ? euros(elegido.ahorroNeto) : undefined}
        partidas={r && elegido && otro ? [
          plazo
            ? { nombre: 'Terminas de pagar', valor: r.reducirPlazo.mesesAhorrados > 0 ? `${duracion(r.reducirPlazo.mesesAhorrados)} antes` : 'en el mismo plazo' }
            : { nombre: `Nueva cuota (antes ${euros(r.cuotaActual)})`, valor: euros(r.reducirCuota.nuevaCuota) },
          plazo
            ? { nombre: 'Cuota (no cambia)', valor: euros(r.cuotaActual) }
            : { nombre: 'Plazo (no cambia)', valor: duracion(entrada.mesesRestantes) },
          ...(conComision ? [{ nombre: 'Comisión', valor: euros(r.comision) }] : []),
          { nombre: plazo ? 'Si redujeras la cuota' : 'Si redujeras el plazo', valor: euros(otro.ahorroNeto) },
        ] : []}
        anuncio={r && elegido ? `Ahorro de intereses: ${euros(elegido.ahorroNeto)}.` : 'Hay campos con errores.'}
      />
      {r && <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />}
    </form>
  );
}
