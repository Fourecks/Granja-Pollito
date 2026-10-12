# Granja Pollito — Capa 2: vegetación, naturaleza y vida ambiental

La geometría aprobada de la Capa 1 (`mapConfig.ts`, `zones.ts`, `terrain.ts`, `water.ts`) permanece intacta. No se añaden edificios, animales, cultivos funcionales, pesca, diálogos ni tareas de Capa 3. Los trabajadores, interiores, música y sorpresa existentes permanecen disponibles.

## Arte y atlas

`public/assets/vegetation-atlas.png` y `vegetation-atlas.json`: un atlas RGBA de 1254 × 1254, 64 frames nombrados, dos solicitudes de precarga. Creado con la herramienta integrada ImageGen siguiendo directamente el catálogo proporcionado por el usuario; no se utiliza el mapa de referencia como fondo. El atlas incluye variantes verdes/frutales, pinos, árboles florales y otoñales, árboles grandes/especiales, bambú, palmera, arbustos, seis colores de flores, hierbas/maleza, plantas acuáticas, rocas, troncos, tocones, hongos y elementos ambientales. TREE_GREEN_03 utiliza la copa ancha de TREE_LARGE a escala regular. Los grupos florales se distribuyen en tamaños pequeño, mediano y cluster (12, 20 y 30 unidades, con variación leve).

El atlas conserva transparencia, luces desde arriba a la izquierda y sombras dibujadas en el propio asset. El índice delimita los sprites a partir del alfa visible dentro de celdas de catálogo; no recorta ni reutiliza el mapa central. `scripts/index-vegetation.cjs` regenera los rectángulos usando Sharp (dependencia de edición opcional; no requerida para desarrollo/build). Si Sharp está en otra instalación, se puede proporcionar `SHARP_MODULE` con su ruta. PNG y JSON finales están versionados: Render no necesita generar imágenes ni instalar Sharp.

## Distribución

`vegetationPlan.ts` genera un plan determinista con centros de arboledas diseñados, desplazamientos irregulares y claros de vegetación baja. Con la semilla actual: 4.193 instancias y 361 bases sólidas. Las restricciones comprueban suelo, agua, acantilados, caminos, pasos, parcelas y destinos existentes. Las parcelas reservadas también rechazan las copas que invadirían sus superficies. Diez landmarks buscan el emplazamiento válido más cercano a sus ubicaciones diseñadas.

- Bosque Norte: pinos, árboles grandes/verdes, maleza, rocas, madera caída y claros en senderos.
- Santuario: arboledas densas de bambú y pequeñas flores blancas, rocas y hierba húmeda; sin pandas.
- Agua: juncos, espadañas y hierba en las orillas; juncos parcialmente dentro de los ríos y nenúfares/lotos en sectores próximos a la orilla del lago. Puentes y accesos permanecen libres.
- Costa: palmeras y vegetación baja costera; no se extiende el bioma tropical al resto del mapa.
- Granja: parcelas/plaza despejadas, pequeños clusters en su perímetro y jardines próximos a caminos.
- Acantilados: formaciones, musgo y arbustos junto a los bordes existentes.

## Profundidad y colisión

Sprites grandes con origen al pie `.5, .96` y `depth = baseY`. Los actores ya ordenan su profundidad según sus pies: detrás del tronco quedan detrás de la copa; delante del árbol aparecen por delante. Un único sprite completo conserva la coherencia del dibujo; la huella del tronco está separada de la copa en los datos. No se asigna un collider del tamaño de la textura.

Las huellas se integran en el mismo NavigationGrid usado por trabajadores y tareas. Árboles, bambú denso, rocas grandes y madera gruesa bloquean sus bases. Flores, pasto, arbustos decorativos y partículas no añaden obstáculos. NavigationGrid indexa obstáculos por sectores de 128 unidades y descarta polígonos lejanos al comprobar segmentos; preserva las reglas de agua, acantilados y pasos de Capa 1.

## Animación y rendimiento

`vegetation.ts` hornea decoraciones pequeñas en chunks transparentes de 256 unidades de mundo; flores/hojas pequeñas no son objetos individuales. Árboles y vegetación alta usan sprites del atlas con culling cada 160 ms. Hasta 36 clusters de pasto/juncos oscilan con fases distintas.

18 mariposas como máximo, con aleteo y recorridos locales suaves cerca de grupos florales; sólo se actualizan las visibles. Hojas/pétalos reutilizan 28 objetos, aparecen aproximadamente cada 1,1 segundos junto a árboles visibles y se reciclan fuera de cámara. Diez luciérnagas están preparadas con `setTwilight(true)`; por defecto no aparecen durante el día. No se ha añadido un sistema día/noche. Agua y cascadas conservan su sistema anterior.

El canvas expone `data-map-version="phase-2"` y diagnósticos `data-world` con cantidades, objetos visibles, FPS y frames de agua para verificar la versión publicada.

## Verificación

`npm run typecheck`, `npm run build`, `npm test` y `git diff --check`. La suite ejecuta rutas reales con las nuevas bases sólidas: trabajadores/tareas/regresos, parcelas, senderos, puentes/rampas, agua/acantilados, interiores, progreso offline, sorpresa y controles de cámara/pinch/resize. También comprueba la determinación del plan, landmarks, densidad, parcelas libres, juncos en agua, colisión del tronco y flores transitables.

Revisión visual en navegador a 1440 × 1000 y 390 × 844, comparada con la referencia; refinamiento adicional de escala de tocones, emplazamiento de landmarks, agrupación de flores y vegetación parcialmente acuática. Capturas: `capa-2-desktop.jpg` y `capa-2-mobile.jpg`. Se observaron aproximadamente 51–59 FPS en este equipo, con mariposas/pétalos y culling; esto no constituye una medición en un teléfono físico. Pinch se verifica en la suite de cámara, no con una pantalla táctil física.

No se modifican `repository.ts`, el esquema ni la configuración de Supabase. Se comprueba la lógica existente de tareas/progreso offline; no se ejecutan escrituras nuevas de prueba en la base de producción.

## Prompts de generación

Herramienta integrada `image_gen`, referencia original del usuario, transparencia activada. Prompt inicial: atlas de ocho columnas por ocho filas, sprites aislados, sin textos/cuadrícula ni fondo, perspectiva RPG de tres cuartos, pixel art detallado fiel al catálogo, verdes cálidos/profundos, madera cálida, piedra gris/marrón, flores pastel, luz superior izquierda. Filas: árboles verdes/frutales/pinos/rosa; árboles blanco/morado/otoñal/grande/bambú/palmera; arbustos/pastos; hierbas y flores; flores y plantas acuáticas; rocas y troncos; props y landmarks; mariposas/hojas/pétalos/luciérnaga.

Refinamiento: mantener los 64 diseños y posiciones, limpiar contaminación de bordes transparentes y limitar las sombras del suelo a tonos naturales verde/marrón, conservando las frutas y flores de colores. Los rectángulos finales se indexan para Phaser; la dirección artística se conserva en los assets raster, sin sustituciones SVG, emojis ni primitivas geométricas.

## Refinamiento final: microcésped y viento

`public/assets/micro-grass-atlas.png` / `.json`: atlas independiente creado con ImageGen usando el atlas de vegetación anterior como referencia de paleta, luz y pixel art. Prompt: cuatro filas (una brizna, dos/tres briznas, tuft oscuro, tuft claro), cuatro columnas (idle, sway 1, sway 2, sway 3), transparencia real, raíces estables y movimiento mínimo, sin suelo, flores ni ruido de fondo. Frames `grass_idle`, `grass_sway_1`, `grass_sway_2`, `grass_sway_3`, con sufijos `_0` a `_3` para las cuatro familias.

`microGrass.ts` añade 1.034 tufts con semilla independiente: 877 estáticos y 157 animados (15 %). No modifica el plan ni la semilla de la vegetación anterior. Verifica toda la huella del tuft contra las máscaras compartidas: únicamente superficies verdes; excluye tierra, caminos, plaza, agua, arena, barro, cultivos, roca/acantilados y pasos. Conserva claros junto a centros/entradas de parcelas y extremos de cruces. Usa parches de densidad, tamaños y variantes diferentes; omite los grupos ya ocupados por vegetación.

Los tufts estáticos se hornean en 75 chunks; los animados se hornean también en lotes, con un frame totalmente quieto y cuatro frames combinados con fases locales. No hay GameObjects por brizna. Cada chunk animado cambia de frame aproximadamente 4–7 veces por segundo, sólo estando visible; fuera de cámara no se evalúa el viento ni la animación. Las texturas se precalculan, evitando repintar el terreno cada frame.

`ExteriorScene.wind` comparte un `WindSystem` con toda la vegetación. `wind.direction` usa radianes; `wind.strength` usa 0–1 y empieza en .18. Fuerza 0 deja el césped quieto. La respuesta admite offset, amplitud y velocidad por grupo. Césped/pasto/juncos reaccionan suavemente; flores y bambú seleccionados empiezan a reaccionar a fuerza media; copas seleccionadas están preparadas para fuerza fuerte. Los umbrales de arbustos, hojas y pétalos quedan definidos para ampliar sus consumidores sin añadir clima. Los arbustos horneados permanecen estáticos; no se anima todo el mapa. Hojas/pétalos usan la dirección y fuerza para su deriva.

Se conserva íntegramente `vegetationPlan.ts`, geometría, agua, cascadas, caminos, parcelas, colisiones y navegación. No se añaden edificios ni animales. Verificación: typecheck, build y diff-check; revisión visual móvil/escritorio y consola sin errores. El FPS observado depende del equipo y de la cámara, no constituye una prueba en teléfono físico.
