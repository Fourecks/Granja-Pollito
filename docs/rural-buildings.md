# Parcelas, refugios y portones — revisión 3

Implementación local, sin commit, push ni despliegue. El usuario aprobó la dirección visual y pidió ampliar cerdos, completar vacas/cabras/conejos, mover pesca y cerrar los cercados con portones automáticos.

| Edificio | ID | Centro mundo | Cimientos | Ancho visual | Puerta | Acceso |
|---|---|---|---|---|---|---|
| Madera y piedras | resource-yard | 1664, 192 | 136×60 | 184 | 1664, 222 | resource-entry |
| Caballos | horse-stable | 1094, 576 | 166×68 | 234 | 1094, 610 | stable-entry |
| Cerdos | pig-shelter | 1360, 584 | 144×60 | 190 | 1360, 614 | pig-entry |
| Gallinero | chicken-coop | 730, 806 | 160×64 | 202 | 730, 838 | chicken-entry |
| Vacas | cow-barn | 2140, 636 | 176×80 | 248 | 2140, 676 | cow-entry |
| Refugio de cabras | goat-shelter | 318, 1294 | 104×48 | 146 | 318, 1318 | goat-entry |
| Refugio de conejos | rabbit-hutch | 2684, 1366 | 110×50 | 154 | 2684, 1391 | rabbit-entry |
| Invernadero | greenhouse | 2646, 920 | 164×140 | 216 | 2646, 990 | greenhouse-entry |
| Casa de la Jefa | jefa-house | 1750, 1186 | 180×60 | 248 | 1750, 1216 | jefa-house-entry |
| Pesca | fishing-hut | 2706, 1530 | 80×44 | 108 | 2706, 1552 | fishing-hut-entry |

## Cambios

- Cerdos: ancho visual 190 frente a 234 del establo de caballos, aproximadamente el 81%; cimientos y uniones de cerca adaptados.
- Cabras: refugio al oeste del lago y abajo, con acceso desde la ruta costera.
- Conejos: refugio bajo de madrigueras y cubierta vegetal antes de llegar a pesca.
- Vacas: establo y patio en el claro sobre los cultivos; alimentación, ordeño y patrullas llegan al patio nuevo.
- Caseta de pesca: trasladada al oeste del muelle. Se apartan árboles en conflicto de copa, cimientos o acceso, conservando el total de vegetación.
- Cinco portones: frentes de gallinas, caballos, cerdos y vacas, más lateral de caballos. Las hojas se abren en dos partes.
- La ruta del granjero solicita apertura con anticipación; el movimiento espera a que el portón esté abierto. La ocupación mantiene el paso libre y el cierre sucede después de despejarse. Los animales no pueden atravesar un portón cerrado.
- Cámara elevada y cuadrícula de dos unidades, materiales y cimientos de la revisión anterior conservados. Sin cambios en ríos, mar, cascadas, puentes o barrancos.

## Verificación

126 rutas y 15659 muestras; 35 caminos y 18 zonas conectados. Diez puertas accesibles, paredes sólidas y sprites transparentes. Pruebas de portones: bloqueo, permiso para planificar, apertura anticipada, ocupación, cierre y ausencia de disparos al pasar por fuera. Pruebas de cámara, vegetación, topografía y agua, typecheck y build. Persisten 4198 plantas, 361 bases sólidas y los diez árboles importantes.

## Assets

ImageGen integrado produjo goat-shelter-v1, rabbit-hutch-v1 y cow-barn-v1, guardados con alfa en public/assets/. Se mantiene pig-shelter-v2 ampliado y fishing-hut-v2 trasladado.

Prompt compartido: «Isolated transparent Granja Pollito sprite matching the annotated farm map, 60-degree overhead orthographic camera, dominant roof planes, short south-facing facade, conceptual 128-pixel grid, warm timber and terracotta, mossy stone footing, no background, gradients, halo, text or fences». Sujetos: refugio sencillo para cabras con heno y agua; madriguera baja de conejos con césped y caja de zanahorias; establo lechero con puertas dobles, puestos, heno y lecheras. Recorte alfa y reducción con vecino próximo a 128 píxeles de ancho.

Local: http://127.0.0.1:5174/
