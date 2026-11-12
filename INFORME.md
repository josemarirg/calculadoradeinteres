# Informe final del MVP (11-11-2026)

## Estado
- **17 calculadoras** con página completa y versión embebible: las 8 anteriores más Letras del Tesoro, tarjeta revolving, liquidar deudas, hipoteca fija o variable, gastos de compra de vivienda, fondos indexados, plan de pensiones, jubilación y FIRE e IRPF del ahorro. No queda ninguna tarjeta «Próximamente».
- Inicio, 4 páginas de clúster (las cuatro indexables), metodología, autor, financiación, contacto, aviso legal, privacidad, cookies y 404.
- 124 tests de cálculo pasando (`npm test`). Comprobación de tipos sin errores, avisos ni sugerencias (`npm run build`).

## Lighthouse (móvil, build servido en local)
Las páginas de la tanda 2, `/inversion/` y el inicio se midieron el 11-11-2026 con el build final. El resto conserva la medición anterior: comparte plantilla y hoja de estilos, a la que solo se han añadido unas pocas reglas.

Rendimiento / Accesibilidad / Buenas prácticas / SEO.

| Página | Puntuación | LCP | CLS | TBT |
|---|---|---|---|---|
| /letras-del-tesoro/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 10 ms |
| /tarjeta-revolving/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 20 ms |
| /liquidar-deudas/ | 98 / 100 / 100 / 100 | 0,6 s | 0 | 170 ms |
| /hipoteca-fija-o-variable/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 10 ms |
| /gastos-compra-vivienda/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 10 ms |
| /fondos-indexados/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /plan-de-pensiones/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 10 ms |
| /jubilacion-fire/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 20 ms |
| /irpf-ahorro/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /inversion/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | 0 ms |
| / | 100 / 100 / 100 / 100 | 0,6 s | 0 | 0 ms |
| /interes-compuesto/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /interes-simple/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /prestamo-personal/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 40 ms |
| /cuota-hipoteca/ | 100 / 100 / 100 / 100 | 0,8 s | 0 | 40 ms |
| /rentabilidad-deposito/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 60 ms |
| /amortizacion-anticipada/ | 99 / 100 / 100 / 100 | 0,7 s | 0 | 140 ms |
| /tin-tae/ | 100 / 100 / 100 / 100 | 0,8 s | 0 | 70 ms |
| /cuenta-remunerada/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /ahorro/, /deuda/, /hipoteca/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | ≤ 10 ms |
| /metodologia/, /sobre-el-autor/, /como-nos-financiamos/, /contacto/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | ≤ 10 ms |
| /aviso-legal/, /privacidad/, /cookies/ | 100 / 100 / 100 / 100 | 0,6–0,8 s | 0 | ≤ 10 ms |

Notas:
- `/liquidar-deudas/` simula tres planes al cargar; de ahí su TBT algo mayor.
- Son mediciones de laboratorio en local. El INP solo se mide con usuarios reales; el indicador de laboratorio equivalente (TBT) es bajo. Repite la medición con PageSpeed Insights tras desplegar.

## Datos estructurados
Validación local de todas las páginas (JSON válido, tipos y propiedades obligatorias, posiciones y URL absolutas en las migas, y texto de `FAQPage` idéntico al visible):
- Calculadoras: Organization, BreadcrumbList, Person, WebApplication, FAQPage.
- Inicio: Organization, WebSite. Resto: Organization, BreadcrumbList (más Person en «Sobre el autor»).

No se ha podido usar el validador de Google desde el entorno de trabajo (sin acceso de red): queda en la lista de pendientes.

## Criterios de aceptación
| Criterio | Resultado |
|---|---|
| Tests de cálculo pasan | 124 de 124 |
| Los resultados coinciden con los ejemplos resueltos | Sí: el resultado inicial de cada calculadora aparece en su texto, y ambos salen del mismo módulo |
| Lighthouse ≥ 95 en móvil en las calculadoras | Sí: 98–100 en rendimiento y 100 en las otras tres categorías |
| Ninguna cookie no necesaria antes del consentimiento | Sí: el sitio no crea ninguna cookie; con un script de terceros de prueba, no se carga hasta aceptar |
| Autor, fecha de revisión, fuentes y aviso en cada calculadora | Sí en las 17. Verificados en fuente oficial el 12-11-2026: retenciones, escala del ahorro, límites de planes de pensiones, IVA de vivienda y las reglas fiscales citadas en los textos. Los tipos autonómicos de ITP y AJD están contrastados con cuatro fuentes coincidentes, no oficiales (ver `TODO-VERIFICAR.md`) |
| Resultado visible sin scroll a 375 px | La cifra principal, en las 17. En la tanda 2 el desglose termina entre 538 y 665 px de 667, salvo en `/liquidar-deudas/` (711) y `/gastos-compra-vivienda/` (708), donde la última fila del desglose queda por debajo |
| Mínimo 800 palabras por calculadora | 904–1.110, contando las preguntas frecuentes |

## Otras comprobaciones
- 632 enlaces internos comprobados, ninguno roto. Sitemap con 29 URL, incluida `/inversion/`.
- Títulos y descripciones únicos; un solo H1 por página; canonical correcto en todas.
- Sin desbordamiento horizontal a 375 px; sin errores de consola.
- Enlaces compartidos: cada calculadora se reconstruye desde los parámetros de la URL.
- Tanda 2 probada en navegador: 30 comprobaciones de interacción (cambios de campos, errores de validación, enlaces compartidos, casos límite), todas correctas.

## Qué falta por tu parte
Ver `TODO-VERIFICAR.md`. Decisiones tomadas: `DECISIONES.md`.
