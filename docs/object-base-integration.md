# Integración de bases y proporciones — Capa 2

## Corrección

Los troncos ya no reciben un ancho independiente de su altura. Se conserva la relación original del atlas tanto en estructuras como en ramas, vegetación baja y detalles de base. Las uniones de huellas físicas reservan su espacio original sin obligar a ampliar o estirar el modelo de dibujo. Los props del jardín usan escala uniforme; los tulipanes, posiciones y composición se conservan. El aleteo de mariposas y la inclinación de viento de patches siguen siendo deformaciones artísticas intencionales.

Se excluyen flores cuyas raíces estaban dentro de cuerpos estructurales. El plan físico y sus 361 colisiones no se mutan. El resultado tiene 2.742 plantas visibles y 500 áreas estructurales sin intersecciones.

## Integración por delante

`ObjectIntegrationLayer` recibe anchors con posición, extensión de base, cobertura máxima, hábitat húmedo y profundidad del objeto. Es reutilizable para futuros props mediante nuevos anchors, sin crear edificios ni funciones de juego en esta tarea.

Cada base tiene un pequeño patch precompuesto de 3–7 grupos de césped/hojas en un atlas compartido. El patch se dibuja con profundidad `object.y + 0.1`, separado de los detalles que ya están debajo del objeto. Su posición contempla el origen 0,96 del sprite para romper el borde inferior real. Los personajes situados por delante conservan su orden por Y. La cobertura es baja, irregular y limitada a la base, sin esconder el objeto completo.

577 patches de vegetación y 7 de raíces/postes del jardín. Todos estáticos, sin actualización de poses y con culling cada 180 ms. Texturas adicionales estimadas: 2,5 MiB RGBA sin overhead del navegador. No hay objetos por brizna. Las máscaras eliminan césped sobre caminos, plaza, parcelas, arena y acantilados. Los detalles húmedos solo se permiten próximos a una orilla real, nunca aislados en agua profunda.

Se mantiene la pradera de 28.990 tufts y textura diminuta de fondo, con 12% seleccionado para viento mediante chunks. No se aumentan indiscriminadamente objetos grandes ni se modifican los puentes, geometría, agua, zonas, navegación, tareas, UI o Supabase.

## Validación

Auditoría cercana de nueve sectores, vista general y móvil. `npm run typecheck`, `npm run build`, `npm test`, `node scripts/check-vegetation-integration.cjs`, `git diff --check`.

La prueba adicional verifica proporciones de todas las plantas dibujadas, conservación exacta del plan físico, ausencia de intersecciones estructurales y presencia del columpio. Las pruebas existentes cubren 124 rutas/14.293 muestras, cámara, tareas, puentes/rampas, agua, progreso offline y celebración. La medición de FPS es orientativa del navegador de prueba y no garantiza rendimiento en todo dispositivo físico.
