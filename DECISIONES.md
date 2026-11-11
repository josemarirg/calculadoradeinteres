# Decisiones tomadas

Confirmadas por el titular (11-11-2026):
1. Aportación con frecuencia distinta a la de capitalización: se simula mes a mes con el tipo mensual equivalente, (1+r/n)^(n/12).
2. Retención en interés compuesto: selector «cada año» (cuentas y depósitos) o «al final sobre la ganancia» (fondos). Por defecto, sin retención.
3. Comisión de apertura del préstamo: se descuenta del importe recibido; no se financia.
4. TAE de la hipoteca: solo con TIN; se etiqueta «TAE orientativa, sin gastos vinculados».
5. Euríbor: campo vacío, sin valor por defecto.
6. Datos del titular públicos en el aviso legal. Dirección: Calle Gutiérrez de Alba, 6, 41010 Sevilla (localidad deducida del código postal).
7. El autor es el titular; bio como placeholder.
8. Lead hipotecario: botón hacia `AFFILIATE_URL_H2B`, sin formulario propio.

Tomadas durante el desarrollo (opción más prudente):
9. Los tipos se manejan en tanto por uno dentro de `lib/calc`; la interfaz convierte desde porcentaje.
10. Duración del interés compuesto y simple en años enteros (1–60).
11. Hipoteca variable: Euríbor + diferencial constante todo el plazo, con suelo en 0 %. Se avisará en la página.
12. Depósito con TIN: interés simple, base 365 días. Con TAE: capitalización compuesta.
13. Amortización anticipada sin comisión por amortizar (se puede añadir como campo opcional).
14. Los saldos inferiores a una millonésima de euro se consideran liquidados (evita una cuota fantasma por coma flotante).
15. Las cifras del texto de cada página se calculan al compilar con el mismo módulo que usa la calculadora.
16. Bloques de producto: los que tienen `activo: false` solo se ven en `npm run dev`; nunca en producción.
17. Tipografía del sistema (sin fuentes web) para proteger el LCP. Si más adelante quieres una fuente de marca, habrá que alojarla en el propio sitio y volver a medir.
18. Se muestran «Próximamente» las calculadoras previstas, sin enlace ni URL.
19. Nombre del autor escrito con tildes («José María Rodríguez Gómez»).
20. El pie y los enlaces internos solo apuntan a páginas marcadas como disponibles en `src/config/sitio.ts`.
21. El tema claro/oscuro elegido se guarda en `localStorage` (preferencia pedida por el usuario, no requiere consentimiento).
22. Banner de cookies: solo aparece si hay scripts de terceros declarados en `src/config/cookies.ts`. Hoy no hay ninguno, el sitio no usa cookies no necesarias y por tanto no muestra banner (no hay nada que consentir). Probado con un script ficticio: no se carga nada antes de aceptar, «Rechazar» y «Aceptar» son idénticos en tamaño y estilo, y la elección se puede cambiar en `/cookies/`.
23. La página `/inversion/` no tiene todavía ninguna calculadora: lleva `noindex` y queda fuera del sitemap para no indexar una página vacía.
24. Préstamo personal: el plazo se introduce en meses (1–240) para admitir plazos cortos; debajo se muestra su equivalencia en años.
25. Depósito: la retención es un campo visible y editable; vacío aplica el valor de `fiscal.ts`.
26. Los textos no citan cifras legales concretas (límites de comisiones por amortización, cobertura del fondo de garantía, compensación por reembolso anticipado): remiten a la fuente oficial. La normativa de crédito al consumo puede estar cambiando por la transposición de la Directiva (UE) 2023/2225.
27. Contacto solo por correo (`mailto:`): sin backend no hay formulario, y así no se recogen datos en el sitio.
28. Se mantiene el marcado `FAQPage` porque lo pide el encargo y es válido, aunque Google limita desde 2023 los resultados enriquecidos de FAQ a ciertos sitios.
29. Una única imagen Open Graph genérica (`public/og.png`) para todas las páginas.
30. Las cifras de todos los ejemplos resueltos y de la metodología se generan al compilar con los módulos de cálculo.
31. Estilo visual (cambio pedido el 11-11-2026): minimalista y monocromo, en blanco y negro, con tipografía grande, líneas finas en lugar de cajas y botones en píldora. El verde queda como único acento, reservado a los intereses en gráficas y desgloses. Sustituye a la propuesta inicial de azul tinta y verde. Los campos mantienen un borde visible por accesibilidad (contraste de componentes, WCAG 1.4.11).
32. Verificación de datos (11-11-2026): los parámetros fiscales quedan marcados como verificados con su fuente oficial en `fiscal.ts`. Donde no pude confirmar una afirmación en fuente oficial (convención de cálculo de las Letras del Tesoro), reescribí la frase para decir solo lo comprobado.
33. Privacidad: conservación de correos fijada en 12 meses y Cloudflare descrito como encargado con sus garantías de transferencia publicadas.
34. Bio del autor suprimida a petición del titular: la página «Sobre el autor» muestra nombre, forma de trabajo y contacto.
35. Revisión de cumplimiento de los textos legales (ver `REVISION-LEGAL.md`): se añadieron al aviso legal el apartado «Qué no es este sitio» y, a la privacidad, DPO, encargado del correo, carácter voluntario, decisiones automatizadas y plazos de respuesta.
36. Tanda 1 añadida antes de publicar (decisión delegada por el titular): amortización anticipada, TIN y TAE y cuenta remunerada. Reutilizan cálculos ya probados y dejan Ahorro, Deuda e Hipoteca con al menos dos calculadoras. El resto se añadirá por tandas con el sitio ya publicado.
37. Amortización anticipada: compara siempre las dos opciones y resta la comisión del banco del ahorro. Cuenta remunerada: liquidación mensual, con el interés neto sumado al saldo; el 2 % por defecto es un tipo de ejemplo.
