/** Piezas de interfaz compartidas por las calculadoras. */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { parseNumero } from '../../lib/formato';

/** Para cada clave del estado: 'num' (texto numérico) o la lista de opciones válidas. */
export type Esquema<S> = { [K in keyof S]: 'num' | readonly string[] };

/** Parámetros de la URL para compartir: solo cifras de la simulación, ningún dato personal. */
export function consulta<S extends Record<string, string>>(s: S, ejemplo: S, esquema: Esquema<S>): string {
  if ((Object.keys(esquema) as (keyof S)[]).every((k) => s[k] === ejemplo[k])) return '';
  const p = new URLSearchParams();
  for (const k of Object.keys(esquema) as (keyof S & string)[]) {
    if (esquema[k] === 'num') {
      const n = parseNumero(s[k]);
      if (Number.isFinite(n)) p.set(k, String(n));
    } else {
      p.set(k, s[k]);
    }
  }
  return p.toString();
}

/**
 * Estado del formulario sincronizado con la URL: al cargar lee los parámetros
 * (ignorando lo que no reconoce) y después mantiene la URL al día.
 */
export function useEstadoURL<S extends Record<string, string>>(ejemplo: S, esquema: Esquema<S>, embed: boolean) {
  const [s, setS] = useState<S>(ejemplo);
  const cargado = useRef(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const leido: Partial<S> = {};
    for (const k of Object.keys(esquema) as (keyof S & string)[]) {
      const v = p.get(k);
      if (v === null) continue;
      const regla = esquema[k];
      if (regla === 'num') {
        if (/^-?[\d.,]{1,14}$/.test(v)) leido[k] = v.replace('.', ',') as S[typeof k];
      } else if (regla.includes(v)) {
        leido[k] = v as S[typeof k];
      }
    }
    if (Object.keys(leido).length) setS((prev) => ({ ...prev, ...leido }));
    cargado.current = true;
  }, []);

  useEffect(() => {
    if (!cargado.current || embed) return;
    const q = consulta(s, ejemplo, esquema);
    history.replaceState(null, '', q ? `${location.pathname}?${q}` : location.pathname);
  }, [s, embed]);

  const cambia = (k: keyof S) => (e: Event) => {
    const valor = (e.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    setS((prev) => ({ ...prev, [k]: valor }));
  };
  return { s, cambia, consulta: () => consulta(s, ejemplo, esquema) };
}

interface PropsTexto {
  id: string;
  etiqueta: string;
  sufijo: string;
  valor: string;
  onInput: (e: Event) => void;
  error?: string;
  ayuda?: ComponentChildren;
  placeholder?: string;
  entero?: boolean;
  /** Permite escribir el signo menos (Euríbor negativo). */
  conSigno?: boolean;
  ancho?: boolean;
}

export function CampoTexto({ id, etiqueta, sufijo, valor, onInput, error, ayuda, placeholder, entero, conSigno, ancho }: PropsTexto) {
  const describe = [error && `${id}-error`, ayuda && `${id}-ayuda`].filter(Boolean).join(' ') || undefined;
  return (
    <div class={`campo${ancho ? ' campo--ancho' : ''}`}>
      <label for={id}>{etiqueta}</label>
      <div class="campo__caja">
        <input
          id={id}
          type="text"
          inputMode={conSigno ? 'text' : entero ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={valor}
          placeholder={placeholder}
          onInput={onInput}
          onFocus={(e) => e.currentTarget.select()}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describe}
        />
        <span class="campo__sufijo" aria-hidden="true">{sufijo}</span>
      </div>
      {error && <p class="campo__error" id={`${id}-error`}>{error}</p>}
      {ayuda && <p class="campo__ayuda" id={`${id}-ayuda`}>{ayuda}</p>}
    </div>
  );
}

interface PropsSelect {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (e: Event) => void;
  opciones: readonly (readonly [string, string])[];
  ancho?: boolean;
}

export function CampoSelect({ id, etiqueta, valor, onChange, opciones, ancho }: PropsSelect) {
  return (
    <div class={`campo${ancho ? ' campo--ancho' : ''}`}>
      <label for={id}>{etiqueta}</label>
      <select id={id} value={valor} onChange={onChange}>
        {opciones.map(([v, t]) => <option value={v} selected={valor === v}>{t}</option>)}
      </select>
    </div>
  );
}

export interface Partida {
  nombre: string;
  valor: string;
  punto?: 'aportado' | 'intereses';
}

/** Resultado principal grande con su desglose. Si no hay cifra, muestra el mensaje. */
export function Resultado({ etiqueta, cifra, partidas = [], mensaje, anuncio }: { etiqueta?: string; cifra?: string; partidas?: Partida[]; mensaje?: string; anuncio: string }) {
  return (
    <>
      {cifra ? (
        <div class="resultado">
          <p class="resultado__etiqueta">{etiqueta}</p>
          <p class="resultado__cifra">{cifra}</p>
          <dl class="resultado__desglose">
            {partidas.map((p) => (
              <div>
                <dt>{p.punto && <span class={`punto punto--${p.punto}`} />} {p.nombre}</dt>
                <dd>{p.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div class="resultado resultado--error">
          <p class="resultado__etiqueta">{mensaje ?? 'Revisa los campos marcados para ver el resultado.'}</p>
        </div>
      )}
      <p class="solo-lectores" role="status" aria-live="polite" aria-atomic="true">{anuncio}</p>
      <p class="aviso">Resultados orientativos. No constituye asesoramiento financiero.</p>
    </>
  );
}

export function BotonCopiar({ url }: { url: () => string }) {
  const [estado, setEstado] = useState('');
  async function copiar() {
    const enlace = url();
    try {
      await navigator.clipboard.writeText(enlace);
      setEstado('Enlace copiado.');
    } catch {
      setEstado(`Copia este enlace: ${enlace}`);
    }
  }
  return (
    <div class="acciones">
      <button type="button" class="boton" onClick={copiar}>Copiar enlace a este cálculo</button>
      <span class="acciones__estado" role="status">{estado}</span>
    </div>
  );
}

/** Desplegable que solo construye su contenido cuando se abre (tablas largas). */
export function DesplegablePerezoso({ titulo, children }: { titulo: string; children: () => ComponentChildren }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <details class="desplegable" onToggle={(e) => setAbierto((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>{titulo}</summary>
      {abierto && <div class="desplegable__cuerpo tabla-scroll">{children()}</div>}
    </details>
  );
}

/** 47 → «3 años y 11 meses» */
export function duracion(meses: number): string {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const partes = [a > 0 && `${a} ${a === 1 ? 'año' : 'años'}`, m > 0 && `${m} ${m === 1 ? 'mes' : 'meses'}`].filter(Boolean);
  return partes.join(' y ') || '0 meses';
}
