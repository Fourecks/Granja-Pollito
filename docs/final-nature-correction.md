# Corrección final de Capa 2

## Alcance y preservación

Corrección local únicamente de microcésped, ocupación visual de vegetación y flores del campo de tulipanes. No se añaden zonas ni edificios. Se conservan la geometría, agua/cascadas, caminos, plaza, parcelas, banco/árbol/arco/sendero del campo, navegación, tareas, Supabase y sorpresa. Los puentes no se modifican ni se redimensionan.

El plan original de 4.193 plantas y sus 361 polígonos de colisión se conserva íntegramente. `vegetationOccupancy.ts` genera un plan de dibujo independiente; no cambia las posiciones ni la semilla del plan físico. Las pruebas de ocupación comprueban también que el original no se muta.

## Microcésped

6.993 tufts frente a los 3.495 anteriores (2,00×), sin aumentar su tamaño. Aproximadamente 82 % estático y 18 % seleccionado para animación. Se mantienen batching, chunks, máscaras de superficies y culling; no se crean objetos por brizna. Se utiliza el atlas anterior, sin añadir flores ni arbustos para poblar las praderas.

## Ocupación y lectura

Los objetos estructurales tienen áreas ocupadas y comprobación de intersecciones. La colocación de los decorativos grandes usa su cuerpo proyectado completo y un margen, excluyendo los cuerpos y bases de estructuras existentes. Los arbustos/rocas grandes dejan de dibujarse como parte del suelo y usan profundidad por Y.

Se rechazan 958 decoraciones que invadían cuerpos estructurales. Los pares con bases o cuerpos de roca superpuestos se representan como una sola formación visual coherente usando assets existentes, conservando la unión de las colisiones originales. Los tocones y troncos reciben perfiles visuales más bajos para evitar apilar sus cuerpos en perspectiva. Se resuelven 23 superposiciones de estructuras. Resultado: 505 áreas estructurales visibles, sin intersecciones entre sus footprints; 3.212 plantas dibujadas.

La integración usa detalles de 4–12 unidades de mundo: briznas, hojas, microplantas, flores pequeñas y piedritas. No utiliza arbustos/rocas/troncos completos apilados para simular integración.

## Tulipanes

`public/assets/tulip-flowers-v2.png` y `.json`: atlas separado exclusivamente para flores, ocho variantes. Los props permanecen en el atlas original y no se rediseñan. Modelos con cáliz puntiagudo y estrecho, tallo verde largo y hojas lanceoladas; dos variantes tienen dos/tres tallos separados.

`selectReadableTulips` mantiene las posiciones candidatas originales y escoge aquellas cuyas cabezas dejan un espacio verde alrededor. No altera el campo, bordes, senderos, claro, banca, árbol rosado, arco o cerca. Se dibujan 311 modelos legibles (algunos contienen más de un tulipán), conservando la identidad rosada general y dejando visibles los tallos. Las poses del viento siguen precalculadas en patches y pivotan desde la raíz.

Generado con la herramienta integrada ImageGen, usando el atlas/jardín anteriores como referencias. Prompt: ocho variantes de tulipanes rosados en una cuadrícula 4×2, cabezas en forma de cáliz con puntas, tallos largos y hojas estrechas; predominio de verde en la parte inferior; sin bouquets densos, flores redondas, hortensias, cerezo, props o suelo. Segundo prompt de limpieza: conservar exactamente las plantas y retirar todo fondo/halo, con alfa real incluso en los huecos entre tallos y hojas. El RGB oculto bajo alfa cero no aparece en el juego.

## Validación

Auditoría visual de nueve sectores cercanos que cubren todo el mapa y del campo de tulipanes; una pasada adicional corrigió perfiles de troncos/tocones. Comprobación automática: cero intersecciones entre áreas ocupadas, conservación exacta del plan físico y 361 colisiones. Comandos finales: `npm run typecheck`, `npm run build`, `git diff --check`. No se modifican los archivos de geometría, puentes, navegación, agua, zonas ni el plan del campo.

La tarea se detiene aquí. No se inicia arquitectura ni el kit de puentes. Los cambios quedan preparados en el proyecto local para revisión.
