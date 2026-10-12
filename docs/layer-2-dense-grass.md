# Cierre visual de Capa 2 — pradera abundante

La referencia se aplica como guía de dirección artística al mapa existente. No se copia su composición espacial ni se modifica geometría, agua, puentes, caminos, parcelas, navegación, colisiones, UI o funciones del juego.

## Densidad y legibilidad

28.990 tufts (frente a 6.888 del pulido anterior) y 166.114 briznas de fondo diminutas, horneadas una vez en los chunks. Doce perfiles reutilizan el atlas aprobado con variación de tamaño, forma, espejo y opacidad. La textura de fondo reduce las superficies lisas; los tufts mantienen grupos de densidad irregular. Las celdas de terreno verde con alguna textura fina alcanzan 98%; esta medida indica distribución espacial, no 98% de píxeles opacos. El verde sigue visible entre briznas.

Las máscaras excluyen agua, arena, barro, suelo agrícola, caminos, plaza y acantilados. Las pequeñas briznas se acercan irregularmente al borde exterior del camino sin ocupar su centro. Las zonas reservadas de césped admiten textura, conservando sus obstáculos y superficies originales. Los claros del columpio y accesos quedan con textura baja y espacio para leerlos.

## Rendimiento y viento

88 chunks; no hay GameObject por brizna. La microtextura usa los mismos canvases estáticos y no se recalcula durante la animación. Se seleccionan 3.489 tufts (12%) para poses precalculadas; el resto permanece estático. Tulipanes: 7 de 57 patches animados (12%). Se conservan los offsets, amplitudes, velocidades y desplazamiento sectorial existentes del viento. Los elementos fuera de cámara no actualizan sus poses.

Texturas de microcésped estimadas: 45,2 MiB RGBA sin contar overhead/duplicación del navegador, frente a aproximadamente 43,6 MiB para 85 chunks equivalentes. Más densidad aumenta principalmente el trabajo inicial de horneado y no la cantidad de objetos animados. Se elimina la rotación de árboles completos: troncos quietos, hojas/partículas existentes conservadas.

## Composición conservada

Se mantienen el pulido anterior de bases con microdetalles/sombras mínimas, las siluetas legibles de bosques, el rincón del columpio, la reducción de troncos/tocones prominentes, flores como acentos y pausas de vegetación acuática. El atlas de tulipanes, campo, banca, árbol rosado, arco y sendero permanecen aprobados.

## Auditoría

Revisión manual cercana de los nueve sectores, vista general, móvil, zoom y drag. Diagnósticos en vivo: plan físico 4.193 plantas y 361 colisiones, 505 footprints sin intersecciones y actores sobre navegación válida. Se comprueban animación de agua/viento y errores de consola. Mediciones de FPS son observaciones del navegador de prueba, no una garantía en dispositivos móviles físicos.

Comandos: npm run typecheck; npm run build; git diff --check. Despliegue de producción autorizado por el usuario en esta tarea. No se inicia otra capa.
