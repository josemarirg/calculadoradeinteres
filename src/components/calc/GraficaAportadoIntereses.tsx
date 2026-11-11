import { eurosCompacto, eurosSinCentimos } from '../../lib/formato';

export interface PuntoGrafica {
  anio: number;
  aportado: number;
  saldo: number;
}

/** Paso «redondo» (1, 2, 2,5 o 5 × 10^k) igual o superior al valor dado, para rotular el eje. */
function pasoRedondo(bruto: number): number {
  const base = Math.pow(10, Math.floor(Math.log10(bruto)));
  return base * ([1, 2, 2.5, 5, 10].find((m) => m * base >= bruto - 1e-9) ?? 10);
}

/**
 * Áreas apiladas en SVG propio: capital aportado (abajo) e intereses (arriba).
 * El SVG solo dibuja las formas y se estira al contenedor; los rótulos de los ejes
 * son HTML para que el texto conserve su tamaño en cualquier ancho de pantalla.
 */
interface Props {
  puntos: PuntoGrafica[];
  /** Nombres de las dos series: [la de abajo, la de arriba]. */
  nombres?: [string, string];
  /** Rótulo del eje horizontal para un valor de `anio` distinto de 0. */
  rotuloX?: (x: number) => string;
  rotuloInicio?: string;
  /** Texto alternativo. Si no se indica, se genera uno para ahorro. */
  descripcion?: string;
}

export default function GraficaAportadoIntereses({ puntos, nombres = ['Capital aportado', 'Intereses'], rotuloX = (a) => `Año ${a}`, rotuloInicio = 'Hoy', descripcion: descripcionProp }: Props) {
  const ultimo = puntos[puntos.length - 1];
  const maxAnio = Math.max(1, ultimo.anio);
  const maxDato = Math.max(1, ...puntos.map((p) => Math.max(p.saldo, p.aportado)));
  const paso = pasoRedondo(maxDato / 4);
  const maxY = Math.ceil(maxDato / paso - 1e-9) * paso;
  const x = (anio: number) => ((anio / maxAnio) * 100).toFixed(3);
  const y = (v: number) => (100 - (v / maxY) * 100).toFixed(3);

  const linea = (campo: 'aportado' | 'saldo') => puntos.map((p) => `${x(p.anio)},${y(p[campo])}`).join(' ');
  const areaAportado = `0,100 ${linea('aportado')} 100,100`;
  const areaIntereses = `${linea('saldo')} ${[...puntos].reverse().map((p) => `${x(p.anio)},${y(p.aportado)}`).join(' ')}`;

  const marcasY = Array.from({ length: Math.round(maxY / paso) + 1 }, (_, k) => k * paso);
  const mitad = Math.round(maxAnio / 2);
  const marcasX = maxAnio >= 4 ? [0, mitad, maxAnio] : [0, maxAnio];

  const descripcion = descripcionProp ??
    `Gráfica de áreas. Al cabo de ${ultimo.anio} ${ultimo.anio === 1 ? 'año' : 'años'}, ` +
    `${eurosSinCentimos(ultimo.aportado)} son capital aportado y ` +
    `${eurosSinCentimos(ultimo.saldo - ultimo.aportado)} son intereses. Los datos completos están en la tabla año a año.`;

  return (
    <div>
      <div class="grafica">
        <div class="grafica__ejey" aria-hidden="true">
          {marcasY.map((v) => <span>{eurosCompacto(v)}</span>)}
        </div>
        <div class="grafica__lienzo">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={descripcion}>
            {marcasY.slice(1, -1).map((v) => <line class="guia" x1="0" x2="100" y1={y(v)} y2={y(v)} />)}
            <polygon class="area-aportado" points={areaAportado} />
            <polygon class="area-intereses" points={areaIntereses} />
          </svg>
        </div>
        <div class="grafica__ejex" aria-hidden="true">
          {marcasX.map((a) => <span>{a === 0 ? rotuloInicio : rotuloX(a)}</span>)}
        </div>
      </div>
      <ul class="leyenda">
        <li><span class="punto punto--aportado" /> {nombres[0]}</li>
        <li><span class="punto punto--intereses" /> {nombres[1]}</li>
      </ul>
    </div>
  );
}
