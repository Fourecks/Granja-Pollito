# Pradera nativa — 13 de octubre de 2026

Se reconstruye el césped a escala nativa de dos unidades de mundo por píxel. `grassArt.ts` define quince perfiles originales de microcésped, hierba corta/media/densa, bordes e integración delantera. Las briznas tienen tallos, puntas, hojas y tonos propios; se dibujan directamente con píxeles enteros, sin reducir o ampliar sprites de otro atlas ni interpolar.

Todo terreno natural de materiales 0/9/10/11 recibe grano continuo y microbriznas. Las máscaras excluyen caminos, agua, tierra, parcelas, plaza, arena y acantilados. Únicamente algunos píxeles de la primera fila del camino contigua a pradera reciben puntas bajas. Los grupos altos se favorecen en bosque y cerca del agua, sin pintar sobre el cauce. Las orillas y juncos existentes permanecen.

La colocación usa una semilla fija, ruido interpolado a dos escalas y formas variables. Las plantas pequeñas antiguas GRASS_SHORT/GRASS_WILD/WEEDS_SMALL dejan de dibujarse; el nuevo césped ocupa su lugar sin cambiar el plan físico. La geometría del mapa, zonas, caminos y colisiones no se modifican.

La integración delantera utiliza el mismo dibujo nativo. Los objetos bajos comparten chunks estáticos; árboles, rocas grandes y props altos mantienen patches con profundidad por Y. Las bases se recortan por las máscaras y los troncos conservan la escala uniforme existente. El sistema de anchors admite nuevos props sin añadir gameplay.

## Coste y validación

Medición local en Chrome headless: 34.080 grupos y 159.315 microgrupos, 88 chunks de césped, cobertura de textura en el 100 % de celdas verdes muestreadas de 8×8 píxeles. Solo 2.400 grupos (7 %) tienen poses de viento, precalculadas por chunk; las puntas se desplazan un píxel, con offsets y velocidades independientes. Los tallos permanecen fijos. Ninguna brizna es un GameObject individual.

Césped: aproximadamente 45,2 MiB de texturas RGBA; integración: 15,6 MiB estimados, sin overhead de navegador/GPU. 656 objetos de integración frente a 1.196 antes de agrupar las bases bajas. Culling limita a 12–16 chunks y 42–56 objetos de integración visibles en las vistas cercanas medidas.

55 FPS en vista general y 58–60 FPS en los sectores cercanos; 54 FPS en viewport móvil 390×844 con DPR 2. Son mediciones orientativas de emulación, no una prueba en hardware móvil físico. Sin errores de ejecución. Revisión de vista general, móvil y nueve sectores del mapa con zoom, además de los controles reales de arrastre y zoom.

Verificaciones: typecheck, build, tests de mundo/cámara, prueba de integración de vegetación y diff --check. Continúan intactos 361 obstáculos, 124 rutas y 14.293 muestras. Vite mantiene la advertencia existente por tamaño del bundle Phaser.

Publicación en la rama main del repositorio existente para activar el despliegue automático de Render; verificación posterior de la versión phase-2.6-grass-r2 en producción.

La auditoría por píxel de cada chunk añade recorte final de todas las poses: cero píxeles sobre agua, acantilados o materiales excluidos; solo se permiten puntas dispersas en el primer píxel de camino contiguo a pradera.
