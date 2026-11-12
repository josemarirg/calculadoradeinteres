import { useMemo } from 'preact/hooks';
import { calcularFire, validarFire, type EntradaFire } from '../../lib/calc/fire';
import { euros, parseNumero, porcentaje } from '../../lib/formato';
import GraficaAportadoIntereses from './GraficaAportadoIntereses';
import { BotonCopiar, CampoTexto, DesplegablePerezoso, duracion, Resultado, useEstadoURL, type Esquema } from './ui';

/** Valores de ejemplo: los del ejemplo resuelto de la página y de los tests. Tasa y rentabilidad son hipótesis. */
const EJEMPLO = { g: '24000', ta: '4', p: '50000', a: '1000', r: '4' };
const ESQUEMA: Esquema<typeof EJEMPLO> = { g: 'num', ta: 'num', p: 'num', a: 'num', r: 'num' };

export default function CalculadoraFire({ embed = false, urlPublica }: { embed?: boolean; urlPublica: string }) {
  const { s, cambia, consulta } = useEstadoURL(EJEMPLO, ESQUEMA, embed);
  const vacio = (v: string) => (v.trim() === '' ? 0 : parseNumero(v));
  const entrada = useMemo<EntradaFire>(() => ({
    gastoAnual: parseNumero(s.g),
    tasaRetirada: parseNumero(s.ta) / 100,
    patrimonio: vacio(s.p),
    ahorroMensual: vacio(s.a),
    rentabilidadReal: vacio(s.r) / 100,
  }), [s]);
  const errores = useMemo(() => validarFire(entrada), [entrada]);
  const r = useMemo(() => (Object.keys(errores).length ? null : calcularFire(entrada)), [entrada, errores]);
  const plazo = !r ? '' : r.meses === null ? 'No con estos datos' : r.meses === 0 ? 'Ya lo tienes' : duracion(r.meses);

  return (
    <form class="calc" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Calculadora de jubilación y FIRE">
      <div class="calc__campos">
        <CampoTexto id="fr-g" etiqueta="Gasto anual que quieres cubrir" sufijo="€" valor={s.g} onInput={cambia('g')} error={errores.gastoAnual} />
        <CampoTexto id="fr-p" etiqueta="Patrimonio invertido hoy" sufijo="€" valor={s.p} onInput={cambia('p')} error={errores.patrimonio} placeholder="0" />
        <CampoTexto id="fr-a" etiqueta="Ahorro mensual" sufijo="€" valor={s.a} onInput={cambia('a')} error={errores.ahorroMensual} placeholder="0" />
        <CampoTexto id="fr-r" etiqueta="Rentabilidad sobre la inflación" sufijo="%" valor={s.r} onInput={cambia('r')} error={errores.rentabilidadReal} placeholder="0" />
        <CampoTexto id="fr-ta" etiqueta="Tasa de retirada anual" sufijo="%" valor={s.ta} onInput={cambia('ta')} error={errores.tasaRetirada} ancho />
      </div>
      <Resultado
        etiqueta="Patrimonio que necesitas"
        cifra={r ? euros(r.objetivo) : undefined}
        partidas={r ? [
          { nombre: 'Lo alcanzarías en', valor: plazo },
          { nombre: 'Llevas', valor: porcentaje(Math.min(1, r.progreso), 1) },
          { nombre: 'Te falta', valor: euros(r.falta) },
          { nombre: 'Tu patrimonio de hoy daría al mes', valor: euros(r.rentaMensualActual) },
        ] : []}
        anuncio={r ? `Patrimonio necesario: ${euros(r.objetivo)}. ${r.meses === null ? 'Con estos datos no se alcanza.' : r.meses === 0 ? 'Ya lo has alcanzado.' : `Lo alcanzarías en ${duracion(r.meses)}.`}` : 'Hay campos con errores.'}
      />
      {r && (
        <>
          <p class="aviso">Cifras en euros de hoy. La tasa de retirada es una regla orientativa basada en el pasado, no una garantía.</p>
          <BotonCopiar url={() => `${urlPublica}?${consulta()}`} />
          {r.tabla.length > 0 && (
            <>
              <details class="desplegable" open>
                <summary>Gráfica: lo que aportas y lo que crece</summary>
                <div class="desplegable__cuerpo">
                  <GraficaAportadoIntereses
                    nombres={['Patrimonio inicial y ahorro', 'Rentabilidad']}
                    puntos={[{ anio: 0, aportado: entrada.patrimonio, saldo: entrada.patrimonio }, ...r.tabla]}
                    descripcion={`Gráfica de áreas. El patrimonio pasa de ${euros(entrada.patrimonio)} a ${euros(r.tabla[r.tabla.length - 1].saldo)} en ${r.tabla.length} años. Los datos completos están en la tabla año a año.`}
                  />
                </div>
              </details>
              <DesplegablePerezoso titulo="Tabla año a año">
                {() => (
                  <table class="tabla-cuadro">
                    <caption>Patrimonio al final de cada año, en euros de hoy. La última fila es el momento en que alcanzas el objetivo.</caption>
                    <thead><tr><th scope="col">Año</th><th scope="col">Aportado</th><th scope="col">Patrimonio</th><th scope="col">Del objetivo</th></tr></thead>
                    <tbody>
                      {r.tabla.map((f) => <tr><td>{f.anio}</td><td>{euros(f.aportado)}</td><td>{euros(f.saldo)}</td><td>{porcentaje(f.saldo / r.objetivo, 0)}</td></tr>)}
                    </tbody>
                  </table>
                )}
              </DesplegablePerezoso>
            </>
          )}
        </>
      )}
    </form>
  );
}
