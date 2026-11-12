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

Tanda 2: las nueve calculadoras restantes (11-11-2026, decisión delegada por el titular: «termina todas las funcionalidades»):
38. Letras del Tesoro: interés simple con año de 360 días y plazo máximo de 376 días, la convención del Tesoro para las Letras. Se comprueba en los tests contra los precios y tipos de una subasta publicada en el BOE (BOE-A-2025-5905). Se puede partir del tipo o del precio. El 2 % inicial es un tipo de ejemplo. El IRPF se estima con el primer tramo de la escala del ahorro y las comisiones son un campo en euros, vacío por defecto: no se cita ninguna tarifa.
39. Tarjeta revolving: cuota fija en euros, sin compras nuevas ni seguros. Si la cuota no supera los intereses del primer mes, o el plazo pasa de 50 años, se muestra un error con la cifra en lugar de un resultado. Se añade la cuota necesaria para liquidar en 12, 24, 36 y 60 meses.
40. Liquidar deudas: hasta 5 deudas. El extra y las cuotas liberadas van a una sola deuda (avalancha: mayor TIN; bola de nieve: menor saldo). La referencia «solo las cuotas» no traspasa cuotas. El ejemplo inicial tiene dos deudas en las que los dos métodos dan resultados distintos.
41. Hipoteca fija o variable: el resultado principal es el Euríbor de equilibrio (TIN fijo − diferencial), que no exige inventar un Euríbor. El campo de Euríbor sigue vacío y es opcional (decisión n.º 5); la tabla de escenarios va del 0 % al 5 %.
42. Gastos de compra: los tipos de ITP y AJD por comunidad están en `fiscal.ts` como valor inicial editable y marcados como NO verificados en fuente oficial. Solo se guarda el tipo general del primer tramo; donde hay tramos o tipos por territorio, la calculadora muestra un aviso. Notaría, registro y gestoría son un único campo en euros con una estimación inicial de 1.500 €. Ceuta y Melilla quedan fuera del selector.
43. Fondos indexados: rentabilidad constante introducida por la persona (6 % de ejemplo); comisiones descontadas del patrimonio cada año; impuesto con la escala del ahorro suponiendo un único reembolso y ninguna otra renta del ahorro ese año. Admite rentabilidades negativas.
44. Plan de pensiones: aportación al final de cada año, ahorro fiscal no reinvertido y rescate gravado al tipo medio que indique la persona. Admite hasta el límite conjunto (10.000 €) y avisa al superar el individual (1.500 €). No aplica la reducción del 40 % de las aportaciones anteriores a 2007.
45. Jubilación y FIRE: rentabilidad real (sobre la inflación), de modo que todo va en euros de hoy; tasa de retirada editable entre el 1 % y el 10 %, con el 4 % como ejemplo. No incluye impuestos ni pensión pública.
46. IRPF del ahorro: escala de `fiscal.ts`. No compensa pérdidas ni aplica el mínimo personal sobrante. Si no se indican retenciones, se supone el 19 % de los intereses y dividendos.
47. `/inversion/` ya tiene calculadoras: deja de llevar `noindex` (se decide solo, según el registro) y vuelve al sitemap.
48. En las calculadoras nuevas con muchos campos (liquidar deudas, gastos de compra), a 375 px se ve sin scroll la cifra principal; parte del desglose queda justo por debajo.
49. Tarjeta revolving: el texto menciona el criterio de usura del Tribunal Supremo (más de seis puntos sobre el tipo medio publicado por el Banco de España) como excepción a la decisión n.º 26, porque es la duda más habitual de quien llega a esa página. Va sin número de sentencia y remite a un profesional.

Verificación del 12-11-2026 (decisión delegada: «todo a tu criterio»):
50. Canarias: el AJD de la vivienda nueva pasa del 0,75 % al 1 %, que es el tipo de las transmisiones sujetas al IGIC según la guía de la Agencia Tributaria Canaria.
51. Se añaden Ceuta y Melilla al selector (ITP del 3 % efectivo: 6 % estatal con bonificación del 50 %) y el País Vasco deja de pedir el AJD a mano (0,5 %). Cantabria muestra un aviso con el tipo del 7 % para vivienda habitual.
52. Los tipos de ITP y AJD siguen marcados `verificado: false` porque no se han podido leer en fuente oficial, pero se publican: cuatro fuentes independientes coinciden, son editables y la página pide confirmarlos. Ante la discrepancia de Murcia se usa el 7,75 % (tres fuentes contra una).
53. Límites de planes de pensiones, escala del ahorro y retención de las Letras pasan a `verificado: true` con la AEAT como fuente.
54. La regla del 4 % se atribuye en el texto al estudio Trinity (1998); el criterio de usura en revolving se fecha en 2023 y se refiere al tipo medio de «tarjetas de crédito y revolving».
