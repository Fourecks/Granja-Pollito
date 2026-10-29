# Distribución propuesta — fase de auditoría y overlay

Coordenadas en unidades del mundo Phaser (3072 × 2048). La configuración artística original usa la mitad. Los tamaños son footprints en suelo, no el volumen del tejado. Los contornos coloreados son reservas aproximadas, no nuevas colisiones.

| Zona | ID | Coordenadas (centro) | Tamaño suelo | Construcción | Entrada | Conexión al camino (punto) | Modificaciones necesarias |
|---|---|---|---|---|---|---|---|
| Pandas | panda-habitat | 500, 400 | Área existente | Sin edificio | Libre | Red existente | Conservar el bambusal; sin edificio. |
| Madera y piedras | resource-yard | 1620, 192 | 120 × 44 | Propuesta | 1620, 214 | mixed-north (1548, 158) | Cobertizo pequeño; auditar troncos y piedras locales. 6 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |
| Caballos | horse-stable | 1094, 580 | 144 × 64 | Propuesta | 1094, 612 | plaza-mixed (1216, 653) | Establo al norte; reservar el resto como corral. 0 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |
| Cerdos | pig-shelter | 1350, 606 | 92 × 48 | Propuesta | 1350, 630 | mixed-cows (1304, 700) | Dependencia menor; conservar barro y patio. 0 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |
| Gallinero | chicken-coop | 742, 828 | 132 × 56 | Propuesta | 742, 856 | plaza-coop (743, 862) | Gallinero al norte del acceso; patio alrededor. 0 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |
| Plaza | central-plaza | 1426, 972 | Área existente | Sin edificio | Libre | Red existente | Espacio abierto; sin edificio. |
| Cultivos | crop-fields | 2180, 952 | Área existente | Sin edificio | Libre | Red existente | Campo exclusivamente agrícola; sin granero. |
| Invernadero | greenhouse | 2646, 894 | 156 × 72 | Propuesta | 2646, 930 | crops-greenhouse (2646, 970) | Vidrio y plantas; acceso frontal futuro. 0 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |
| Casa de la Jefa | jefa-house | 1750, 1130 | 172 × 64 | Existente | 1750, 1158 | jefa-house-entry (1750, 1184) | Casa existente; conservar jardín y barranco. 0 plantas por revisar localmente; 200 muestras bloqueadas del suelo (cimientos existentes). Acceso actual desde plaza: sí. |
| Cabras | goat-habitat | 280, 1240 | Área existente | Sin edificio | Libre | Red existente | Ubicación de la imagen: oeste del lago. No usar sheepGoatArea. |
| Conejos | rabbit-habitat | 2800, 1350 | Área existente | Sin edificio | Libre | Red existente | Madrigueras y troncos; sin casa principal. |
| Pesca | fishing-hut | 2844, 1528 | 64 × 36 | Propuesta | 2844, 1546 | fishing (2800, 1550) | Caseta junto al acceso superior al muelle; mantener gradas. 2 plantas por revisar localmente; 0 muestras bloqueadas del suelo. Acceso actual desde plaza: sí. |

## Criterios para revisión

- La imagen anotada manda sobre los antiguos nombres de zonas. Cabras se reservan al oeste del lago; sheepGoatArea al este no se reutiliza para ellas.
- Caballos y cerdos comparten el conjunto ganadero, con patios separados.
- El contorno ámbar representa solo el apoyo en suelo. Tejados y altura se diseñarán después de aprobar la distribución.
- Las conexiones turquesas son propuestas, no caminos construidos. Deben resolver vegetación local antes de implementarse.
- Los recuentos de plantas son una primera intersección conservadora; ninguna planta se mueve durante esta fase.
- El overlay no añade obstáculos, edificios, interacciones ni cambios de tareas. Se activa solo en desarrollo con ?planning=1 y se alterna con P.
- Orden posterior: casa, gallinero, caballos, cerdos, cultivos, invernadero, recursos, pesca, pandas, cabras y conejos.
