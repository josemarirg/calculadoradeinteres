import { useMemo } from 'preact/hooks';
import { convertirTipo, validarConversion, type EntradaConversion, type Frecuencia } from '../../lib/calc/tintae';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { s: 'a', t: '7', f: '12' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { s: ['a', 'b'], t: 'num', f: ['1', '2', '4', '12'] };

export default function CalculadoraTinTae({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const aTae = s.s === 'a';
  const entrada = useMemo<EntradaConversion>(() => ({
    tipo: parseNumero(s.t) / 100,
    sentido: aTae ? 'tin-a-tae' : 'tae-a-tin',
    pagosPorAnio: Number(s.f) as Frecuencia,
  }), [s, aTae]);
  const errores = useMemo(() => validarConversion(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : convertirTipo(entrada)), [entrada, errores]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de TIN y TAE">
      <div class="calc__campos">
        <CampoSelect id="tt-s" etiqueta="Quiero pasar" valor={s.s} onChange={cambia('s')} opciones={[['a', 'De TIN a TAE'], ['b', 'De TAE a TIN']]} ancho />
        <CampoTexto id="tt-t" etiqueta={aTae ? 'TIN' : 'TAE'} sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipo} />
        <CampoSelect id="tt-f" etiqueta="Pagos al año" valor={s.f} onChange={cambia('f')} opciones={[['12', 'Mensual (12)'], ['4', 'Trimestral (4)'], ['2', 'Semestral (2)'], ['1', 'Anual (1)']]} />
      </div>
      <Resultado
        etiqueta={aTae ? 'TAE equivalente, sin comisiones' : 'TIN equivalente'}
        cifra={r ? porcentaje(aTae ? r.tae : r.tin, 3) : undefined}
        partidas={r ? [
          { nombre: 'TIN', valor: porcentaje(r.tin, 3) },
          { nombre: 'TAE', valor: porcentaje(r.tae, 3) },
          { nombre: 'Tipo de cada periodo', valor: porcentaje(r.tipoPorPeriodo, 4) },
          { nombre: 'Interés de 10.000 € en un año', valor: euros(10_000 * r.tae) },
        ] : []}
        anuncio={r ? `TIN ${porcentaje(r.tin, 3)}, TAE ${porcentaje(r.tae, 3)}.` : 'Hay campos con errores.'}
      />
      {r && <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />}
    </form>
  );
}
