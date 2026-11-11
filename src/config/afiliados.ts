/**
 * Enlaces de afiliación y bloques de producto. ÚNICO sitio donde se configuran.
 *
 * Reglas (Circular 2/2020 de la CNMV y Circular 4/2020 del Banco de España):
 *  - TAE, condiciones y advertencias se copian LITERALMENTE de la web de la entidad.
 *  - Nada de CFD, forex ni criptoactivos.
 *  - Un producto solo se publica con `activo: true` y todos sus campos rellenos.
 *    Con `activo: false` solo se ve en desarrollo (`npm run dev`), marcado como ejemplo.
 */

export const AFILIADOS = {
  // TODO(titular): pegar aquí los enlaces de seguimiento reales de cada programa.
  AFFILIATE_URL_H2B: 'https://example.com/AFFILIATE_URL_H2B',
  AFFILIATE_URL_CUENTA_REMUNERADA: 'https://example.com/AFFILIATE_URL_CUENTA_REMUNERADA',
  AFFILIATE_URL_DEPOSITO: 'https://example.com/AFFILIATE_URL_DEPOSITO',
  AFFILIATE_URL_BROKER: 'https://example.com/AFFILIATE_URL_BROKER',
} as const;

export type Ubicacion = 'ahorro' | 'deuda' | 'hipoteca' | 'inversion';

export interface Producto {
  activo: boolean;
  ubicacion: Ubicacion;
  entidad: string;
  producto: string;
  /** Texto literal de la entidad: TAE, TIN, plazo, importe mínimo y máximo, condiciones. */
  condiciones: string;
  /** Advertencias obligatorias, literales (riesgo, liquidez, fondo de garantía…). */
  advertencias: string;
  /** Fecha en la que copiaste las condiciones de la web de la entidad (AAAA-MM-DD). */
  fechaCondiciones: string;
  url: string;
  textoBoton: string;
}

export const PRODUCTOS: Producto[] = [
  {
    // TODO(titular): sustituir por un producto real o borrar. No se publica mientras activo sea false.
    activo: false,
    ubicacion: 'ahorro',
    entidad: '[ENTIDAD]',
    producto: '[NOMBRE DEL PRODUCTO]',
    condiciones: '[TAE y condiciones, copiadas literalmente de la entidad]',
    advertencias: '[Advertencias legales, copiadas literalmente de la entidad]',
    fechaCondiciones: '2026-01-01',
    url: AFILIADOS.AFFILIATE_URL_CUENTA_REMUNERADA,
    textoBoton: 'Ver condiciones en [ENTIDAD]',
  },
];
