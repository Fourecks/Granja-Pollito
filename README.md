# Granja Pollito 🐥

Un pequeño mundo 2D de pixel art para La Jefa. El exterior reproduce la composición del concepto aportado para el proyecto: corral, casa, establo, plaza, caminos, huerta, invernadero y río con puente. React mantiene tareas, recursos, responsables y persistencia; Phaser dibuja y anima los habitantes, cultivos y agua.

## Ejecutar

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

`npm test` comprueba rutas de todos los trabajadores a las seis tareas y su regreso, posiciones y recorridos de los habitantes, destinos interiores, puente, obstáculos, corrales, contadores y progreso offline. Revisa todos los puntos de recorrido para impedir agua sin puente. No sustituye la revisión visual en navegador.

## Escenas y arquitectura

- `src/Scene.tsx`: puente React/Phaser, runtime compartido y pantalla de carga. Se importa con React.lazy.
- `src/game/ExteriorScene.ts`: exterior, entradas, capas de oclusión, agua animada y cultivos.
- `src/game/InteriorScene.ts`: escenas independientes para casa, gallinero, establo e invernadero. El módulo y el fondo de cada interior se cargan al entrar por primera vez.
- `src/game/WorldScene.ts`: habitantes, animación, cola de trabajos y ejecución de acciones.
- `src/game/navigation.ts`: polígonos y A* sobre una cuadrícula invisible de 8 píxeles. Los movimientos y segmentos se validan también contra los polígonos; el agua solo admite el puente definido.
- `src/game/camera.ts`: arrastre, inercia, rueda, controles y pinch. El exterior permanece vivo y conserva su cámara al entrar/salir.
- `src/game/assets.ts`: precarga inicial y recorte de frames de los atlases originales.

El fondo integra edificios, vegetación y props en una composición única. Las capas de cercas y árboles se recortan con máscaras desde el propio fondo y se ordenan por su base; habitantes, sombras, cultivos y efectos de tareas son objetos Phaser separados. Los obstáculos evitan que las rutas atraviesen edificios, cercas, árboles, rocas, agua o los cultivos. Las zonas transitables son explícitas y conservadoras.

## Datos y personalización

`src/data/world.ts` contiene dimensiones, polígonos walkable/non-walkable, agua, puente, edificios, puertas, hotspots y máscaras de profundidad. Las coordenadas se expresan en el mapa de 1672 × 940. Cambia posiciones y polígonos junto con el arte cuando recompongas el mapa.

`src/data/farm.ts` contiene pollitos con nombre, Margarita, diálogos, posiciones y patrullas. Agrega un registro a `characters`; los pollitos del corral usan su cuadrícula restringida y Miel utiliza la ruta del puente. Hay cuatro pollitos ambientales adicionales y otra vaca en `ExteriorScene`. Los animales no ejecutan físicamente los trabajos humanos, pero se conservan sus asignaciones anteriores como responsables de la granja.

`src/data/routes.ts` define los tres trabajadores (Alma, Bruno y Vera), su posición, patrulla, especialidad y destinos de cada tarea, tanto exteriores como interiores. Se pueden asignar a cualquiera de las tareas. Si un trabajador está ocupado, la siguiente tarea espera; los otros trabajadores y la interfaz continúan activos. Una misma tarea no puede iniciarse dos veces. La secuencia es caminar → actuar → completar y actualizar recursos → regresar. `performTask` se llama al finalizar la acción, no mediante un temporizador global independiente del recorrido. El ordeño coloca a Vera junto a Margarita, usa el frame arrodillado y muestra un cubo con leche.

`src/data/interiors.ts` define fondos, títulos, suelo y muebles sólidos de cada habitación. La puerta del exterior y el botón Entrar abren una escena de juego con fade. La puerta interior y Salir regresan al exterior sin recargar. Los trabajos ya iniciados continúan aunque cambies de habitación.

Para nuevos mensajes, carteles o secretos, añade un objeto en `worldObjects` y su texto en `objects` de `farm.ts`. Para nuevos edificios, añade arte, puerta y hotspots, sus obstáculos y el interior correspondiente. Para ampliar el mapa, actualiza `MAP`, su imagen, límites, zonas y rutas. Ejecuta `npm test` al modificar obstáculos o destinos.

## Agua y cultivos

El río utiliza ocho fases de ondas/reflejos pixelados dibujados en Phaser, limitados a los polígonos de agua y excluyendo el puente. La cascada incluye destellos verticales. No hay un efecto CSS sobre el agua.

El atlas de cultivos tiene cuatro etapas (semilla, brote, planta joven, madura) para zanahorias, coles y tomates. Las parcelas mezclan cultivos maduros y jóvenes; los huecos sembrados avanzan tras el riego a lo largo de 40 minutos. La humedad y pequeños reflejos muestran `cropsWatered`. La fase depende del tiempo del último riego persistido; no agrega economía ni cosechas nuevas.

## Persistencia y Supabase

`src/domain.ts` conserva tareas, recursos, responsables y cálculo de progreso offline; añade los nombres de los trabajadores al reporte. `src/repository.ts` mantiene la integración existente con Supabase y su respaldo local. La migración y el esquema no cambian. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` desde `.env.local` o el servicio de Render. Sin ambas variables se usa localStorage. No coloques una clave service_role en el navegador.

El trabajo visual en curso es transitorio: al recargar, la tarea conserva su estado persistido y el progreso offline sigue sus reglas anteriores.

## Assets y publicación

Los recursos de esta pasada son originales, generados para el proyecto a partir del concepto aportado. Fuentes y procedencia en `ASSET_LICENSES.md`. Los fondos WebP reducen el peso y los interiores se cargan bajo demanda; los personajes y cultivos usan atlases PNG transparentes. Phaser se carga como chunk separado y sigue superando 500 KB por sí mismo; la aplicación principal y las escenas quedan separadas.

Repositorio existente: Fourecks/Granja-Pollito. Render mantiene `npm ci && npm run build`, publica `dist` y sirve la SPA. URL: https://granja-pollito.onrender.com/.
