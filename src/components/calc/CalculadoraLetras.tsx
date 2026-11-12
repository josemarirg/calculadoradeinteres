import { useMemo } from 'preact/hooks';
import { calcularLetras, validarLetras, type EntradaLetras } from '../../lib/calc/letras';
import { euros, numero, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. El 2 % es un tipo de ejemplo, no el de la última subasta. */
const EJEMPLO = { n: '10000', d: '364', m: 't', t: '2', p: '', com: '' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { n: 'num', d: 'num', m: ['t', 'p'], t: 'num', p: 'num', com: 'num' };

interface Props {
  /** Tipo del primer tramo de la escala del ahorro, para la estimación del IRPF. */
  tipoIrpf: number;
  embed?: boolean;
  urlPublica: string;
}

export default function CalculadoraLetras({ tipoIrpf, embed = false, urlPublica }: Props) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const porTipo = s.m === 't';
  const faltaDato = (porTipo ? s.t : s.p).trim() === '';
  const entrada = useMemo<EntradaLetras>(() => ({
    nominal: parseNumero(s.n),
    dias: parseNumero(s.d),
    modo: porTipo ? 'tipo' : 'precio',
    tipo: parseNumero(s.t) / 100,
    precio: parseNumero(s.p),
    comisiones: s.com.trim() === '' ? 0 : parseNumero(s.com),
    tipoIrpf,
  }), [s, porTipo, tipoIrpf]);
  const errores = useMemo(() => {
    const e = validarLetras(entrada);
    // Un campo vacío todavía no es un error: se pide con un mensaje en el resultado.
    if (faltaDato) { delete e.tipo; delete e.precio; }
    return e;
  }, [entrada, faltaDato]);
  const r = useMemo(() => (Object.keys(errores).length || faltaDato ? null : calcularLetras(entrada)), [entrada, errores, faltaDato]);
  const conComisiones = !!r && r.comisiones > 0;

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de Letras del Tesoro">
      <div class="calc__campos">
        <CampoTexto id="lt-n" etiqueta="Importe nominal" sufijo="€" valor={s.n} onInput={cambia('n')} error={errores.nominal} entero />
        <CampoTexto id="lt-d" etiqueta="Días hasta el vencimiento" sufijo="días" valor={s.d} onInput={cambia('d')} error={errores.dias} entero />
        <CampoSelect id="lt-m" etiqueta="Qué dato conoces" valor={s.m} onChange={cambia('m')} opciones={[['t', 'El tipo de interés'], ['p', 'El precio']]} />
        {porTipo ? (
          <CampoTexto id="lt-t" etiqueta="Tipo de interés" sufijo="%" valor={s.t} onInput={cambia('t')} error={errores.tipo} conSigno />
        ) : (
          <CampoTexto id="lt-p" etiqueta="Precio (sobre 100)" sufijo="%" valor={s.p} onInput={cambia('p')} error={errores.precio} placeholder="98,352" />
        )}
      </div>
      <details class="desplegable">
        <summary><span class="resumen-fijo">Más opciones</span><span class="resumen-suave">comisiones</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          <CampoTexto id="lt-com" etiqueta="Comisiones de la operación" sufijo="€" valor={s.com} onInput={cambia('com')} error={errores.comisiones} placeholder="0" ancho
            ayuda="Suma lo que te cobre el intermediario por comprar, custodiar y transferirte el dinero." />
        </div>
      </details>
      <Resultado
        etiqueta={conComisiones ? 'Ganancia antes de impuestos, descontadas las comisiones' : 'Ganancia antes de impuestos'}
        cifra={r ? euros(r.rendimientoNeto) : undefined}
        mensaje={faltaDato && Object.keys(errores).length === 0 ? (porTipo ? 'Indica el tipo de interés de la Letra para ver el resultado.' : 'Indica el precio de la Letra para ver el resultado.') : undefined}
        partidas={r ? [
          { nombre: 'Pagas hoy', valor: euros(r.importeInvertido), punto: 'aportado' },
          { nombre: 'Cobras al vencimiento', valor: euros(entrada.nominal) },
          porTipo ? { nombre: 'Precio de compra', valor: `${numero(Math.round(r.precio * 1000) / 1000)} %` } : { nombre: 'Tipo de interés', valor: porcentaje(r.tipo, 3) },
          conComisiones ? { nombre: 'Tipo tras comisiones', valor: porcentaje(r.tipoTrasComisiones, 3) } : { nombre: 'TAE equivalente', valor: porcentaje(r.taeEquivalente, 3) },
          { nombre: `IRPF orientativo (${porcentaje(tipoIrpf, 0)})`, valor: euros(r.irpf) },
          { nombre: 'Ganancia tras impuestos', valor: euros(r.rendimientoTrasImpuestos), punto: 'intereses' },
        ] : []}
        anuncio={r ? `Ganancia antes de impuestos: ${euros(r.rendimientoNeto)}. Pagas hoy ${euros(r.importeInvertido)} y cobras ${euros(entrada.nominal)} al vencimiento.` : faltaDato ? 'Falta un dato.' : 'Hay campos con errores.'}
      />
      {r && <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />}
    </form>
  );
}
