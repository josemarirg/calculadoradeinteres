import { useMemo } from 'preact/hooks';
import { calcularPensiones, validarPensiones, type EntradaPensiones } from '../../lib/calc/pensiones';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoTexto, DesplegablePerezoso, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. Rentabilidad, comisión y tipos son hipótesis. */
const EJEMPLO = { a: '1500', n: '25', r: '4', com: '1', tm: '30', tr: '20' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { a: 'num', n: 'num', r: 'num', com: 'num', tm: 'num', tr: 'num' };

interface Props {
  /** Límite anual de aportación a planes individuales, desde la configuración fiscal. */
  limiteIndividual: number;
  /** Límite conjunto con planes de empleo. */
  limiteConjunto: number;
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraPensiones({ limiteIndividual, limiteConjunto, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const entrada = useMemo<EntradaPensiones>(() => ({
    aportacionAnual: parseNumero(s.a),
    anios: parseNumero(s.n),
    rentabilidad: parseNumero(s.r) / 100,
    comision: s.com.trim() === '' ? 0 : parseNumero(s.com) / 100,
    tipoMarginal: parseNumero(s.tm) / 100,
    tipoRescate: parseNumero(s.tr) / 100,
    limiteAportacion: limiteConjunto,
  }), [s, limiteConjunto]);
  const errores = useMemo(() => validarPensiones(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularPensiones(entrada)), [entrada, errores]);
  const sobreLimite = !errores.aportacionAnual && entrada.aportacionAnual > limiteIndividual;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de plan de pensiones">
      <div class="calc__campos">
        <CampoTexto id="pp-a" etiqueta="Aportación anual" sufijo="€" valor={s.a} onInput={cambia('a')} error={errores.aportacionAnual}
          ayuda={sobreLimite ? `Por encima de ${euros(limiteIndividual).replace(',00', '')} solo cabe con un plan de empleo.` : undefined} />
        <CampoTexto id="pp-n" etiqueta="Años hasta el rescate" sufijo="años" valor={s.n} onInput={cambia('n')} error={errores.anios} entero />
        <CampoTexto id="pp-tm" etiqueta="Tu tipo marginal de IRPF" sufijo="%" valor={s.tm} onInput={cambia('tm')} error={errores.tipoMarginal} />
        <CampoTexto id="pp-tr" etiqueta="IRPF medio al rescatar" sufijo="%" valor={s.tr} onInput={cambia('tr')} error={errores.tipoRescate} />
      </div>
      <details class="desplegable">
        <summary><span class="resumen-fijo">Más opciones</span><span class="resumen-suave">rentabilidad, comisiones</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          <CampoTexto id="pp-r" etiqueta="Rentabilidad anual" sufijo="%" valor={s.r} onInput={cambia('r')} error={errores.rentabilidad} conSigno />
          <CampoTexto id="pp-com" etiqueta="Comisiones anuales" sufijo="%" valor={s.com} onInput={cambia('com')} error={errores.comision} placeholder="0" />
        </div>
      </details>
      <Resultado
        etiqueta="Recibirías al rescatar, después de impuestos"
        cifra={r ? euros(r.netoRescate) : undefined}
        partidas={r ? [
          { nombre: 'Capital acumulado', valor: euros(r.capitalFinal) },
          { nombre: `Impuesto del rescate (${porcentaje(entrada.tipoRescate, 0)})`, valor: euros(r.impuestoRescate) },
          { nombre: 'Ahorro fiscal acumulado', valor: euros(r.ahorroFiscalTotal), punto: 'intereses' },
          { nombre: 'Ahorro fiscal menos impuesto', valor: euros(r.saldoFiscal) },
        ] : []}
        anuncio={r ? `Recibirías ${euros(r.netoRescate)} después de impuestos. Ahorro fiscal durante las aportaciones: ${euros(r.ahorroFiscalTotal)}.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <p class="aviso">
            Has aportado {euros(r.totalAportado)} y te has ahorrado {euros(r.ahorroFiscalAnual)} de IRPF cada año. Fiscalmente compensa
            si al rescatar pagas menos del {porcentaje(r.tipoRescateEquilibrio, 1)}.
          </p>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <DesplegablePerezoso titulo="Tabla año a año">
            {() => (
              <table class="tabla-cuadro">
                <caption>Importes acumulados al final de cada año.</caption>
                <thead><tr><th scope="col">Año</th><th scope="col">Aportado</th><th scope="col">Capital</th><th scope="col">Ahorro fiscal</th></tr></thead>
                <tbody>
                  {r.tabla.map((f) => <tr><td>{f.anio}</td><td>{euros(f.aportado)}</td><td>{euros(f.saldo)}</td><td>{euros(f.ahorroFiscal)}</td></tr>)}
                </tbody>
              </table>
            )}
          </DesplegablePerezoso>
        </>
      )}
    </form>
  );
}
