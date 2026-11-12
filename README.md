# calculadoradeinteres.com

Hub de calculadoras financieras para España. Astro + TypeScript, salida estática, islas Preact.

## Requisitos
Node 20 o superior.

## Uso
```bash
npm install
npm run dev        # desarrollo en http://localhost:4321 (muestra los bloques de producto de ejemplo)
npm test           # tests de cálculo (Vitest)
npm run build      # comprobación de tipos + sitio estático en dist/
npm run preview    # sirve dist/ en local
```

## Estructura
- `src/lib/calc/` — lógica financiera pura, sin interfaz. Un módulo por calculadora más `tae.ts` y `validacion.ts`. Las 17 calculadoras previstas están publicadas.
- `tests/` — tests de cálculo: un archivo por módulo en el MVP, `tanda1.test.ts` y `tanda2.test.ts` para el resto.
- `src/config/` — **todo lo configurable**: `fiscal.ts` (parámetros fiscales), `afiliados.ts` (enlaces y productos), `titular.ts` (datos legales), `sitio.ts` (autor, registro de calculadoras, fuentes).
- `src/components/calc/` — islas interactivas. `src/layouts/`, `src/pages/` — plantilla y rutas.

## Añadir o activar una calculadora
1. Módulo en `src/lib/calc/` con sus tests.
2. Isla en `src/components/calc/` y página en `src/pages/<slug>.astro` (copia `interes-compuesto.astro`).
3. Versión embebible en `src/pages/embed/<slug>.astro`.
4. En `src/config/sitio.ts`, pon `disponible: true`. Hasta entonces no se enlaza desde ningún sitio.

## Despliegue en Cloudflare Pages
- Comando de build: `npm run build` · Directorio de salida: `dist` · Variable `NODE_VERSION=22`.
- `public/_headers` define caché y cabeceras de seguridad.

## Cómo conseguir los enlaces de afiliación
1. Publica el sitio: las redes revisan la web antes de aceptarte.
2. Date de alta como editor (publisher) en la red. h2b Hipotecas está en Awin (programa 125672).
3. Dentro de la red, solicita cada programa. Cada anunciante aprueba por separado.
4. Cuando te aprueben, genera tu enlace de seguimiento en el panel y pégalo en `src/config/afiliados.ts`.
5. Rellena el producto con las condiciones literales de la entidad y pon `activo: true`.

## Cookies y terceros
Hoy el sitio no usa cookies no necesarias y no muestra banner. Para añadir analítica o publicidad, declara el script en `src/config/cookies.ts`: el banner aparece solo y el script no se carga hasta que se acepta su categoría.

## Auditoría
```bash
npm run build && npm run preview
npx lighthouse http://localhost:4321/interes-compuesto/ --view   # móvil por defecto
```
Resultados de la última auditoría en `INFORME.md`.

## Antes de publicar
Revisa `TODO-VERIFICAR.md` y `DECISIONES.md`. Busca `TODO(titular)` en el código.
El único dato de `src/config/fiscal.ts` con `verificado: false` es la tabla de ITP y AJD por comunidad: está contrastada con varias fuentes coincidentes, pero no con la oficial. Es editable en la calculadora y la página pide confirmarla.
