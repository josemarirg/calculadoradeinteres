# Informe final del MVP (11-11-2026)

## Estado
- 8 calculadoras con página completa y versión embebible: interés compuesto, interés simple, depósito, cuenta remunerada, préstamo personal, TIN y TAE, cuota de hipoteca y amortización anticipada.
- Inicio, 4 páginas de clúster, metodología, autor, financiación, contacto, aviso legal, privacidad, cookies y 404.
- 81 tests de cálculo pasando (`npm test`). Comprobación de tipos sin errores (`npm run build`).

## Lighthouse (móvil, build servido en local)
Las calculadoras, el inicio y `/cookies/` se volvieron a medir tras el cambio de estilo a monocromo; el resto de páginas se midió con el estilo anterior y comparte la misma hoja de estilos.

Rendimiento / Accesibilidad / Buenas prácticas / SEO.

| Página | Puntuación | LCP | CLS | TBT |
|---|---|---|---|---|
| /interes-compuesto/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /interes-simple/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| /prestamo-personal/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 40 ms |
| /cuota-hipoteca/ | 100 / 100 / 100 / 100 | 0,8 s | 0 | 40 ms |
| /rentabilidad-deposito/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 60 ms |
| /amortizacion-anticipada/ | 99 / 100 / 100 / 100 | 0,7 s | 0 | 140 ms |
| /tin-tae/ | 100 / 100 / 100 / 100 | 0,8 s | 0 | 70 ms |
| /cuenta-remunerada/ | 100 / 100 / 100 / 100 | 0,7 s | 0 | 50 ms |
| / | 100 / 100 / 100 / 100 | 0,6 s | 0 | 0 ms |
| /ahorro/, /deuda/, /hipoteca/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | ≤ 10 ms |
| /inversion/ | 100 / 100 / 100 / 66 | 0,7 s | 0 | 0 ms |
| /metodologia/, /sobre-el-autor/, /como-nos-financiamos/, /contacto/ | 100 / 100 / 100 / 100 | 0,6 s | 0 | ≤ 10 ms |
| /aviso-legal/, /privacidad/, /cookies/ | 100 / 100 / 100 / 100 | 0,6–0,8 s | 0 | ≤ 10 ms |

Notas:
- `/inversion/` baja en SEO a propósito: lleva `noindex` porque aún no tiene calculadoras.
- Son mediciones de laboratorio en local. El INP solo se mide con usuarios reales; el indicador de laboratorio equivalente (TBT) es bajo. Repite la medición con PageSpeed Insights tras desplegar.

## Datos estructurados
Validación local de todas las páginas (JSON válido, tipos y propiedades obligatorias, posiciones y URL absolutas en las migas, y texto de `FAQPage` idéntico al visible):
- Calculadoras: Organization, BreadcrumbList, Person, WebApplication, FAQPage.
- Inicio: Organization, WebSite. Resto: Organization, BreadcrumbList (más Person en «Sobre el autor»).

No se ha podido usar el validador de Google desde el entorno de trabajo (sin acceso de red): queda en la lista de pendientes.

## Criterios de aceptación
| Criterio | Resultado |
|---|---|
| Tests de cálculo pasan | 81 de 81 |
| Los resultados coinciden con los ejemplos resueltos | Sí: el resultado inicial de cada calculadora aparece en su texto, y ambos salen del mismo módulo |
| Lighthouse ≥ 95 en móvil en las 5 calculadoras | Sí (100 en las cuatro categorías) |
| Ninguna cookie no necesaria antes del consentimiento | Sí: el sitio no crea ninguna cookie; con un script de terceros de prueba, no se carga hasta aceptar |
| Autor, fecha de revisión, fuentes y aviso en cada calculadora | Sí en las 5; la bio del autor sigue como placeholder. Parámetros fiscales verificados en la AEAT el 11-11-2026 |
| Resultado visible sin scroll a 375 px | Sí: termina entre 522 y 630 px de 667 |
| Mínimo 800 palabras por calculadora | 851–981 |

## Otras comprobaciones
- 320 enlaces internos comprobados, ninguno roto.
- Títulos y descripciones únicos; un solo H1 por página; canonical correcto en todas.
- Sin desbordamiento horizontal a 375 px; sin errores de consola.
- Enlaces compartidos: cada calculadora se reconstruye desde los parámetros de la URL.

## Qué falta por tu parte
Ver `TODO-VERIFICAR.md`. Decisiones tomadas: `DECISIONES.md`.
