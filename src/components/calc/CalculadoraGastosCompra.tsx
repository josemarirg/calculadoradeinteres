import { useMemo } from 'preact/hooks';
import { calcularGastosCompra, validarGastosCompra, type EntradaGastosCompra } from '../../lib/calc/gastoscompra';
import { euros, numero, parseNumero, porcentaje } from '../../lib/formato';
import { BotonCopiar, CampoSelect, CampoTexto, Resultado, useEstadoURL, type Esquema } from './ui';

export interface ComunidadCompra {
  id: string;
  nombre: string;
  itp: number;
  ajd: number | null;
  nota?: string;
}

interface Props {
  /** Tipos generales por comunidad, desde la configuración fiscal. */
  comunidades: ComunidadCompra[];
  /** IVA de la vivienda nueva, en tanto por uno. */
  iva: number;
  embed?: boolean;
  urlPublica: string;
}

/**
 * Valores de ejemplo: los del ejemplo resuelto de la página y de los tests.
 * Los tipos de impuesto (imp, ajd) salen vacíos: se aplican los de la comunidad elegida.
 * Los 1.500 € de notaría, registro y gestoría son una estimación editable.
 */
const EJEMPLO = { p: '200000', v: 'u', ca: 'an', imp: '', ajd: '', g: '1500', o: '', en: '20' };

export default function CalculadoraGastosCompra({ comunidades, iva, embed = false, urlPublica }: Props) {
  const ESQUEMA = useMemo<Esquema<typeof EJEMPLO>>(
    () => ({ p: 'num', v: ['u', 'n'], ca: comunidades.map((c) => c.id), imp: 'num', ajd: 'num', g: 'num', o: 'num', en: 'num' }),
    [comunidades],
  );
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const nueva = s.v === 'n';
  const ca = comunidades.find((c) => c.id === s.ca) ?? comunidades[0];
  const tipoPorDefecto = nueva ? iva : ca.itp;
  const vacio = (v: string) => v.trim() === '';

  const entrada = useMemo<EntradaGastosCompra>(() => ({
    precio: parseNumero(s.p),
    vivienda: nueva ? 'nueva' : 'usada',
    tipoImpuesto: vacio(s.imp) ? tipoPorDefecto : parseNumero(s.imp) / 100,
    tipoAjd: vacio(s.ajd) ? ca.ajd ?? NaN : parseNumero(s.ajd) / 100,
    gastosFijos: vacio(s.g) ? 0 : parseNumero(s.g),
    otros: vacio(s.o) ? 0 : parseNumero(s.o),
    entrada: vacio(s.en) ? 0 : parseNumero(s.en) / 100,
  }), [s, nueva, ca, tipoPorDefecto]);
  const faltaAjd = nueva && vacio(s.ajd) && ca.ajd === null;
  const errores = useMemo(() => {
    const e = validarGastosCompra(entrada);
    if (faltaAjd) delete e.tipoAjd;
    return e;
  }, [entrada, faltaAjd]);
  const r = useMemo(() => (Object.keys(errores).length || faltaAjd ? null : calcularGastosCompra(entrada)), [entrada, errores, faltaAjd]);
  const nombreImpuesto = nueva ? 'IVA' : 'ITP';

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de gastos de compra de una vivienda">
      <div class="calc__campos">
        <CampoTexto id="gc-p" etiqueta="Precio de la vivienda" sufijo="€" valor={s.p} onInput={cambia('p')} error={errores.precio} />
        <CampoSelect id="gc-v" etiqueta="Vivienda" valor={s.v} onChange={cambia('v')} opciones={[['u', 'Segunda mano'], ['n', 'Nueva']]} />
        <CampoSelect id="gc-ca" etiqueta="Comunidad autónoma" valor={s.ca} onChange={cambia('ca')} opciones={comunidades.map((c) => [c.id, c.nombre] as const)} />
        <CampoTexto id="gc-imp" etiqueta={`Tipo de ${nombreImpuesto}`} sufijo="%" valor={s.imp} onInput={cambia('imp')} error={errores.tipoImpuesto} placeholder={numero(tipoPorDefecto * 100)} />
        {nueva && <CampoTexto id="gc-ajd" etiqueta="Tipo de AJD" sufijo="%" valor={s.ajd} onInput={cambia('ajd')} error={errores.tipoAjd} placeholder={ca.ajd === null ? '' : numero(ca.ajd * 100)} />}
        <CampoTexto id="gc-g" etiqueta="Notaría, registro, gestoría" sufijo="€" valor={s.g} onInput={cambia('g')} error={errores.gastosFijos} ancho={!nueva} />
        <p class="calc__nota">{ca.nota ? `${ca.nota} ` : ''}Tipo general: cámbialo si te corresponde otro.</p>
      </div>
      <details class="desplegable">
        <summary><span class="resumen-fijo">Más opciones</span><span class="resumen-suave">entrada, otros gastos</span></summary>
        <div class="desplegable__cuerpo calc__campos">
          <CampoTexto id="gc-en" etiqueta="Entrada" sufijo="%" valor={s.en} onInput={cambia('en')} error={errores.entrada} />
          <CampoTexto id="gc-o" etiqueta="Otros gastos" sufijo="€" valor={s.o} onInput={cambia('o')} error={errores.otros} placeholder="0"
            ayuda="Por ejemplo, la tasación si pides hipoteca." />
        </div>
      </details>
      <Resultado
        etiqueta="Impuestos y gastos de la compra"
        cifra={r ? euros(r.totalGastos) : undefined}
        mensaje={faltaAjd && Object.keys(errores).length === 0 ? 'Indica el tipo de AJD de tu territorio para ver el resultado.' : undefined}
        partidas={r ? [
          { nombre: `${nombreImpuesto} (${porcentaje(entrada.tipoImpuesto, 2).replace(',00', '')})`, valor: euros(r.impuesto) },
          nueva
            ? { nombre: `AJD (${porcentaje(entrada.tipoAjd ?? 0, 2).replace(',00', '')})`, valor: euros(r.ajd) }
            : { nombre: 'Notaría, registro, gestoría', valor: euros(r.gastosFijos) },
          { nombre: 'Gastos sobre el precio', valor: porcentaje(r.porcentaje) },
          { nombre: `Ahorro necesario (entrada del ${porcentaje(entrada.entrada, 0)})`, valor: euros(r.ahorroNecesario) },
        ] : []}
        anuncio={r ? `Impuestos y gastos: ${euros(r.totalGastos)}. Ahorro necesario contando la entrada: ${euros(r.ahorroNecesario)}.` : faltaAjd ? 'Falta el tipo de AJD.' : 'Hay campos con errores.'}
      />
      {r && <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />}
    </form>
  );
}
