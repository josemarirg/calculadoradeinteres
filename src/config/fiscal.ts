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
  ultimaRevision: '2026-11-11',
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
   * No la usa ninguna calculadora del MVP: queda preparada para «IRPF del ahorro».
   */
  tramosAhorro: {
    // Verificado para el ejercicio 2025 (declaración presentada en 2026): el Manual práctico de
    // Renta 2025 de la AEAT da la escala ESTATAL 9,5 / 10,5 / 11,5 / 13,5 / 15 % con estos mismos
    // límites; la escala autonómica es idéntica, de modo que el total es el doble.
    // TODO(titular): antes de publicar la calculadora «IRPF del ahorro», confirmar en la AEAT que
    // la escala no ha cambiado para el ejercicio en curso (no he encontrado ningún cambio para 2026).
    valor: [
      { hasta: 6_000, tipo: 0.19 },
      { hasta: 50_000, tipo: 0.21 },
      { hasta: 200_000, tipo: 0.23 },
      { hasta: 300_000, tipo: 0.27 },
      { hasta: null, tipo: 0.3 },
    ] as { hasta: number | null; tipo: number }[],
    verificado: true,
    verificadoEl: '2026-11-11',
    fuente: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-ahorro/gravamen-estatal.html',
    nota: 'Escala del ejercicio 2025. Tipo total = estatal + autonómico.',
  } satisfies ParametroFiscal<{ hasta: number | null; tipo: number }[]>,
} as const;
