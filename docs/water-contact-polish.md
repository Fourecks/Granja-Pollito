# Pase quirúrgico de contacto agua–roca — capa 3.1

## Alcance bloqueado
Se mantienen idénticos los catorce grupos de geometría histórica de scripts/fixtures/topography-original.json. No cambian costas, barrancos, ríos, lagos, caminos, tamaño del mundo, colisiones, navegación, cámara, UI, tareas, Supabase ni el plan físico de vegetación. Los diez puentes actuales y sus variantes se conservan; tampoco se regeneran sus PNG.

## 1. Origen del rectángulo/escalera gris
Era la textura procedural terrain-stairs-pier-steps creada por RampLayer, introducida en la restauración 3.0. Pintaba una pendiente gris ancha y peldaños de piedra entre los dos tramos de fishing-pier que BridgeLayer recorta fuera de la pared. No era un PNG antiguo olvidado: eran dos generadores con materiales distintos.

Solo esa transición ahora comparte eje, anchura y material de tablones del muelle. Desaparecen la plataforma gris plana y los peldaños de piedra del cruce. A sus lados se utiliza el material exacto de la pared original, sin añadir geografía. Los otros siete pasos mantienen su dibujo.

## 2. Continuación sumergida
SubmergedCliffLayer deriva una continuación visual de los bordes inferiores originales de cliffFaces, limitada a 30 unidades de mundo y recortada al agua real. No muta vértices ni máscaras de terreno. La piedra conserva los tamaños nativos de bloque de la pared, con gris poco saturado y contraste reducido.

Orden de composición: lecho (-29), roca sumergida (-28.5), superficie del agua (-28), reflejos animados (-12). La superficie conserva sus texturas/color actuales y adapta su transparencia exclusivamente sobre esta estrecha continuación: aproximadamente 68% cerca del borde, volviendo progresivamente al valor profundo habitual. La roca pierde visibilidad gradualmente con la profundidad, por lo que recibe físicamente el color del agua situada delante. No es una roca semitransparente colocada encima del agua.

Se dibujan 13 chunks y 13.274 píxeles nativos, todos dentro del agua y fuera de la máscara opaca de pared. El resto del agua se conserva igual.

## 3. Paleta y animación
Los colores base se toman del resultado real de lecho, roca sumergida y superficie del agua actual, con su alfa y profundidad. Valores de ejemplo muestreados aguas arriba:

| Cascada | RGB | Hex |
| --- | --- | --- |
| Norte | 24,107,128 | #186B80 |
| Oeste | 19,113,139 | #13718B |
| Salida del lago | 29,105,114 | #1D6972 |
| Este | 40,114,118 | #287276 |
| Desembocadura oriental | 49,112,120 | #317078 |

La base normal conserva 75% de ese agua y 25% de los frames existentes. Los pocos reflejos del labio, líneas verticales e impacto tienen una mezcla más clara; el centro permanece azul/verdeazulado profundo. La entrada y el impacto usan alfa gradual recortado al cauce. Se conservan seis frames a siete FPS, animación interna, pequeñas ondas y splash proporcionado; los píxeles de la silueta exterior son idénticos entre todos los frames.

## 4. Cascada superior histórica
Git (mapConfig de 79a08a1, equivalente a la definición pre-puentes en 4e85b032/c01debed) registra north-falls en point(565,43), es decir (1130,86) del mundo, en north-river. Su dirección era vertical hacia abajo. La huella antigua tenía altura 103 de autoría, equivalente a una imagen de 206 unidades; se conserva el ancla exacta con la escala compacta del estilo actual.

La definición histórica no tenía allí un polígono de cliffFaces. Se explicó ese conflicto al usuario y este autorizó explícitamente recuperar el desnivel visual histórico en el punto original, sin alterar topografía ni colisiones. Se reutilizan rocas/frames actuales para ese escalón visual local y un descenso compacto de 60 unidades. No se añade ni mueve ningún barranco físico. La navegación del agua permanece bloqueada.

## 5. Inventario final
Cinco cascadas, todas conservando la animación:
- north-falls: río norte, ancla histórica (1130,86), desnivel visual autorizado.
- west-falls: west-stream / west-falls-bank, (312.268,736.929).
- east-falls: east-stream / east-falls-bank, (2950.238,976.491).
- south-falls: lake-outlet / south-coast, (1743.410,1601.112).
- east-mouth-falls: east-stream / south-coast, (2972.684,1612.119).

Las cuatro ubicaciones de la capa 3.0 quedan exactamente iguales.

## Validación
Typecheck, build, diff --check y pruebas de topografía/puentes; cero cambios en los catorce grupos históricos. Cobertura de pared sin píxeles faltantes, composición sumergida correcta y cero píxeles de tablero sobre barrancos. 54 cruces de trabajador/pollito/vaca terminados sin posiciones ilegales. Revisión visual de cinco caídas, siete barrancos y los tres sectores de costa; escritorio/móvil, límites reales de zoom y Canvas además de WebGL. Siluetas de los seis frames iguales, cinco animaciones activas, cero excepciones y 54 FPS en Canvas móvil. Las 519 plantas acuáticas y el plan de 4.193 instancias / 361 obstáculos se conservan.

