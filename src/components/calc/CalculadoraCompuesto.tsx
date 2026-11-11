import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { calcularCompuesto, validarCompuesto, type Capitalizacion, type EntradaCompuesto } from '../../lib/calc/compuesto';
import { euros, numero, parseNumero } from '../../lib/formato';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';

/** Estado del formulario: lo que la persona ha escrito, tal cual. */
interface Estado {
  c: string; // capital inicial
  a: string; // aportación
  fa: 'm' | 'a'; // frecuencia de aportación
  mo: 'f' | 'i'; // momento: final o inicio del periodo
  t: string; // tipo anual, en %
  n: string; // años
  cap: string; // capitalizaciones por año
  inf: string; // inflación, en %
  mr: 'no' | 'a' | 'f'; // retención: no, anual, al final
  ret: string; // retención, en %
}

/** Valores de ejemplo. Son los del ejemplo resuelto de la página y de los tests. */
export const EJEMPLO: Estado = { c: '10000', a: '200', fa: 'm', mo: 'f', t: '5', n: '20', cap: '12', inf: '', mr: 'no', ret: '' };

const OPC_CAP: [string, string][] = [['1', 'Anual'], ['2', 'Semestral'], ['4', 'Trimestral'], ['12', 'Mensual'], ['365', 'Diaria']];

function aEntrada(s: Estado, retencionPorDefecto: number): EntradaCompuesto {
  const vacioEsCero = (v: string) => (v.trim() === '' ? 0 : parseNumero(v));
  const ret = s.ret.trim() === '' ? retencionPorDefecto : parseNumero(s.ret) / 100;
  return {
    capitalInicial: vacioEsCero(s.c),
    aportacion: vacioEsCero(s.a),
    frecuenciaAportacion: s.fa === 'a' ? 'anual' : 'mensual',
    momento: s.mo === 'i' ? 'inicio' : 'final',
    tipoAnual: parseNumero(s.t) / 100,
    anios: parseNumero(s.n),
    capitalizacionesPorAnio: Number(s.cap) as Capitalizacion,
    inflacion: vacioEsCero(s.inf) / 100,
    retencion: s.mr === 'no' ? 0 : ret,
    modoRetencion: s.mr === 'f' ? 'final' : 'anual',
  };
}

/** Lee el estado de los parámetros de la URL. Ignora lo que no reconoce. */
function deURL(busqueda: string): Partial<Estado> {
  const p = new URLSearchParams(busqueda);
  const s: Partial<Estado> = {};
  const texto = (k: 'c' | 'a' | 't' | 'n' | 'inf' | 'ret') => {
    const v = p.get(k);
    if (v !== null && /^[\d.,]{1,14}$/.test(v)) s[k] = v.replace('.', ',');
  };
  (['c', 'a', 't', 'n', 'inf', 'ret'] as const).forEach(texto);
  const fa = p.get('fa'); if (fa === 'm' || fa === 'a') s.fa = fa;
  const mo = p.get('mo'); if (mo === 'f' || mo === 'i') s.mo = mo;
  const mr = p.get('mr'); if (mr === 'a' || mr === 'f') s.mr = mr;
  const cap = p.get('cap'); if (cap && OPC_CAP.some(([v]) => v === cap)) s.cap = cap;
  return s;
}

/** Parámetros para compartir: solo números de la simulación, ningún dato personal. */
function aURL(s: Estado): string {
  const p = new URLSearchParams();
  const num = (v: string) => { const x = parseNumero(v); return Number.isFinite(x) ? String(x) : ''; };
  p.set('c', num(s.c) || '0');
  p.set('a', num(s.a) || '0');
  p.set('t', num(s.t));
  p.set('n', num(s.n));
  if (s.fa !== EJEMPLO.fa) p.set('fa', s.fa);
  if (s.mo !== EJEMPLO.mo) p.set('mo', s.mo);
  if (s.cap !== EJEMPLO.cap) p.set('cap', s.cap);
  if (num(s.inf) && num(s.inf) !== '0') p.set('inf', num(s.inf));
  if (s.mr !== 'no') { p.set('mr', s.mr); if (num(s.ret)) p.set('ret', num(s.ret)); }
  return p.toString();
}

interface Props {
  /** Retención sobre intereses de la configuración fiscal, en tanto por uno. */
  retencionPorDefecto: number;
  /** Versión para iframe: sin sincronizar la URL de la página que la aloja. */
  embed?: boolean;
  /** URL pública de la calculadora, para el enlace compartido. */
  urlPublica: string;
}

export default function CalculadoraCompuesto({ retencionPorDefecto, embed = false, urlPublica }: Props) {
  const [s, setS] = useState<Estado>(EJEMPLO);
  const [copiado, setCopiado] = useState('');
  const cargado = useRef(false);

  // Al cargar, aplica los parámetros de la URL (si los hay).
  useEffect(() => {
    const deLaUrl = deURL(location.search);
    if (Object.keys(deLaUrl).length) setS((prev) => ({ ...prev, ...deLaUrl }));
    cargado.current = true;
  }, []);

  // Mantiene la URL al día para que se pueda copiar desde la barra del navegador.
  useEffect(() => {
    if (!cargado.current || embed) return;
    const q = aURL(s);
    const esEjemplo = JSON.stringify(s) === JSON.stringify(EJEMPLO);
    history.replaceState(null, '', esEjemplo ? location.pathname : `${location.pathname}?${q}`);
  }, [s, embed]);

  const entrada = useMemo(() => aEntrada(s, retencionPorDefecto), [s, retencionPorDefecto]);
  const errores = useMemo(() => validarCompuesto(entrada), [entrada]);
  const valido = Object.keys(errores).length === 0;
  const r = useMemo(() => (valido ? calcularCompuesto(entrada) : null), [entrada, valido]);

  const cambia = (k: keyof Estado) => (e: Event) => {
    setCopiado('');
    setS((prev) => ({ ...prev, [k]: (e.currentTarget as HTMLInputElement | HTMLSelectElement).value }));
  };

  async function copiarEnlace() {
    const enlace = `${urlPublica}?${aURL(s)}`;
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado('Enlace copiado.');
    } catch {
      setCopiado(`Copia este enlace: ${enlace}`);
    }
  }

  const conInflacion = (entrada.inflacion ?? 0) > 0 && !errores.inflacion;
  const conRetencion = s.mr !== 'no';
  const anios = entrada.anios;
  const pctDefecto = numero(retencionPorDefecto * 100);

  const campoTexto = (k: 'c' | 'a' | 't' | 'n' | 'inf' | 'ret', campo: string, etiqueta: string, sufijo: string, extra: { ayuda?: string; placeholder?: string; entero?: boolean } = {}) => {
    const id = `ic-${k}`;
    const error = errores[campo];
    const describe = [error && `${id}-error`, extra.ayuda && `${id}-ayuda`].filter(Boolean).join(' ') || undefined;
    return (
      <div class="campo">
        <label for={id}>{etiqueta}</label>
        <div class="campo__caja">
          <input
            id={id}
            type="text"
            inputMode={extra.entero ? 'numeric' : 'decimal'}
            autoComplete="off"
            value={s[k]}
            placeholder={extra.placeholder}
            onInput={cambia(k)}
            onFocus={(e) => e.currentTarget.select()}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describe}
          />
          <span class="campo__sufijo" aria-hidden="true">{sufijo}</span>
        </div>
        {error && <p class="campo__error" id={`${id}-error`}>{error}</p>}
        {extra.ayuda && <p class="campo__ayuda" id={`${id}-ayuda`}>{extra.ayuda}</p>}
      </div>
    );
  };

  const campoSelect = (k: 'fa' | 'mo' | 'cap' | 'mr', etiqueta: string, opciones: [string, string][], ancho = false) => (
    <div class={`campo${ancho ? ' campo--ancho' : ''}`}>
      <label for={`ic-${k}`}>{etiqueta}</label>
      <select id={`ic-${k}`} value={s[k]} onChange={cambia(k)}>
        {opciones.map(([v, t]) => <option value={v} selected={s[k] === v}>{t}</option>)}
      </select>
    </div>
  );

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de interés compuesto">
      <div class="calc__campos">
        {campoTexto('c', 'capitalInicial', 'Capital inicial', '€')}
        {campoTexto('a', 'aportacion', s.fa === 'a' ? 'Aportación anual' : 'Aportación mensual', '€')}
        {campoTexto('t', 'tipoAnual', 'Interés anual', '%')}
        {campoTexto('n', 'anios', 'Duración', 'años', { entero: true })}
      </div>

      <details class="desplegable">
        <summary><span class="resumen-fijo">Más opciones</span><span class="resumen-suave">frecuencia, inflación, impuestos</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          {campoSelect('fa', 'Aportas cada', [['m', 'Mes'], ['a', 'Año']])}
          {campoSelect('mo', 'Cuándo aportas', [['f', 'Al final'], ['i', 'Al inicio']])}
          {campoSelect('cap', 'Capitalización', OPC_CAP)}
          {campoTexto('inf', 'inflacion', 'Inflación anual', '%', { placeholder: '0' })}
          {campoSelect('mr', 'Retención fiscal', [
            ['no', 'Sin retención'],
            ['a', 'Cada año (cuentas y depósitos)'],
            ['f', 'Al final, sobre la ganancia (fondos)'],
          ], true)}
          {conRetencion && campoTexto('ret', 'retencion', 'Retención', '%', { placeholder: pctDefecto, ayuda: `Si lo dejas vacío se aplica el ${pctDefecto} %.` })}
        </div>
      </details>

      {r ? (
        <div class="resultado">
          <p class="resultado__etiqueta">Capital final en {anios} {anios === 1 ? 'año' : 'años'}</p>
          <p class="resultado__cifra">{euros(r.valorFinal)}</p>
          <dl class="resultado__desglose">
            <div>
              <dt><span class="punto punto--aportado" /> Has aportado</dt>
              <dd>{euros(r.totalAportado)}</dd>
            </div>
            <div>
              <dt><span class="punto punto--intereses" /> {conRetencion ? 'Intereses netos' : 'Intereses'}</dt>
              <dd>{euros(r.interesesNetos)}</dd>
            </div>
            {conRetencion && (
              <div>
                <dt>Retención</dt>
                <dd>{euros(r.retencionTotal)}</dd>
              </div>
            )}
            {conInflacion && (
              <div>
                <dt>En euros de hoy</dt>
                <dd>{euros(r.valorFinalReal)}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <div class="resultado resultado--error">
          <p class="resultado__etiqueta">Revisa los campos marcados para ver el resultado.</p>
        </div>
      )}
      <p class="solo-lectores" role="status" aria-live="polite" aria-atomic="true">
        {r
          ? `Capital final: ${euros(r.valorFinal)}. Aportado: ${euros(r.totalAportado)}. Intereses: ${euros(r.interesesNetos)}.`
          : 'Hay campos con errores.'}
      </p>
      <p class="aviso">Resultados orientativos. No constituye asesoramiento financiero.</p>

      {r && (
        <>
          <div class="acciones">
            <button type="button" class="boton" onClick={copiarEnlace}>Copiar enlace a este cálculo</button>
            <span class="acciones__estado" role="status">{copiado}</span>
          </div>

          <details class="desplegable" open>
            <summary>Gráfica: capital aportado frente a intereses</summary>
            <div class="desplegable__cuerpo">
              <GraficaAportadoIntereses
                puntos={[
                  { anio: 0, aportado: entrada.capitalInicial, saldo: entrada.capitalInicial },
                  ...r.tabla.map((f) => ({ anio: f.anio, aportado: f.aportado, saldo: f.saldo })),
                ]}
              />
            </div>
          </details>

          <details class="desplegable">
            <summary>Tabla año a año</summary>
            <div class="desplegable__cuerpo tabla-scroll">
              <table>
                <caption>Saldo al final de cada año. Importes acumulados.</caption>
                <thead>
                  <tr>
                    <th scope="col">Año</th>
                    <th scope="col">Aportado</th>
                    <th scope="col">{conRetencion ? 'Intereses netos' : 'Intereses'}</th>
                    {conRetencion && <th scope="col">Retención</th>}
                    <th scope="col">Saldo</th>
                    {conInflacion && <th scope="col">En euros de hoy</th>}
                  </tr>
                </thead>
                <tbody>
                  {r.tabla.map((f) => (
                    <tr>
                      <td>{f.anio}</td>
                      <td>{euros(f.aportado)}</td>
                      <td>{euros(f.intereses)}</td>
                      {conRetencion && <td>{euros(f.retenido)}</td>}
                      <td>{euros(f.saldo)}</td>
                      {conInflacion && <td>{euros(f.saldoReal)}</td>}
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
