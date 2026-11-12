import { useEffect, useMemo, useState } from 'preact/hooks';
import { calcularDeudas, DEUDAS_MAX, validarDeudas, type EntradaDeudas } from '../../lib/calc/deudas';
import { euros, parseNumero } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/**
 * Valores de ejemplo: los del ejemplo resuelto de la página y de los tests.
 * Cada deuda k tiene saldo (s), TIN (t) y cuota (q). Las filas vacías se ignoran.
 */
const EJEMPLO = {
  s1: '6000', t1: '20', q1: '150',
  s2: '2000', t2: '7', q2: '60',
  s3: '', t3: '', q3: '',
  s4: '', t4: '', q4: '',
  s5: '', t5: '', q5: '',
  x: '100', m: 'a',
};
type Estado = typeof EJEMPLO;
const ESQUEMA: Esquema<Estado> = {
  s1: 'num', t1: 'num', q1: 'num', s2: 'num', t2: 'num', q2: 'num', s3: 'num', t3: 'num', q3: 'num',
  s4: 'num', t4: 'num', q4: 'num', s5: 'num', t5: 'num', q5: 'num', x: 'num', m: ['a', 'b'],
};
const FILAS = Array.from({ length: DEUDAS_MAX }, (_, k) => k + 1);
const clave = (letra: 's' | 't' | 'q', n: number) => `${letra}${n}` as keyof Estado;

export default function CalculadoraDeudas({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const rellena = (n: number) => (['s', 't', 'q'] as const).some((l) => s[clave(l, n)].trim() !== '');
  /** Filas con algún dato: son las que entran en el cálculo. */
  const usadas = FILAS.filter(rellena);
  const [visibles, setVisibles] = useState(2);
  useEffect(() => { setVisibles((v) => Math.max(v, ...usadas, 2)); }, [usadas.join()]);

  const entrada = useMemo<EntradaDeudas>(() => ({
    deudas: usadas.map((n) => ({
      saldo: parseNumero(s[clave('s', n)]),
      tin: parseNumero(s[clave('t', n)]) / 100,
      cuota: parseNumero(s[clave('q', n)]),
    })),
    extra: s.x.trim() === '' ? 0 : parseNumero(s.x),
    metodo: s.m === 'b' ? 'bola' : 'avalancha',
  }), [s]);
  const errores = useMemo(() => validarDeudas(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularDeudas(entrada)), [entrada, errores]);
  /** Error del campo de la fila n: la validación numera según la posición entre las filas usadas. */
  const error = (campo: string, n: number) => errores[`${campo}${usadas.indexOf(n) + 1}`];

  const avalancha = entrada.metodo === 'avalancha';
  const otro = r ? (avalancha ? r.bola : r.avalancha) : null;
  const ahorro = r?.soloCuotas ? r.soloCuotas.intereses - r.elegido.intereses : null;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora para liquidar deudas">
      {FILAS.slice(0, visibles).map((n) => (
        <fieldset class="deuda">
          <legend>Deuda {n}</legend>
          <div class="calc__campos calc__campos--3">
            <CampoTexto id={`ld-s${n}`} etiqueta="Pendiente" sufijo="€" valor={s[clave('s', n)]} onInput={cambia(clave('s', n))} error={error('saldo', n)} />
            <CampoTexto id={`ld-t${n}`} etiqueta="TIN" sufijo="%" valor={s[clave('t', n)]} onInput={cambia(clave('t', n))} error={error('tin', n)} />
            <CampoTexto id={`ld-q${n}`} etiqueta="Cuota" sufijo="€" valor={s[clave('q', n)]} onInput={cambia(clave('q', n))} error={error('cuota', n)} />
          </div>
        </fieldset>
      ))}
      {visibles < DEUDAS_MAX && (
        <p class="calc__mas"><button type="button" class="boton-texto" onClick={() => setVisibles((v) => v + 1)}>+ Añadir otra deuda</button></p>
      )}
      <div class="calc__campos">
        <CampoTexto id="ld-x" etiqueta="Extra al mes" sufijo="€" valor={s.x} onInput={cambia('x')} error={errores.extra} placeholder="0" />
        <CampoSelect id="ld-m" etiqueta="Primero pagas la de" valor={s.m} onChange={cambia('m')} opciones={[['a', 'Más interés'], ['b', 'Menos saldo']]} />
      </div>
      <Resultado
        etiqueta="Libre de deudas en"
        cifra={r ? duracion(r.elegido.meses) : undefined}
        mensaje={errores.deudas}
        partidas={r && otro ? [
          { nombre: 'Intereses totales', valor: euros(r.elegido.intereses), punto: 'intereses' },
          { nombre: 'Pagas cada mes', valor: euros(r.presupuestoMensual) },
          { nombre: avalancha ? 'Empezando por la de menos saldo' : 'Empezando por la de más interés', valor: euros(otro.intereses) },
          ahorro !== null
            ? { nombre: 'Ahorro frente a solo las cuotas', valor: euros(ahorro) }
            : { nombre: 'Pagando solo las cuotas', valor: 'No se liquidan' },
        ] : []}
        anuncio={r ? `Libre de deudas en ${duracion(r.elegido.meses)}, con ${euros(r.elegido.intereses)} de intereses.` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          <details class="desplegable" open>
            <summary>Orden en que liquidas cada deuda</summary>
            <div class="desplegable__cuerpo">
              <ol class="lista-orden">
                {r.elegido.orden.map((o) => {
                  const n = usadas[o.indice];
                  return <li>Deuda {n} ({euros(entrada.deudas[o.indice].saldo)}): liquidada en el mes {o.mes}, a los {duracion(o.mes)}.</li>;
                })}
              </ol>
              <p class="campo__ayuda">
                Cuando liquidas una deuda, su cuota se suma a lo que pagas por la siguiente.
                {r.soloCuotas && ` Pagando solo las cuotas actuales tardarías ${duracion(r.soloCuotas.meses)} y pagarías ${euros(r.soloCuotas.intereses)} de intereses.`}
              </p>
            </div>
          </details>
        </>
      )}
    </form>
  );
}
