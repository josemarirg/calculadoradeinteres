import type { FilaAmortizacion } from '../../lib/calc/prestamo';
import { euros } from '../../lib/formato';

export default function CuadroAmortizacion({ filas }: { filas: FilaAmortizacion[] }) {
  return (
    <table class="tabla-cuadro">
      <caption>Cuadro de amortización, cuota a cuota.</caption>
      <thead>
        <tr>
          <th scope="col">Cuota</th>
          <th scope="col">Importe</th>
          <th scope="col">Intereses</th>
          <th scope="col">Capital</th>
          <th scope="col">Pendiente</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr>
            <td>{f.n}</td>
            <td>{euros(f.cuota)}</td>
            <td>{euros(f.intereses)}</td>
            <td>{euros(f.amortizacion)}</td>
            <td>{euros(f.saldo)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Puntos para la gráfica: capital devuelto e intereses pagados, acumulados mes a mes. */
export function puntosDeCuadro(filas: FilaAmortizacion[], extra?: { trasCuota: number; importe: number }) {
  // Una amortización anticipada es capital devuelto de golpe: se suma desde la cuota en que se hace.
  let capital = extra && extra.trasCuota === 0 ? extra.importe : 0;
  let intereses = 0;
  return [
    { anio: 0, aportado: 0, saldo: 0 },
    ...filas.map((f) => {
      capital += f.amortizacion;
      intereses += f.intereses;
      if (extra && extra.trasCuota === f.n) capital += extra.importe;
      return { anio: f.n, aportado: capital, saldo: capital + intereses };
    }),
  ];
}
