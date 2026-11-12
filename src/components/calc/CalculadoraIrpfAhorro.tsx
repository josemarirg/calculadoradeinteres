import { useMemo } from 'preact/hooks';
import { calcularIrpfAhorro, validarIrpfAhorro, type EntradaIrpfAhorro, type TramoAhorro } from '../../lib/calc/irpfahorro';
import { euros, eurosSinCentimos, numero, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. */
const EJEMPLO = { i: '2000', g: '8000', ret: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { i: 'num', g: 'num', ret: 'num' };

interface Props {
  /** Escala del ahorro de la configuración fiscal. */
  tramos: TramoAhorro[];
  /** Retención sobre intereses y dividendos, en tanto por uno. */
  retencionPorDefecto: number;
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraIrpfAhorro({ tramos, retencionPorDefecto, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const vacio = (v: string) => (v.trim() === '' ? 0 : parseNumero(v));
  const rendimientos = vacio(s.i);
  /** Si no se indica, se supone la retención habitual sobre intereses y dividendos. */
  const retencionSupuesta = Number.isFinite(rendimientos) && rendimientos > 0 ? rendimientos * retencionPorDefecto : 0;
  const entrada = useMemo<EntradaIrpfAhorro>(() => ({
    rendimientos,
    ganancias: vacio(s.g),
    retenciones: s.ret.trim() === '' ? retencionSupuesta : parseNumero(s.ret),
    tramos,
  }), [s, tramos, rendimientos, retencionSupuesta]);
  const errores = useMemo(() => validarIrpfAhorro(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularIrpfAhorro(entrada)), [entrada, errores]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora del IRPF del ahorro">
      <div class="calc__campos">
        <CampoTexto id="ia-i" etiqueta="Intereses y dividendos" sufijo="€" valor={s.i} onInput={cambia('i')} error={errores.rendimientos} placeholder="0" />
        <CampoTexto id="ia-g" etiqueta="Ganancias por ventas" sufijo="€" valor={s.g} onInput={cambia('g')} error={errores.ganancias} placeholder="0" />
        <CampoTexto id="ia-ret" etiqueta="Retenciones que ya te han practicado" sufijo="€" valor={s.ret} onInput={cambia('ret')} error={errores.retenciones} ancho
          placeholder={numero(Math.round(retencionSupuesta * 100) / 100)}
          ayuda={`Si lo dejas vacío se supone el ${numero(retencionPorDefecto * 100)} % de los intereses y dividendos.`} />
      </div>
      <Resultado
        etiqueta="IRPF del ahorro del año"
        cifra={r ? euros(r.cuota) : undefined}
        partidas={r ? [
          { nombre: 'Base del ahorro', valor: euros(r.base) },
          { nombre: 'Tipo medio', valor: porcentaje(r.tipoMedio) },
          { nombre: 'Retenciones practicadas', valor: euros(r.retenciones) },
          r.diferencia >= 0
            ? { nombre: 'A pagar en la renta', valor: euros(r.diferencia) }
            : { nombre: 'Te devolverían', valor: euros(-r.diferencia) },
          { nombre: 'Neto tras el impuesto', valor: euros(r.neto), punto: 'intereses' },
          { nombre: 'Último tramo', valor: porcentaje(r.marginal, 0) },
        ] : []}
        anuncio={r ? `IRPF del ahorro: ${euros(r.cuota)}, un tipo medio del ${porcentaje(r.tipoMedio)}. ${r.diferencia >= 0 ? `Queda por pagar ${euros(r.diferencia)}.` : `A devolver ${euros(-r.diferencia)}.`}` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Cálculo por tramos</summary>
            <div class="desplegable__cuerpo tabla-scroll">
              <table class="tabla-cuadro">
                <caption>Cada tipo se aplica solo a la parte de la base que cae en su tramo.</caption>
                <thead><tr><th scope="col">Tramo</th><th scope="col">Tipo</th><th scope="col">Base</th><th scope="col">Cuota</th></tr></thead>
                <tbody>
                  {r.desglose.map((f) => (
                    <tr>
                      <td>{f.hasta === null ? `Más de ${eurosSinCentimos(f.desde)}` : `Hasta ${eurosSinCentimos(f.hasta)}`}</td>
                      <td>{porcentaje(f.tipo, 0)}</td>
                      <td>{euros(f.base)}</td>
                      <td>{euros(f.cuota)}</td>
                    </tr>
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
