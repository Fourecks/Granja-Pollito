# Granja Pollito 🐥

Una granja pixel art tranquila para La Jefa. Explora el mundo con arrastre, observa a los pollitos recorrer sus zonas e interactúa con edificios y rincones sin salir del mapa.

## Ejecutar y verificar

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run build
npm run preview
```

El renderer es Phaser 4.2.1, configurado para pixel art con escalado nítido. React mantiene los paneles, tareas y el estado; Phaser dibuja y anima el mundo en un canvas. La cámara se arrastra con mouse o dedo y se acerca con la rueda, gesto de zoom con dos dedos o controles.

## Personalizar el mapa

- `src/data/world.ts` define edificios, objetos interactivos y decoraciones estáticas. Cambia sus `x` y `y` para moverlos, o añade una fila a `mapDecorations` para incorporar un banco, flor, cerca, caja, tronco, cartel, pozo, puente o grupo de rocas. El origen es la esquina superior izquierda del mapa (`2600 × 1900`).
- `src/data/farm.ts` define habitantes, roles, estado inicial, posiciones, rutas, sprites, tareas de responsabilidad y diálogos. Para agregar un pollito, añade un registro a `characters` con un `id`, `name`, `role`, `position`, `path`, `zone`, `sprite`, `spriteFrame`, `animations` y `dialogues`.
- `src/Scene.tsx` precarga sprites, crea el canvas Phaser y conecta las entradas táctiles/de mouse. Para un nuevo tipo de decoración, añade el tipo a `MapDecoration`, su textura a `makePixelAssets` y la correspondencia a `decorationTexture`.
- Para añadir un edificio, coloca su PNG en `public/assets/`, precárgalo en `preload`, agrega una entrada en `worldBuildings` con `id`, `sprite`, `x`, `y` y `scale`, y declara su panel y zona táctil en `objects` y `worldObjects`.
- Para añadir otro cartel, incorpora su tipo a `MapDecoration` y su textura a `decorationTexture`; después agrega la fila de posición en `mapDecorations` y el mensaje/zona interactiva en `objects` y `worldObjects`.
- Para un mensaje secreto, agrega una decoración interactiva con su propia posición e ID en `worldObjects`, y añade un registro `decoration` con título y mensaje en `objects`. El panel React presenta el texto al tocarlo.
- Para ampliar el mundo, aumenta `MAP.width` y `MAP.height` en `src/Scene.tsx`, ajusta los límites de cámara y extiende `mapDecorations` y los puntos de ruta en `src/data/farm.ts`.

Los elementos visuales estáticos viven en el código; Supabase guarda únicamente el estado dinámico. Agregar una nueva tarea funcional requiere además extender `TaskId`, `taskCopy`, `DEFAULT_STATE` y `performTask` en `src/domain.ts`.

## Estado, offline y Supabase

La lógica de tareas, responsables, recursos y progreso offline está en `src/domain.ts`. `lastSeen` determina el tiempo de ausencia y el informe al volver. `src/repository.ts` conserva el repositorio Supabase existente con respaldo local en `localStorage`.

Copia `.env.example` a `.env.local` para configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la clave publishable/anon. Habilita Anonymous Sign-Ins y aplica la migración `supabase/migrations/20261011000000_create_farm_state.sql`. Nunca incluyas una clave `service_role` en el cliente. Sin variables, el progreso solo queda guardado en este navegador.

## Estructura

- `src/Scene.tsx`: renderer Phaser, texturas pixel, cámara, entidades y animaciones.
- `src/data/world.ts`: posiciones del mapa, zonas interactivas y decoraciones.
- `src/data/farm.ts`: habitantes, roles, asignaciones, rutas, diálogos y textos de interacción.
- `src/domain.ts`: tareas, recursos y progreso offline.
- `src/repository.ts`: almacenamiento local y sincronización Supabase.
- `src/App.tsx` y `src/styles.css`: HUD, paneles y diseño responsive.
- `public/assets/`: terreno original, edificios, Margarita, spritesheet de pollitos y tileset de cultivos; fuentes y licencias en `ASSET_LICENSES.md`.

## Render

`render.yaml` mantiene el sitio estático existente: `npm ci && npm run build`, publicación de `dist` y reescritura SPA hacia `index.html`. Las variables Supabase se configuran desde el servicio existente de Render si se quiere habilitar sincronización en la nube.
