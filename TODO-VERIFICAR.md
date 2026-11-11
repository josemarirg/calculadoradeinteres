# Verificación antes de publicar

## Ya verificado contra fuentes oficiales (11-11-2026)
| Dato | Resultado | Fuente |
|---|---|---|
| Retención del 19 % sobre intereses de cuentas y depósitos | Correcto para 2026 (cuadro vigente desde el 10-09-2026). El mismo 19 % se aplica a la transmisión de fondos de inversión | AEAT, cuadro de retenciones del IRPF 2026 |
| Tramos del IRPF del ahorro: 19 / 21 / 23 / 27 / 30 % | Correcto para el ejercicio 2025: la AEAT publica la escala estatal (la mitad de cada tipo) con los mismos límites; la autonómica es igual | AEAT, Manual práctico de Renta 2025 |
| Criterio de la TAE (Circular 5/2012 del Banco de España, anejo 7) | Correcto: la TAE iguala el valor actual de lo entregado y lo recibido; año de 365 días y mes de 365/12 | BOE, texto consolidado de la Circular 5/2012 |
| Límites legales a la comisión por amortización anticipada (Ley 5/2019, art. 23) | Variable: hasta 0,25 % los 3 primeros años o 0,15 % los 5 primeros. Fijo: hasta 2 % los 10 primeros años y 1,5 % después. Se citan en `/amortizacion-anticipada/` | Consejo General de la Abogacía |
| Banner de cookies: rechazar al mismo nivel que aceptar; renovar cada 24 meses | Correcto: es el criterio de la guía de la AEPD actualizada el 11-07-2023 (los 24 meses son buena práctica, no un máximo legal) | AEPD y análisis de finReg360 |
| Normativa de crédito al consumo | Sigue vigente la Ley 16/2011; la nueva ley es todavía un anteproyecto (a octubre de 2026). El texto del sitio no cita cifras | Rankia, Ministerio de Economía |
| Cloudflare como proveedor de alojamiento | Certificado en el Marco de Privacidad de Datos UE-EE. UU.; su acuerdo de tratamiento de datos incluye cláusulas contractuales tipo y forma parte del contrato de autoservicio | Cloudflare, GDPR FAQs |
| Letras del Tesoro | No pude confirmar en el Tesoro la convención de interés simple, así que cambié la frase por lo que sí publica: se emiten al descuento y pagan 1.000 € al vencimiento | Tesoro Público |

## Pendiente: solo tú puedes hacerlo
- [ ] **Enlaces de afiliación reales** (`src/config/afiliados.ts`): se obtienen dándote de alta como editor en cada red; ver la conversación y `README.md`.
- [ ] **Grafía de tu nombre** con tildes y **piso o puerta** de la dirección, si procede (`src/config/titular.ts`).
- [ ] Leer `REVISION-LEGAL.md`, en especial el apartado de riesgos (alta fiscal, AdSense, enlaces de hipotecas).
- [ ] `/privacidad/`: confirma que usarás Cloudflare Pages y Gmail tal como se describe, y el plazo de 12 meses.

## Resuelto el 11-11-2026
- Bio del autor: suprimida a petición tuya.
- Revisión de las hipotecas variables «cada 6 o 12 meses, según el contrato»: confirmado por ti.
- Revisión de cumplimiento de los textos legales: hecha, ver `REVISION-LEGAL.md`.

## Pendiente: no verificado
- [ ] `/amortizacion-anticipada/`: mención a la deducción por vivienda habitual para compras anteriores a 2013 (redactada como «consúltalo en la Agencia Tributaria»).
- [ ] `/cuenta-remunerada/`: «lo habitual es que los intereses se calculen cada día y se abonen cada mes o trimestre» (práctica general, varía por entidad).
- [ ] Escala del ahorro para el ejercicio 2026: no he encontrado cambios, pero la fuente oficial consultada es la del ejercicio 2025. Ninguna calculadora publicada la usa.

## Mantenimiento
- [ ] Revisar `src/config/fiscal.ts` cada enero y tras cualquier reforma fiscal.
- [ ] Revisar `/prestamo-personal/` cuando se apruebe la nueva ley de crédito al consumo.
- [ ] Al añadir analítica o publicidad, declarar cada script en `src/config/cookies.ts` y revisar el texto del banner.

## Después de desplegar
- [ ] Prueba de resultados enriquecidos de Google y PageSpeed Insights sobre las URL reales.
- [ ] Alta del sitemap en Google Search Console.
- [ ] Quitar `/inversion/` del filtro del sitemap en `astro.config.mjs` cuando tenga su primera calculadora.
