/**
 * Parámetros fiscales y normativos. ÚNICO sitio donde viven estas cifras.
 *
 * Cada valor indica si está verificado, contra qué fuente oficial y en qué fecha.
 * Las cifras fiscales cambian por ley: revísalas al menos cada enero y cada vez
 * que se apruebe una norma tributaria, y actualiza `ultimaRevision`.
 */

export interface ParametroFiscal<T> {
  valor: T;
  verificado: boolean;
  /** Fecha (AAAA-MM-DD) en la que se comprobó contra la fuente. */
  verificadoEl?: string;
  fuente: string;
  nota?: string;
}

export const FISCAL = {
  /** Fecha (AAAA-MM-DD) de la última revisión de TODO este archivo. */
  ultimaRevision: '2026-11-12',
  ejercicio: 2026,

  /** Agencia Tributaria: porcentajes de retención aplicables a las distintas rentas. */
  fuenteGeneral: 'https://sede.agenciatributaria.gob.es/Sede/irpf/retenciones-ingresos-cuenta-pagos-fraccionados/retenciones-ingresos-cuenta/porcentajes-retencion-aplicables-distintas-rentas.html',

  /** Retención a cuenta del IRPF sobre intereses (rendimientos del capital mobiliario). */
  retencionIntereses: {
    // Verificado: el cuadro de retenciones del IRPF 2026 de la AEAT (versión aplicable desde el
    // 10-09-2026) fija el 19 % para «cesión a terceros de capitales propios (cuentas corrientes,
    // depósitos financieros, etc.)». El mismo 19 % se aplica a la transmisión de participaciones
    // en fondos de inversión.
    // TODO(titular): volver a comprobar cada enero.
    valor: 0.19,
    verificado: true,
    verificadoEl: '2026-11-11',
    fuente: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/CUADRO_TIPOS_RETENCION_IRPF_2026_10sept.pdf',
    nota: 'Es un pago a cuenta: el impuesto definitivo se calcula en la declaración según la escala del ahorro.',
  } satisfies ParametroFiscal<number>,

  /**
   * Escala de la base del ahorro del IRPF (suma de tramo estatal y autonómico).
   * `hasta` es el límite superior del tramo en euros; null = sin límite.
   * La usan «IRPF del ahorro», «Fondos indexados» y la estimación de «Letras del Tesoro».
   */
  tramosAhorro: {
    // Verificado el 12-11-2026 en el texto de la Ley 35/2006 que publica la AEAT (apéndice normativo
    // de Renta 2025): los artículos 66.1 (escala estatal) y 76 (autonómica) fijan cada uno
    // 9,5 / 10,5 / 11,5 / 13,5 / 15 % con estos límites, en la redacción de la Ley 7/2024, vigente
    // «con efectos 1 de enero de 2025» y sin fecha de caducidad. El total es la suma de ambas.
    // No consta ninguna modificación posterior. Revisar al publicarse el Manual de Renta 2026.
    valor: [
      { hasta: 6_000, tipo: 0.19 },
      { hasta: 50_000, tipo: 0.21 },
      { hasta: 200_000, tipo: 0.23 },
      { hasta: 300_000, tipo: 0.27 },
      { hasta: null, tipo: 0.3 },
    ] as { hasta: number | null; tipo: number }[],
    verificado: true,
    verificadoEl: '2026-11-12',
    fuente: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Biblioteca/Manual/Practicos/IRPF/IRPF-2025/Normativa-IRPF25/Ley-35-2006.pdf',
    nota: 'Ley 35/2006, arts. 66 y 76, redacción vigente desde el 1-1-2025. Tipo total = estatal + autonómico.',
  } satisfies ParametroFiscal<{ hasta: number | null; tipo: number }[]>,

  /** Las Letras del Tesoro no soportan retención: el rendimiento se declara entero en la renta. */
  retencionLetras: {
    // Verificado el 12-11-2026: el artículo 75.3.b) del Reglamento del IRPF (RD 439/2007, texto
    // publicado por la AEAT) excluye de la obligación de retener «los rendimientos de las Letras del Tesoro».
    valor: 0,
    verificado: true,
    verificadoEl: '2026-11-12',
    fuente: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Biblioteca/Manual/Practicos/IRPF/IRPF-2024/Normativa-IRPF24/RD-439-2007.pdf',
    nota: 'Reglamento del IRPF, art. 75.3.b).',
  } satisfies ParametroFiscal<number>,

  /** Planes de pensiones: límites de aportación con derecho a reducción en la base imponible. */
  planPensiones: {
    // Verificado el 12-11-2026 en el Manual práctico de Renta 2025 de la AEAT (cuadro resumen de
    // reducciones, actualizado el 17-03-2026): el límite es el menor entre el 30 % de los rendimientos
    // netos del trabajo y de actividades económicas y 1.500 € anuales, que se incrementan en hasta
    // 8.500 € por contribuciones empresariales a planes de empleo (10.000 € en total).
    // Es el dato de la renta 2025; no consta ningún cambio para 2026. Revisar cada enero.
    valor: { individual: 1_500, conjunto: 10_000, porcentajeRendimientos: 0.3 },
    verificado: true,
    verificadoEl: '2026-11-12',
    fuente: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c13-determinacion-renta-contribuyente-sujeta-gravamen/reducciones-base-imponible-general/cuadro-resumen-reducciones-base-imponible-general.html',
    nota: 'Manual práctico de Renta 2025 (AEAT). Sin cambios conocidos para 2026.',
  } satisfies ParametroFiscal<{ individual: number; conjunto: number; porcentajeRendimientos: number }>,

  /**
   * Impuestos de la compra de vivienda. Los tipos autonómicos cambian a menudo y tienen
   * tramos y tipos reducidos (jóvenes, familias numerosas, vivienda protegida) que aquí no caben:
   * la calculadora los usa como valor inicial y la persona puede cambiarlos.
   */
  compraVivienda: {
    // IVA: verificado el 12-11-2026 en la AEAT («Compro una vivienda, ¿tengo que pagar IVA o ITP?»):
    // 10 % con carácter general y 4 % en viviendas de protección oficial de régimen especial o de
    // promoción pública.
    //
    // ITP y AJD por comunidad: el Ministerio de Hacienda no permite la lectura automática de su informe
    // «Tributación Autonómica 2026», así que los tipos están contrastados con fuentes no oficiales que
    // citan la ley de cada comunidad, todas actualizadas entre agosto y noviembre de 2026:
    //   · ITP: bm.consulting, gibobs.com, rankia.com e inmofiscal.com. Coinciden en las 17 comunidades,
    //     salvo Murcia (una indica 8 %; las otras tres, 7,75 % desde el 25-07-2025).
    //   · AJD: gibobs.com, guiafiscal.es y rankia.com. Coinciden en todas.
    // Comprobado además en fuente oficial:
    //   · Cantabria: Ley 5/2026 (BOE-A-2026-10431), en vigor desde el 1-05-2026: 7 % hasta 300.000 € y
    //     9 % el exceso para vivienda habitual; el tipo general sigue en el 9 %.
    //   · Canarias: guía del ITP y AJD de la Agencia Tributaria Canaria: TPO 6,5 %; AJD 0,75 %, y 1 %
    //     en las transmisiones sujetas al IGIC (vivienda nueva).
    // `itp` es el tipo general del primer tramo; `nota` avisa de tramos, bonificaciones o territorios.
    // `ajd` es el que se aplica a la compra de vivienda nueva.
    // Revisar cada enero y cada verano: estos tipos cambian a mitad de año con frecuencia.
    valor: {
      /** IVA de la vivienda nueva (tipo reducido estatal). En Canarias se aplica el IGIC. */
      ivaViviendaNueva: 0.1,
      comunidades: [
        { id: 'an', nombre: 'Andalucía', itp: 0.07, ajd: 0.012 },
        { id: 'ar', nombre: 'Aragón', itp: 0.08, ajd: 0.015, nota: 'El tipo sube por tramos a partir de 400.000 €, hasta el 10 %.' },
        { id: 'as', nombre: 'Asturias', itp: 0.08, ajd: 0.012, nota: 'El tipo es del 9 % a partir de 300.000 € y del 10 % a partir de 500.000 €.' },
        { id: 'ib', nombre: 'Illes Balears', itp: 0.08, ajd: 0.015, nota: 'El tipo sube por tramos a partir de 400.000 €, hasta el 13 %.' },
        { id: 'cn', nombre: 'Canarias', itp: 0.065, ajd: 0.01, nota: 'En vivienda nueva se aplica el IGIC en lugar del IVA: escribe su tipo.' },
        { id: 'cb', nombre: 'Cantabria', itp: 0.09, ajd: 0.015, nota: 'Si va a ser tu vivienda habitual, el tipo es del 7 % hasta 300.000 €; consulta los requisitos.' },
        { id: 'cm', nombre: 'Castilla-La Mancha', itp: 0.09, ajd: 0.015 },
        { id: 'cl', nombre: 'Castilla y León', itp: 0.08, ajd: 0.015, nota: 'La parte del precio que supera 250.000 € tributa al 10 %.' },
        { id: 'ct', nombre: 'Cataluña', itp: 0.1, ajd: 0.015, nota: 'El tipo sube por tramos a partir de 600.000 €, hasta el 13 %.' },
        { id: 'vc', nombre: 'Comunitat Valenciana', itp: 0.09, ajd: 0.014, nota: 'El tipo es del 11 % si el precio supera 1.000.000 €.' },
        { id: 'ex', nombre: 'Extremadura', itp: 0.08, ajd: 0.015, nota: 'El tipo sube por tramos a partir de 360.000 €, hasta el 11 %.' },
        { id: 'ga', nombre: 'Galicia', itp: 0.08, ajd: 0.015 },
        { id: 'ri', nombre: 'La Rioja', itp: 0.07, ajd: 0.01 },
        { id: 'md', nombre: 'Madrid', itp: 0.06, ajd: 0.0075 },
        { id: 'mc', nombre: 'Región de Murcia', itp: 0.0775, ajd: 0.015 },
        { id: 'nc', nombre: 'Navarra', itp: 0.06, ajd: 0.005 },
        { id: 'pv', nombre: 'País Vasco', itp: 0.04, ajd: 0.005, nota: 'Régimen foral: el 4 % es el tipo de la vivienda (7 % en otros inmuebles) y cada territorio fija sus condiciones.' },
        { id: 'ce', nombre: 'Ceuta y Melilla', itp: 0.03, ajd: 0.005, nota: 'Tipo estatal del 6 % con bonificación del 50 % de la cuota. En vivienda nueva se aplica el IPSI en lugar del IVA: escribe su tipo.' },
      ] as { id: string; nombre: string; itp: number; ajd: number | null; nota?: string }[],
    },
    verificado: false,
    verificadoEl: '2026-11-12',
    fuente: 'https://www.hacienda.gob.es/',
    nota: 'IVA verificado en la AEAT. ITP y AJD: tipos generales contrastados con varias fuentes coincidentes, no oficiales. No incluyen tipos reducidos.',
  } satisfies ParametroFiscal<{ ivaViviendaNueva: number; comunidades: { id: string; nombre: string; itp: number; ajd: number | null; nota?: string }[] }>,
} as const;
