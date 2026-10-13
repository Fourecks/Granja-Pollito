> Informe histórico de la capa 3.0. La cascada norte vuelve en la capa 3.1 mediante el desnivel visual autorizado; detalles en water-contact-polish.md. La geometría restaurada permanece idéntica.

# Restauración selectiva de topografía — capa 3.0

## Referencia histórica y causa

Se consultó GitHub y el historial local: 4e85b032a8418f8fc37a69fe0e8ab72e3e7ba079 es la referencia anterior al primer reemplazo de puentes/cascadas; c01debed61fb94ae3858c039db46f844279cfd2e mantiene exactamente su mapConfig y todavía dibuja las paredes sobre el agua. Las definiciones geográficas proceden del pase de conexiones de caminos anterior; no se reconstruyeron de memoria.

El commit 0f62aeaf5ccbb6e879c28b211dcd558dda8e6ae0 añadió en TerrainLayers la condición topography && isWater -> continue. Su efecto fue global: ocultar la pared en la intersección con río, lago o mar, incluyendo buena parte de la costa sur/oriental. No se habían eliminado los vértices ni añadido polígonos de playa: se dejó visible el agua/arena que ya estaba debajo. También cambió las anchuras de los ocho pasos de terreno y los incluyó en BridgeLayer, dibujando largos tableros de piedra en desniveles.

## Restauración

1. Se elimina la supresión global: vuelve a dibujarse cada píxel de la máscara histórica de barrancos, incluso sobre el agua.
2. Se recuperan las anchuras y polígonos originales de los ocho pasos de desnivel. Los diez puentes mantienen su anchura actual de sendero y sus extremos históricos.
3. RampLayer distingue escaleras/pendientes de puentes. Se dibujan peldaños solamente sobre la intersección con la pared original, con acceso y salida por el camino; desaparecen barandas y tableros de puente sobre acantilados. Los tableros de BridgeLayer se recortan también fuera de toda pared rocosa.
4. Las ondas de agua ya no se dibujan encima de una pared o de una escalera. Se mantiene el agua actual con sus 108 capas de profundidad/lecho y seis frames de animación.
5. El labio vegetal y la sombra inferior permanecen dentro de la silueta de la pared: no se añaden tierras, arena, pendientes geográficas, alturas ni extensiones de barranco.

La geometría coincide con la histórica en los catorce grupos protegidos: MAP, SCALE, coast, mainland, islands, lake, rivers, sea, waterPools, rawWater, cliffs, cliffFaces, ramps y roads. SHA256 de los valores serializados en scripts/fixtures/topography-original.json; check-topography.cjs los compara con la versión actual. src/data/world.ts y src/Scene.tsx siguen idénticos a esa referencia.

## Agua y cascadas, después de recuperar los barrancos

waterfallGeometry.ts cruza las líneas originales de río con el borde superior del barranco y encuentra la salida en su cara inferior. No cambia las líneas ni sus polígonos. Las caídas existentes del oeste/este se anclan exactamente al borde, y la del sur se alinea con la verdadera desembocadura del lago.

La cascada norte estaba sobre un tramo plano, incluso en la definición antigua. No se inventa un barranco para justificarla: deja de instanciarse allí. La cuarta caída se coloca en la desembocadura oriental, donde el río termina en la cara histórica de la costa. Su descenso visual sigue la tangente terminal hasta el mar ya existente, sin modificar el curso físico.

Se reutilizan los frames small/medium v2 actuales. El agua animada se compone a píxel nativo sobre el canal de descenso; las rocas con musgo se colocan separadamente en el labio y conservan sus proporciones. Las caídas resultantes miden aproximadamente 72,5 / 80,0 / 64,0 / 61,6 unidades, determinadas por el barranco existente. Las partes inicial/final del agua se recortan a la máscara original. Las plantas bajas se ordenan detrás del descenso cuando su proyección coincide con él; sus posiciones y las 519 plantas acuáticas se conservan.

## Comprobación global

- Cero diferencias en los catorce grupos de geometría histórica.
- Cobertura de textura: todos los píxeles de pared presentes; 25.385 píxeles nativos de pared coincidentes con agua vuelven a dibujarse; cero píxeles faltantes.
- Cero píxeles de tablero dibujados sobre caras de acantilado.
- Siete barrancos completos, ocho pasos de terreno, diez puentes y cuatro caídas sobre desniveles reales.
- 124 rutas y 14.313 muestras; 54 cruces reales de trabajador/pollito/vaca, todos terminados sin posiciones ilegales.
- Césped/vegetación, 4.193 instancias físicas y 361 obstáculos, cámara, tareas, interiores, celebración y progreso offline preservados.
- Escritorio y móvil, WebGL y Canvas, límites reales de zoom y frames animados; cero excepciones.
- Typecheck, build y diff --check.

No se hizo un revert general. La capa 2.9 y sus assets se conservan selectivamente donde son compatibles con la estructura original.

