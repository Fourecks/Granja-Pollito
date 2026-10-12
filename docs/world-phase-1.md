# Reconstrucción del plano maestro — Fase 1

La imagen «Mapa base de Granja Pollito» es una referencia de composición. No se copia a `public`, no se carga como textura ni se recorta para construir este exterior.

## Inspección inicial

El exterior anterior (`ExteriorScene`, `data/world.ts`) dibujaba `exterior-hd.webp` a 1672 × 940 y recortaba tejados/cercas de esa misma imagen para aparentar profundidad. Había dos masas de agua y un puente con polígonos de colisión, A* a 8 unidades y movimiento de actores validado contra esos polígonos. `WorldScene` coordina trabajadores/tareas; `InteriorScene` conserva cuatro habitaciones. React mantiene selección, responsables, recursos, música y persistencia. `repository.ts` usa Supabase con respaldo en localStorage; `domain.ts` calcula progreso offline. Estas dos últimas capas, migraciones y claves de almacenamiento no se modifican.

## Mundo nuevo

- Tamaño: **3072 × 2048 unidades**; resolución artística 2 unidades por píxel (1536 × 1024 píxeles de trabajo).
- Chunks: 256 × 256 unidades, con texturas raster de 128 × 128 píxeles y filtro nearest. No hay una imagen completa del escenario en el renderizador.
- Capas independientes: terreno base; superficies de parcelas/caminos/plaza; topografía; agua; ondas; cascadas; puentes/rampas; entidades existentes.
- Raster determinista: variación orgánica de césped, tonos de tierra/barro, surcos de suelo preparado, adoquines, bloques de roca, playas y márgenes de agua. No hay SVG, CSS ni emojis dentro del mundo.
- Solamente tres trabajadores existentes siguen visibles para mantener tareas y validar escala/rutas. No se crean animales, edificios, vegetación final, cercas ni decoración. Se conservan sus definiciones y assets para las siguientes fases.
- El antiguo renderizador queda en `LegacyExteriorScene.ts` y `legacyWorld.ts` como referencia de migración, sin importarse ni cargarse en el exterior actual. No es una segunda aplicación ni un modo de producción.
- Los interiores existentes siguen accesibles desde sus parcelas. La sorpresa existente se conserva bajo activación explícita, con destinos y efectos migrados a la nueva plaza; no se colocan sus decoraciones ni invitados animales. React conserva tareas, música, progreso y recursos.

## Configuración

`src/game/world/mapConfig.ts`: escala, dimensiones, costa, islas, cursos de agua, acantilados, puentes, rampas, cascadas y caminos. Coordenadas de autor en la proporción de la referencia; `point()` las convierte al mundo. Las curvas se muestrean una vez y comparten vértices entre dibujo y lógica.

`zones.ts`: parcelas identificadas por ID, centro, acceso, superficie y altura lógica. Incluye santuario, bosque norte, recolección, establo mixto (caballos/cerdos), vacas, gallinero, plaza, cultivos, invernadero, casa, ovejas/cabras, conejera, patos, playa y pesca. También define `lake`, `fishingWater` y `FISHING_WATER`. Los nombres no se dibujan sobre el mapa.

`SCALE`: HUMAN_SCALE = 1, marco humano 46 unidades, puerta futura 64 unidades (~1.39×). Incluye proporciones futuras de animales; no los instancia. `WorldScene` utiliza esa altura para los trabajadores. Las coordenadas de tareas y hogares se migraron sin cambiar IDs ni persistencia.

## Colisiones y navegación

`collisions.ts` define `WATER_COLLISION`, `CLIFF_COLLISION` y los accesos permitidos. El agua bloquea a entidades terrestres; los puentes permiten únicamente el agua que cubren. Las rampas permiten únicamente las paredes naturales configuradas como terreno. Un obstáculo independiente (edificio, tronco o cerca futuros) sigue bloqueando incluso encima de un puente o rampa.

Las islas y la playa excluyen su superficie del agua, tanto en máscaras visuales como en lógica. Los límites del mundo bloquean. La huella del actor se comprueba en nueve puntos (centro, ejes y diagonales). A* usa una cuadrícula de 16 unidades y heap de prioridades. Cada arista y el suavizado de ruta se validan mediante intersecciones exactas con los límites de polígonos, no solamente mediante muestreo. No se reubican destinos bloqueados silenciosamente. `navigationFor(['LAND','WATER'])` prepara la capacidad futura de nadar; todavía no crea patos.

## Agua, cámara y rendimiento

Las ondas se redibujan a intervalos de 140 ms y solamente dentro de la vista, recortadas por la máscara real de agua y sin pasar por los puentes. Cuatro cascadas utilizan ocho fotogramas raster independientes a 9 fps; se pausan fuera de cámara. Agua y suelo tienen chunks diferentes. El suelo estático no se actualiza ni se crean sprites por cada brizna de césped.

La cámara conserva drag, inercia, rueda, controles de zoom y pinch de dos dedos. Sus límites y mínimo de zoom dependen de las dimensiones reales del mundo, incluyendo resize; se elimina la dependencia exterior de 1672 × 941. Los chunks fuera de cámara se ocultan. Texturas y máscaras se generan una vez al crear la escena; no hay descargas de un fondo 8K. `data-world` del canvas expone FPS, cámara, agua y posiciones transitables para comprobación.

## Verificación

`npm test` verifica rutas desde la plaza a todas las parcelas, tres trabajadores × seis tareas ida/vuelta, patrullas, puentes/rampas, destinos interiores preservados, agua/acantilados/límites, obstáculos futuros sobre puentes, capacidad acuática y progreso offline. Mantiene una comprobación del motor de partículas conservado.

Comandos de entrega: `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`. La revisión de navegador comprueba animación, tareas, persistencia local, drag, zoom, resize y tamaños móvil/escritorio. Las pruebas táctiles sintéticas no equivalen a una prueba en un teléfono físico. No se modifica el servicio de Render, repositorio ni esquema Supabase.

**La fase 2 no se inicia.** La siguiente revisión debe decidir distribución y escala antes de construir edificios, árboles, animales o decoración.
