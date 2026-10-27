> Documento histórico de la capa 2.9. La supresión de paredes sobre agua y el tratamiento de rampas como puentes se corrigen en topography-restoration.md (capa 3.0).

# Mini puentes y cascadas — capa 2.9

Referencia objetivo: Diseños de puentes, cascadas y ríos.png. Se conservan ubicaciones, extremos, senderos y distribución del mapa.

## Auditoría completa
Los diez puentes/muelle y ocho pasos de desnivel utilizan BridgeLayer. Se elimina el generador anterior phase1-crossing y sus imágenes rotadas de rampas. Los kits farm/large y waterfall-main v1 quedan como material histórico, sin cargas ni instancias activas.

| Cruce | Diseño | Tablero, unidades de mundo |
| --- | --- | --- |
| north-bridge | madera con cuerda | 30 |
| plaza-bridge | piedra con musgo | 26 |
| panda-bridge | madera rústica | 30 |
| duck-bridge | pasarela sencilla | 32 |
| duck-east-bridge | piedra ligeramente arqueada | 24 |
| lake-island-bridge | madera con cuerda | 22 |
| beach-island-bridge | piedra con musgo | 22 |
| south-bridge | madera rústica | 28 |
| east-bridge | madera rústica | 24 |
| fishing-pier | pasarela sencilla | 26 |
| north-steps | paso de piedra | 30 |
| forest-pass | paso de piedra | 24 |
| west-pass | paso de piedra | 22 |
| coop-steps | paso de piedra | 24 |
| home-steps | paso de piedra | 24 |
| beach-west-steps | paso de piedra | 22 |
| beach-east-steps | paso de piedra | 36 |
| pier-steps | paso de piedra | 26 |

La anchura anterior duplicaba el parámetro de corredor, produciendo tableros de 48–68 unidades. Ahora la anchura coincide con el sendero conectado, 22–36, en arte y navegación. Se mantienen las luces entre orillas: acortar un cruce de lago dejaría agua sin soporte. Cuatro postes por puente, seis solo en el cruce largo de cuerda, ninguno en las pasarelas. Total 64 postes; altura 14 piedra/20 madera. Componentes y sombras conservan escala uniforme y perspectiva vertical; ningún sprite de puente completo se gira. Barandas por tramos de hasta 16 unidades, con depth Y local, y aperturas en encuentros entre pasos.

## Cascadas
North/south usan waterfall-medium-v2 con seis frames; west/east waterfall-small-v2 con seis frames. Alturas completas 68/58 y 46/46 unidades respectivamente, frente a 206/104/120/106. Agua teal, rocas cálidas con musgo, espuma y pequeñas ondas, animación 7 FPS; se pausa fuera de cámara. El río permanece visible en la intersección con la capa visual del acantilado para no dejar la antigua pared grande tras la caída compacta. Esto no modifica agua ni colisiones de acantilado.

Continúan los 108 chunks de lecho y profundidad, las 519 plantas acuáticas bajas y los 4.193 elementos del plan físico de vegetación (361 obstáculos). Los props de ribera y capas de hierba se preservan; solo el orden de vegetación sobre las nuevas caídas se adapta a sus huellas.

Assets originales, ImageGen integrada y prompts exactos: mini-river-prompts.md. Tres PNG nuevos suman 271.712 bytes.

## Navegación
Una rejilla de 16 unidades con vecinos solo ortogonales no resuelve algunos corredores diagonales estrechos. Los nodos dentro de puentes/pasos rectangulares estrechos se alinean con su eje. Se permiten ocho vecinos, con coste de distancia real. Cada segmento sigue comprobando continuamente las nueve sondas de la huella contra TODOS los límites del terreno: no se relajan canWalk, obstáculos ni agua. Fuera de cruces la rejilla conserva sus coordenadas. Las 124 rutas del test integral y 54 cruces reales de tres tipos de actor verifican la conexión sin ocupar agua.

## Verificación
- npm run typecheck, npm run build y git diff --check.
- Test del mundo: 124 rutas, 14.319 muestras; 25 caminos y 18 parcelas, tareas, interiores, progreso offline y celebración.
- Cámara, integración vegetal y escalas naturales.
- 18 cruces válidos y 7.641 muestras de agua prohibidas; atlas 6/6 con registro común.
- Chrome desktop y móvil: todos los 18 cruces y cuatro cascadas, orientaciones, depth, zoom real mínimo/máximo, animación y cero excepciones.
- Trabajador, pollito y vaca: 54 cruces terminados, cero posiciones ilegales.
- Renderer Canvas móvil además de WebGL; no shaders.

