# Puentes, cascadas y agua — Capa 2.8

La guía aportada por el usuario se utilizó como referencia principal en seis generaciones de ImageGen integrada. Inventario y prompts exactos: `river-assets-prompts.md`. Se mantiene el mapa, césped, jardín, personajes, UI, sorpresa, tareas, Supabase y progreso offline.

## Puentes

`bridgePlan.ts` toma los diez cruces existentes y sus polígonos: cuatro rústicos, cinco de granja y uno grande. El muelle conserva su forma y utiliza la familia de granja. Las rampas de piedra permanecen intactas. Longitud, anchura, accesos y colisiones no cambian; el corredor original tiene anchuras de 48–68 unidades de mundo. Secciones de madera y postes se ensamblan directamente según el vector del cruce. No se gira un puente completo ni se aplica escala X/Y desigual.

Los rústicos tienen postes circulares, cuerda curva y flores discretas. Los medianos tienen doble barandal, postes con base y jardineras. El grande añade herrajes, bases/pilares de piedra y cuatro faroles. La madera se muestrea desde el interior de un tablón del kit para evitar cuadrículas por repetición del marco completo. Las juntas y clavos se dibujan a escala nativa, alineados al corredor. Al encontrarse dos puentes, se abren sus barandales y se omiten postes que invadirían el otro corredor.

`BridgeLayer` separa el suelo/sombra y fundamentos de los tramos de barandal, postes, flores y faroles. El suelo queda debajo de los actores; los tramos y postes se ordenan por su Y de apoyo, de modo que pueden ocultar la parte inferior de un personaje cercano a la baranda. No hay una imagen plana por encima del personaje. La escala de postes es 23/27/32 unidades según familia; los faroles miden 13 y los pilares 32.

La integración frontal de bases usa el sistema de césped existente y excluye tanto las superficies no naturales como el polígono de madera. Las flores se añaden en puntos de apoyo válidos de los extremos, derivados del plan.

## Cascadas y profundidades

Se reemplazan los cuatro dibujos de rayas por un atlas de ocho frames para la cascada principal y uno de seis para las tres pequeñas. Los frames comparten caja de registro, con escala uniforme según la altura del desnivel. Las animaciones en bucle, a 8/7 FPS, varían corrientes internas, espuma y gotas; no trasladan toda la textura. Las piedras y la espuma tienen siluetas irregulares. Partículas diminutas y anillos fragmentados se agrupan en el Graphics de superficie y se recortan al agua. Se pausa la animación de cascadas fuera de cámara.

Las matas bajas y hierbas cuya proyección caía sobre la cara vertical pasan detrás del agua en esa zona, conservando sus posiciones/modelos y todos los nenúfares y matas del río. Los props altos y la vegetación de ribera siguen por delante donde corresponde. No se cambian las máscaras físicas.

Las cuatro texturas nuevas reproducen los colores y materiales de profundidad de la guía. `WaterLayer` conserva los 108 estratos por chunks del lecho/superficie y mezcla materiales según distancia a orilla: grava/arena/verde en bajíos, turquesa en profundidad media y azul en profundidad grande. Alfa aproximado de 40 % a 98 % oculta progresivamente el lecho. Los reflejos del tile tienen contraste reducido para mantener agua tranquila; se conservan las ondas animadas previas.

No se utiliza shader. El renderer WebGL instalado permite shaders, pero las texturas por capas conservan los píxeles y funcionan también con Canvas. Se evita coste adicional por refracción o blur.

## Navegación y rendimiento

Las áreas WALKABLE y NON-WALKABLE permanecen exactamente en `mapConfig.ts`, `collisions.ts` y `navigation.ts`; ninguno se modifica. Las regiones se conectan por los corredores existentes, no por el agua. Los postes y barandas son capas visuales colocadas fuera del centro del corredor, sin alterar las rutas.

Atlases compartidos, seis PNG de aproximadamente 774 KiB en total, suelo precompuesto por puente, tramos cortos por profundidad Y, culling cada 160 ms y sin objetos por tablón, piedra sumergida o partícula de espuma. Se añaden aproximadamente 280 imágenes modulares de puente. Césped continuo y batching anteriores permanecen.

## Verificación

`npm test`, `npm run typecheck`, `npm run build` y `git diff --check`. Prueba añadida para las tres familias, dimensiones iguales de los ocho/seis frames, accesibilidad de los diez corredores y 7.501 puntos de agua no transitables. Se mantienen las 124 rutas y 14.293 muestras de las pruebas anteriores, y 361 obstáculos físicos.

Treinta recorridos con el movimiento real de WorldScene: persona, pollito y vaca por cada puente; todos llegan al otro extremo sin pisar una celda ilegal. Auditoría de todos los puentes y cuatro cascadas con zoom, vista general, oclusión junto al barandal y móvil 390×844/DPR 2. Cero escalas no uniformes ni sprites de puentes rotados; 519 modelos acuáticos bajos permanecen. Medición orientativa: 54 FPS en escritorio y móvil emulado, sin errores de ejecución. No se prueba hardware móvil físico.

La advertencia previa de Vite sobre el bundle de Phaser permanece. Publicación en main mediante commit y push al repositorio existente, con verificación posterior de la versión `phase-2.8-river-craft` en Render.
