import { useMemo } from 'preact/hooks';
import { calcularFondos, validarFondos, type EntradaFondos } from '../../lib/calc/fondos';
import type { TramoAhorro } from '../../lib/calc/irpfahorro';
import { euros, parseNumero } from '../../lib/formato';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';
import { BotonCopiar, CampoTexto, DesplegablePerezoso, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. La rentabilidad es una hipótesis, no una previsión. */
const EJEMPLO = { c: '10000', a: '200', n: '20', r: '6', com: '0,2' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { c: 'num', a: 'num', n: 'num', r: 'num', com: 'num' };

interface Props {
  /** Escala del ahorro de la configuración fiscal. */
  tramos: TramoAhorro[];
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraFondos({ tramos, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const vacio = (v: string) => (v.trim() === '' ? 0 : parseNumero(v));
  const entrada = useMemo<EntradaFondos>(() => ({
    capitalInicial: vacio(s.c),
    aportacionMensual: vacio(s.a),
    anios: parseNumero(s.n),
    rentabilidad: parseNumero(s.r) / 100,
    comision: vacio(s.com) / 100,
    tramos,
  }), [s, tramos]);
  const errores = useMemo(() => validarFondos(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularFondos(entrada)), [entrada, errores]);
  const anios = entrada.anios;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de fondos indexados">
      <div class="calc__campos">
        <CampoTexto id="fi-c" etiqueta="Capital inicial" sufijo="€" valor={s.c} onInput={cambia('c')} error={errores.capitalInicial} />
        <CampoTexto id="fi-a" etiqueta="Aportación mensual" sufijo="€" valor={s.a} onInput={cambia('a')} error={errores.aportacionMensual} />
        <CampoTexto id="fi-r" etiqueta="Rentabilidad anual" sufijo="%" valor={s.r} onInput={cambia('r')} error={errores.rentabilidad} conSigno />
        <CampoTexto id="fi-n" etiqueta="Duración" sufijo="años" valor={s.n} onInput={cambia('n')} error={errores.anios} entero />
      </div>
      <details class="desplegable">
        <summary><span class="resumen-fijo">Comisiones</span><span class="resumen-suave">{s.com.trim() === '' ? '0' : s.com} % al año</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          <CampoTexto id="fi-com" etiqueta="Comisiones anuales del fondo" sufijo="%" valor={s.com} onInput={cambia('com')} error={errores.comision} placeholder="0" ancho
            ayuda="Gastos corrientes del fondo más, si la hay, la comisión de tu plataforma." />
        </div>
      </details>
      <Resultado
        etiqueta={`Valor estimado en ${anios} ${anios === 1 ? 'año' : 'años'}`}
        cifra={r ? euros(r.valorFinal) : undefined}
        partidas={r ? [
          { nombre: 'Has aportado', valor: euros(r.totalAportado), punto: 'aportado' },
          { nombre: r.ganancia >= 0 ? 'Ganancia' : 'Pérdida', valor: euros(r.ganancia), punto: 'intereses' },
          { nombre: 'Coste de las comisiones', valor: euros(r.costeComisiones) },
          { nombre: 'Neto tras impuestos', valor: euros(r.valorNeto) },
        ] : []}
        anuncio={r ? `Valor estimado: ${euros(r.valorFinal)}. Aportado: ${euros(r.totalAportado)}. Tras impuestos: ${euros(r.valorNeto)}.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <p class="aviso">IRPF estimado al reembolsar todo: {euros(r.impuesto)}. Proyección con rentabilidad constante. Un fondo de renta variable sube y baja, y puede perder valor.</p>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Gráfica: capital aportado frente a ganancia</summary>
            <div class="desplegable__cuerpo">
              <GraficaAportadoIntereses
                nombres={['Capital aportado', 'Ganancia']}
                puntos={[
                  { anio: 0, aportado: entrada.capitalInicial, saldo: entrada.capitalInicial },
                  ...r.tabla.map((f) => ({ anio: f.anio, aportado: f.aportado, saldo: Math.max(f.saldo, f.aportado) })),
                ]}
                descripcion={`Gráfica de áreas. Al cabo de ${anios} años, ${euros(r.totalAportado)} son capital aportado y ${euros(r.ganancia)} son ganancia. Los datos completos están en la tabla año a año.`}
              />
            </div>
          </details>
          <DesplegablePerezoso titulo="Tabla año a año">
            {() => (
              <table class="tabla-cuadro">
                <caption>Valor al final de cada año, con comisiones y sin ellas.</caption>
                <thead><tr><th scope="col">Año</th><th scope="col">Aportado</th><th scope="col">Valor</th><th scope="col">Sin comisiones</th></tr></thead>
                <tbody>
                  {r.tabla.map((f) => <tr><td>{f.anio}</td><td>{euros(f.aportado)}</td><td>{euros(f.saldo)}</td><td>{euros(f.sinComisiones)}</td></tr>)}
                </tbody>
              </table>
            )}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
