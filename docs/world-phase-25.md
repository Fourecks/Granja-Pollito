# Capa 2.5 — naturaleza final y Campo de Tulipanes Rosados

## Alcance

Pase sobre la Capa 2 existente. Se conservan los atlas anteriores, sus 4.193 elementos, distribución y 361 bases sólidas. No se modifica geometría, topografía, parcelas, caminos principales, agua, cascadas, puentes, Bosque Norte ni Santuario de Pandas. No se construye Capa 3 ni se añaden animales.

## Césped e integración

Microcésped: 3.495 tufts frente a los 1.034 anteriores (3,38×); 862 seleccionados para animación, aproximadamente 25 %. Se conserva el tamaño de las briznas. Los 80 chunks hornean el contenido estático y precalculan sus poses animadas; no existen miles de GameObjects ni actualizaciones por brizna. Sólo los chunks visibles cambian de frame.

La máscara de toda la huella impide césped en caminos, plaza, agua, acantilados, arena, barro, cultivos y pasos. Se conserva descanso visual alrededor de accesos y futuros edificios. Las praderas mezclan briznas y tufts, el bosque favorece tufts oscuros/irregulares, pandas usa brotes cortos, las superficies de granja favorecen briznas cortas y la costa reduce densidad.

`vegetationIntegration.ts` dibuja transiciones pequeñas en el mismo canvas estático: césped, hojas y brotes alrededor de bases, pequeñas piedras junto a rocas, flores más pequeñas en el perímetro de clusters y microplantas húmedas junto a juncos. Las posiciones y diseños originales se conservan. Los desplazamientos son irregulares; no se dibujan anillos repetidos. No añade colisiones ni objetos por detalle.

## Viento

`ExteriorScene.wind.direction` (radianes), `.strength` (0–1, inicial .18). La respuesta combina una onda que se propaga por posición en la dirección del viento con pequeñas variaciones locales de fase, amplitud y velocidad. Microcésped reacciona más rápido; bambú y copas, más lento. Se mantiene la selección limitada de elementos animados y el culling.

Tulipanes: poses precalculadas mediante una inclinación alrededor de la raíz del tallo, sin trasladar lateralmente el objeto entero. Con fuerza cero se utiliza la pose quieta. Una selección de patches recibe la onda espacial con desfases; los demás permanecen estáticos.

## Zona oficial y diseño

`pinkTulipField` se registra en `tulipFieldPlan.ts` y su lista `naturalZones`, en la pradera libre del noreste, centro de autor aproximado (1380, 240). El área orgánica se recorta por suelo seco, reservas y vegetación sólida existente. No ocupa edificios, corrales, cultivos ni otros sectores oficiales.

El campo contiene 1.668 instancias de tulipanes individuales/brotes/clusters, predominantemente rosa. La composición prioriza flores individuales y pequeños grupos para distinguir las copas desde cerca; los grupos mayores son menos frecuentes. Se dibujan en 60 patches con bandas de profundidad de 32 unidades; 16 patches (27 %) tienen poses animadas. Suelo y sendero son chunks aparte. Se reutilizan cuatro de las 18 mariposas existentes como habitantes del campo, sin aumentar el límite.

Un sendero secundario sale del camino de woodland, atraviesa el arco y conduce al claro de descanso; su trazado se obtiene con la navegación existente y las nuevas huellas para conservar continuidad. No altera ningún camino principal ni las máscaras de Capa 1. El claro es pequeño, con piedra cálida y discretas marcas de pavimento.

Props: una banca de madera a escala humana, un árbol rosado del atlas existente, un arco floral y dos tramos de cerca baja abiertos. La banca tiene ID `pinkTulipBench`, hit target y evento `natural-object-selected`; la interacción futura de sentarse queda preparada sin añadir lógica de sentarse. El árbol se separó un poco para dejar visible la mayor parte de la banca bajo un borde de su copa.

## Profundidad y colisiones

Tulipanes transitables; los batches ordenan su profundidad por bandas de pies. Banca/tronco usan profundidad por Y y huellas pequeñas. El arco separa visualmente corona y postes: sólo las dos bases de postes bloquean, el hueco central queda libre y la corona se ordena por delante cuando corresponde. Se añaden cuatro polígonos de colisión (banca, tronco y dos postes) al NavigationGrid existente; no se cambian las reglas de agua, acantilados ni pasos. Cerca parcial decorativa, sin encerrar el campo.

## Atlas y prompt

`public/assets/tulip-garden-atlas.png` y `.json`: 16 frames con transparencia, una precarga de imagen y una de JSON. Creado con la herramienta integrada ImageGen usando el jardín conceptual del usuario y el atlas actual como referencias, sin reutilizar el mapa conceptual como fondo ni como parche de terreno.

Prompt: atlas aislado de cuatro filas por cuatro columnas, sin textos/bordes, pixel art detallado con perspectiva RPG de tres cuartos y luz superior izquierda. Fila 1: cuatro tulipanes rosados individuales. Fila 2: capullo y clusters pequeños/medianos/grandes. Fila 3: banca, arco con paso abierto, cerca baja y farol. Fila 4: brotes, pétalos, roca con musgo y arbusto rosado. Sombras sutiles, madera cálida, hojas verdes profundas y copas rosadas fieles al catálogo. Las animaciones usan los mismos assets para conservar su lenguaje visual.

El farol/roca/arbusto del atlas quedan disponibles; la composición actual sólo coloca los elementos necesarios para no saturar el jardín.

## Verificación

`npm run typecheck`, `npm run build`, `npm test`, `git diff --check`. Pruebas: 124 rutas, 14.293 muestras, caminos/puentes/rampas, agua/acantilados, tareas/regreso, interiores, progreso offline, sorpresa y cámara/pinch/resize. Pruebas adicionales: campo grande fuera de reservas/agua, sendero despejado y transitable, conexión desde plaza, tulipanes transitables, banca/tronco bloqueados, paso bajo el arco y desfases de viento. Supabase, música, lógica de tareas y progreso no cambian; no se hacen escrituras nuevas de prueba en Supabase.

Revisión visual general y cercana, con un refinamiento adicional para reducir solapamiento de tulipanes y descubrir la banca. Capturas `capa-25-general.jpg`, `capa-25-tulipanes.jpg` y `capa-25-mobile.jpg`. Los FPS son observaciones del navegador en este equipo, no una garantía en teléfonos físicos. Capa 2 se detiene aquí.
