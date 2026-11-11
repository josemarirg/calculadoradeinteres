import { useEffect, useMemo, useState } from 'preact/hooks';
import { calcularHipoteca, simularAmortizacionAnticipada, validarAnticipada, validarHipoteca, type EntradaAnticipada, type EntradaHipoteca } from '../../lib/calc/hipoteca';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import CuadroAmortizacion, { puntosDeCuadro } from './CuadroAmortizacion';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';
import { BotonCopiar, CampoSelect, CampoTexto, DesplegablePerezoso, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/**
 * Valores de ejemplo: los del ejemplo resuelto de la página y de los tests.
 * El Euríbor (e) y el diferencial (d) salen vacíos a propósito: no se inventan tipos de mercado.
 */
const EJEMPLO = { p: '250000', a: '50000', n: '30', mod: 'f', t: '3', e: '', d: '', x: '', k: '', r: 'c' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { p: 'num', a: 'num', n: 'num', mod: ['f', 'v'], t: 'num', e: 'num', d: 'num', x: 'num', k: 'num', r: ['c', 'p'] };

interface Props {
  embed?: boolean;
  urlPublica: string;
  /** Dónde consultar el Euríbor oficial. */
  urlEuribor: string;
}

export default function CalculadoraHipoteca({ embed = false, urlPublica, urlEuribor }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const variable = s.mod === 'v';
  const faltaTipo = variable && (s.e.trim() === '' || s.d.trim() === '');

  const entrada = useMemo<EntradaHipoteca>(() => ({
    precio: parseNumero(s.p),
    ahorro: s.a.trim() === '' ? 0 : parseNumero(s.a),
    anios: parseNumero(s.n),
    modalidad: variable ? 'variable' : 'fija',
    tin: parseNumero(s.t) / 100,
    euribor: parseNumero(s.e) / 100,
    diferencial: parseNumero(s.d) / 100,
  }), [s, variable]);

  const errores = useMemo(() => {
    const e = validarHipoteca(entrada);
    // Un campo vacío todavía no es un error: se pide con un mensaje en el resultado.
    if (s.e.trim() === '') delete e.euribor;
    if (s.d.trim() === '') delete e.diferencial;
    return e;
  }, [entrada, s.e, s.d]);
  const r = useMemo(() => (Object.keys(errores).length || faltaTipo ? null : calcularHipoteca(entrada)), [entrada, errores, faltaTipo]);

  // ── Amortización anticipada (opcional) ──
  const quiereAmortizar = s.x.trim() !== '';
  const entradaA = useMemo<EntradaAnticipada | null>(() => (r && quiereAmortizar ? {
    capital: r.capital,
    tin: r.tinAplicado,
    meses: r.meses,
    importe: parseNumero(s.x),
    trasCuota: parseNumero(s.k),
    modo: s.r === 'p' ? 'plazo' : 'cuota',
  } : null), [r, quiereAmortizar, s.x, s.k, s.r]);
  const erroresA = useMemo(() => {
    if (!entradaA) return {};
    const e = validarAnticipada(entradaA);
    if (s.k.trim() === '') delete e.trasCuota;
    return e;
  }, [entradaA, s.k]);
  const ra = useMemo(
    () => (entradaA && s.k.trim() !== '' && Object.keys(erroresA).length === 0 ? simularAmortizacionAnticipada(entradaA) : null),
    [entradaA, erroresA, s.k],
  );
  const cuadro = ra ? ra.cuadro : r?.cuadro;
  // El desplegable se abre solo si el enlace compartido trae una amortización; después lo controla la persona.
  const [verAnticipada, setVerAnticipada] = useState(false);
  useEffect(() => { if (quiereAmortizar) setVerAnticipada(true); }, [quiereAmortizar]);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de cuota de hipoteca">
      <div class="calc__campos">
        <CampoTexto id="hp-p" etiqueta="Precio de la vivienda" sufijo="€" valor={s.p} onInput={cambia('p')} error={errores.precio} />
        <CampoTexto id="hp-a" etiqueta="Ahorro aportado" sufijo="€" valor={s.a} onInput={cambia('a')} error={errores.ahorro} />
        <CampoTexto id="hp-n" etiqueta="Plazo" sufijo="años" valor={s.n} onInput={cambia('n')} error={errores.anios} entero />
        <CampoSelect id="hp-mod" etiqueta="Tipo de hipoteca" valor={s.mod} onChange={cambia('mod')} opciones={[['f', 'Fija'], ['v', 'Variable']]} />
        {variable ? (
          <>
            <CampoTexto id="hp-e" etiqueta="Euríbor" sufijo="%" valor={s.e} onInput={cambia('e')} error={errores.euribor} conSigno
              ayuda={<><a href={urlEuribor} target="_blank" rel="noopener">Consulta el valor oficial</a> en el Banco de España.</>} />
            <CampoTexto id="hp-d" etiqueta="Diferencial" sufijo="%" valor={s.d} onInput={cambia('d')} error={errores.diferencial} />
          </>
        ) : (
          <CampoTexto id="hp-t" etiqueta="TIN" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tin} ancho />
        )}
      </div>

      <Resultado
        etiqueta="Cuota mensual"
        cifra={r ? euros(r.cuota) : undefined}
        mensaje={faltaTipo && Object.keys(errores).length === 0 ? 'Indica el Euríbor actual y el diferencial de tu hipoteca para ver la cuota.' : undefined}
        partidas={r ? [
          { nombre: `Hipoteca (${porcentaje(r.financiacion, 0)} del precio)`, valor: euros(r.capital), punto: 'aportado' },
          { nombre: 'Intereses totales', valor: euros(r.totalIntereses), punto: 'intereses' },
          { nombre: 'Total a pagar', valor: euros(r.totalPagado) },
          { nombre: variable ? `TAE orientativa* (TIN ${porcentaje(r.tinAplicado)})` : 'TAE orientativa*', valor: porcentaje(r.taeOrientativa) },
        ] : []}
        anuncio={r ? `Cuota mensual: ${euros(r.cuota)}. Intereses totales: ${euros(r.totalIntereses)}. Total a pagar: ${euros(r.totalPagado)}.` : faltaTipo ? 'Faltan el Euríbor y el diferencial.' : 'Hay campos con errores.'}
      />
      {r && (
        <p class="aviso">
          *Sin gastos vinculados (tasación, seguros, comisiones).
          {variable && ' Cálculo con el Euríbor constante durante todo el plazo: la cuota real cambiará en cada revisión.'}
        </p>
      )}

      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />

          <details class="desplegable" open={verAnticipada} onToggle={(e) => setVerAnticipada((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>Simular una amortización anticipada</summary>
            <div class="desplegable__cuerpo">
              <div class="calc__campos">
                <CampoTexto id="hp-x" etiqueta="Importe que amortizas" sufijo="€" valor={s.x} onInput={cambia('x')} error={erroresA.importe} />
                <CampoTexto id="hp-k" etiqueta="Tras la cuota n.º" sufijo="" valor={s.k} onInput={cambia('k')} error={erroresA.trasCuota} entero
                  ayuda={`De 0 a ${r.meses - 1}. La 60 es al cumplir 5 años.`} />
                <CampoSelect id="hp-r" etiqueta="Qué prefieres reducir" valor={s.r} onChange={cambia('r')} ancho
                  opciones={[['c', 'La cuota (mismo plazo)'], ['p', 'El plazo (misma cuota)']]} />
              </div>
              {ra && (
                <dl class="resultado__desglose anticipada" aria-live="polite">
                  {entradaA?.modo === 'cuota' ? (
                    <div><dt>Nueva cuota</dt><dd>{euros(ra.nuevaCuota)} <small>(antes {euros(ra.cuotaOriginal)})</small></dd></div>
                  ) : (
                    <div><dt>Terminas de pagar</dt><dd>{ra.mesesAhorrados > 0 ? `${duracion(ra.mesesAhorrados)} antes` : 'en el mismo plazo'}</dd></div>
                  )}
                  <div><dt>Ahorro de intereses</dt><dd>{euros(ra.ahorroIntereses)}</dd></div>
                  <div><dt>Capital pendiente antes</dt><dd>{euros(ra.saldoAntes)}</dd></div>
                  <div><dt>Cuotas que quedan</dt><dd>{ra.cuotasRestantes}</dd></div>
                </dl>
              )}
              {quiereAmortizar && !ra && Object.keys(erroresA).length === 0 && (
                <p class="campo__ayuda">Indica tras qué cuota harías la amortización.</p>
              )}
              <p class="campo__ayuda">No incluye la comisión por amortización anticipada que pueda cobrar tu banco.</p>
            </div>
          </details>

          <details class="desplegable" open>
            <summary>Gráfica: capital devuelto e intereses pagados</summary>
            <div class="desplegable__cuerpo">
              <GraficaAportadoIntereses
                puntos={puntosDeCuadro(cuadro!, ra && entradaA ? { trasCuota: entradaA.trasCuota, importe: entradaA.importe } : undefined)}
                nombres={['Capital devuelto', 'Intereses pagados']}
                rotuloX={(m) => (m % 12 === 0 ? `Año ${m / 12}` : `Mes ${m}`)}
                rotuloInicio="Inicio"
                descripcion={`Gráfica de áreas. Al terminar habrás devuelto ${euros(r.capital)} de capital y pagado ${euros(ra ? ra.interesesConAmortizar : r.totalIntereses)} de intereses. Los datos completos están en el cuadro de amortización.`}
              />
            </div>
          </details>
          <DesplegablePerezoso titulo={ra ? 'Cuadro de amortización (con la amortización anticipada)' : 'Cuadro de amortización'}>
            {() => <CuadroAmortizacion filas={cuadro!} />}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
