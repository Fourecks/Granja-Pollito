# Pulido visual final de Capa 2

Se conserva el plan físico original (4.193 plantas, 361 colisiones), las bases/posiciones de los árboles, los habitats y los hitos. El pulido modifica únicamente el plan de dibujo. No se cambian mapa, puentes, agua, parcelas, caminos, navegación, UI ni tareas.

- Microcésped: ocho perfiles reutilizan los cuatro sprites aprobados con proporciones, tamaños, espejo y opacidad diferentes. Densidad agrupada mediante ruido interpolado en dos escalas, sin rejilla visible. Cantidad próxima a la anterior, 16% animado; chunks estáticos y culling existente. Claro de microcésped alrededor del árbol con columpio.
- Bosques: 58 siluetas ajustadas según el solapamiento proyectado de copas, preservando las raíces y todos los árboles. Se priorizan los hitos; los vecinos del columpio no ocultan sus cuerdas/asiento. Las agrupaciones originales mantienen bosque denso, ligero y praderas abiertas; no se reparten árboles uniformemente.
- Troncos/tocones: 40 de 117 (34%) pasan a restos bajos de ramas en sus mismas bases. La huella física permanece visible y no se generan obstáculos invisibles al retirar troncos. No se agregan nuevos objetos.
- Flores normales: 204 decoraciones menos; selección por densidad orgánica, conservando acentos de color. 119 decoraciones de orilla menos en pequeñas pausas, conservando rocas, juncos y plantas acuáticas en grupos.
- Bases: sombras de contacto mínimas y fragmentadas, briznas/hojas/musgo y piedras pequeñas horneadas en el suelo; sin arbustos añadidos.
- Tulipanes: se conservan el atlas aprobado, color, campo, props y sendero. 284 modelos con pequeñas costuras y huecos de césped; 10 de 57 patches (18%) seleccionados para viento, con variaciones existentes de fase, amplitud y velocidad. Fuera de cámara no actualizan.

Validación: revisión cercana de los nueve sectores que cubren todo el mapa, composición a escala normal y columpio visible. Cero intersecciones entre las 505 áreas estructurales, plan físico sin mutación y actores sobre navegación válida. `npm run typecheck`, `npm run build`, `git diff --check`.

Trabajo local únicamente. Se detiene sin avanzar edificios, animales ni kit de puentes.
