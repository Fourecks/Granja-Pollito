# Integración natural, escala y agua — 13 de octubre de 2026

El césped continuo permanece intacto: 34.080 grupos, 159.315 microgrupos, 15 perfiles y 7 % de viento por chunks. No se modifica la geometría, caminos, navegación, plan físico, cámara, tareas, recursos, Supabase ni progreso offline.

## Escala canónica

`naturalScale.ts` define alturas en unidades de mundo por categoría, con variación determinista de ±10 %. Árboles adultos ordinarios: 116; frutales: 112; pinos: 124; palmeras: 120. Los modelos deliberadamente grandes tienen categorías propias: TREE_LARGE 164 y OLD_TREE 176. No se añaden juveniles artificiales.

Los frutales tenían nombres FRUIT_TREE_01/02 que el generador físico no reconocía como árboles; su altura era la de una planta de 20 unidades. Se corrige exclusivamente su modelo visual, manteniendo las posiciones originales y resolviendo la ocupación con su cuerpo adulto. Se elimina el encogimiento iterativo de copas que reducía adultos hasta 55–62 %, y la sustitución de troncos/tocones por ramas para disimular tamaños.

FALLEN_LOG y HOLLOW_LOG mantienen su asset propio a altura canónica 42; ramas 14 y tocones 28. Rocas pequeñas, medianas, grandes, formaciones y detalles de acantilado tienen tamaños explícitos. Flores bajas usan una escala consistente de 28. Toda planta conserva la relación de aspecto original del atlas. Las 361 colisiones físicas permanecen exactamente iguales.

## Bases y profundidad

Se amplían las bases de árboles y la cobertura frontal, incluyendo hierbas altas, plantas, flores, frutales, hongos, troncos, tocones y rocas. Los patches mezclan briznas, pequeñas hojas y algún acento floral diminuto según categoría, con posiciones irregulares. No se dibujan aros. Los objetos bajos comparten chunks; los altos conservan orden por Y. El recorte por píxel excluye agua, caminos, tierra y otras superficies no naturales.

`ActorGrassOcclusionLayer` reutiliza una textura de 96×48 píxeles por actor visible, renderizada directamente a un píxel por unidad de mundo, para añadir briznas finas sobre zapatos/patas. Consulta terreno y una pequeña tabla espacial de césped alto/juncos. Cobertura nominal corta/media/alta: 4/8/16 unidades, limitada al 25 % de la altura del sprite. Calcula la última fila opaca de cada frame y la almacena en caché para alinear con pies reales, incluyendo frames con márgenes transparentes. El patch se recorta contra terreno verde, aparece por encima del actor y se oculta al salir del césped. No cambia su posición física, sprite, colisión, ruta o animación. Se redibuja solo al cambiar de píxel o cobertura; no hay objetos por brizna ni reacción extra que añada simulación.

## Orillas y agua

`WaterHabitat` calcula una distancia a orilla compartida mediante dos pasadas chamfer sobre la máscara existente. Solo CATTAILS/REEDS_01/REEDS_02 participan en la corrección de raíces: se conservan posiciones válidas y se busca la orilla seca más próxima dentro de 44 unidades, evitando cascadas, puentes, caminos y raíces repetidas. Se reubican 98 modelos y se omiten 28 sin sitio válido. Los 105 modelos altos dibujados tienen raíz sobre terreno natural junto al agua. WATER_GRASS, LILY_PAD y LILY_FLOWER quedan fuera de este filtro: permanecen 519 modelos bajos acuáticos con sus posiciones.

El río se compone de fondo estático con arena, grava y pequeños acentos vegetales, agua semitransparente según distancia a orilla y la superficie animada existente. Alfa: aproximadamente 32 % junto a la orilla, creciendo hasta 96 % en profundidad; colores claros/verdosos en bajíos y azul más oscuro en el centro. Los dos estratos adicionales usan 108 imágenes por chunks, unos 6,8 MiB RGBA, con culling. No hay objetos por piedra o planta sumergida.

Se inspeccionó el renderer instalado de Phaser 4: WebGL está activo en el navegador de prueba y Shader usa renders independientes que terminan el batch actual. Esta pasada utiliza capas y alfa estándar para conservar pixel-perfect y evitar renders extra por refracción. No incorpora shader; el mismo efecto se verificó también forzando Canvas (renderer 1), con 54 FPS en móvil emulado. No usa blur ni filtrado interpolado.

## Verificación

Pruebas de categorías dentro de ±10 %, frutales adultos, inmutabilidad del plan físico, raíces de juncos altas en orilla y preservación de plantas acuáticas bajas añadidas a `npm test`, junto a las comprobaciones existentes de vegetación y mundo/cámara. Cero imágenes naturales con escala no uniforme en la auditoría del renderer.

Recorrido de nueve sectores que cubren el mapa, vista general, zoom y viewport móvil 390×844/DPR 2. Comprobación visual separada de persona, pollito, vaca y perro en césped corto/medio/alto y pavimento: 16 casos, sin errores; sobre superficies no naturales el sprite vuelve a verse completo. Los animales son fixtures temporales del navegador de prueba; no se añaden actores ni gameplay al mapa.

Mediciones orientativas en Chrome headless: 54 FPS en vista general, 50 FPS en el último sector con zoom durante el recorrido de capturas y 54 FPS en móvil emulado. Se mantienen batching y culling. Integración: 685 imágenes, aproximadamente 17,8 MiB RGBA; oclusión de actores: unos 18 KiB por actor. Estas mediciones no sustituyen pruebas en teléfonos físicos.

`npm test`, `npm run typecheck`, `npm run build` y `git diff --check` pasan. El mundo conserva 124 rutas y 14.293 muestras verificadas, 25 caminos, 18 parcelas y 361 obstáculos. Vite mantiene su advertencia previa sobre el tamaño del bundle Phaser.
