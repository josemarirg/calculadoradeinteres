/** /llms.txt: resumen del sitio para modelos de lenguaje, generado desde el registro de calculadoras. */
import type { APIRoute } from 'astro';
import { CALCULADORAS, CLUSTERES, SITIO } from '../config/sitio';

export const GET: APIRoute = () => {
  const lineas = [
    `# ${SITIO.nombre}`,
    '',
    `> ${SITIO.descripcion}`,
    '',
    'Sitio en español dirigido a residentes en España. Los cálculos se hacen en el navegador con fórmulas publicadas y comprobadas con tests. Los resultados son orientativos y no constituyen asesoramiento financiero.',
    '',
  ];
  for (const cl of CLUSTERES) {
    const lista = CALCULADORAS.filter((c) => c.cluster === cl.id && c.disponible);
    if (!lista.length) continue;
    lineas.push(`## ${cl.nombre}`, '');
    for (const c of lista) lineas.push(`- [${c.nombre}](${SITIO.url}/${c.slug}/): ${c.descripcion}`);
    lineas.push('');
  }
  lineas.push(
    '## Sobre el sitio',
    '',
    `- [Metodología](${SITIO.url}/metodologia/): fórmulas, supuestos y casos de comprobación.`,
    `- [Cómo nos financiamos](${SITIO.url}/como-nos-financiamos/): afiliación y criterios de independencia.`,
    `- [Sobre el autor](${SITIO.url}/sobre-el-autor/)`,
    '',
  );
  return new Response(lineas.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
