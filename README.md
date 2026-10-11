# Granja Pollito 🐥

Una pequeña granja isométrica para La Jefa. Explora el diorama, habla con sus habitantes, cuida los animales y deja algunas tareas en buenas alas.

## Ejecutar localmente

```sh
npm ci
npm run dev
```

Para comprobar tipos y generar la versión de producción:

```sh
npm run typecheck
npm run build
npm run preview
```

## Configuración

Copia `.env.example` como `.env.local`. Si dejas las variables vacías, la granja guarda el progreso en `localStorage`. Para sincronizar en Supabase configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave publishable/anon, nunca una clave `service_role`). Activa Anonymous Sign-Ins en Authentication y aplica la migración `supabase/migrations/20261011000000_create_farm_state.sql`.

La app crea una sesión anónima al entrar y solo puede leer o actualizar el registro asociado al UID de esa sesión. No hay pantalla de registro. La sesión persiste en el navegador; sin vincularla luego a una cuenta, cambiar de navegador/dispositivo no recupera esa identidad. El progreso también se conserva localmente como caché y fallback si Supabase no responde.

## Estructura

- `src/Scene.tsx`: mapa SVG, edificios, vegetación, personajes y cámara.
- `src/data/farm.ts`: datos estáticos del mapa, habitantes, diálogos y objetos interactivos.
- `src/domain.ts`: tareas, estado y simulación determinista de actividad offline.
- `src/repository.ts`: interfaz de almacenamiento, modo local y adaptador de Supabase.
- `src/App.tsx` y `src/styles.css`: interfaz, interacciones, paneles y diseño responsive.
- `supabase/migrations/`: esquema y políticas RLS.

Para ampliar la granja, agrega edificios y objetos interactivos en `src/data/farm.ts` y dibuja sus elementos en `src/Scene.tsx`. Cada objeto usa un ID como `data-pick` para asociarlo con su definición. Agrega pollitos en `characters`, sus frases en `dialogues`, y nuevos cuidados en `TaskId`, `taskCopy` y `DEFAULT_STATE` de `src/domain.ts`; luego agrega su fila de interfaz o ubicación.

## Render

`render.yaml` configura un servicio Static Site: `npm ci && npm run build`, publica `dist` y envía las rutas SPA a `index.html`. En Render, define las dos variables Vite desde el Dashboard si vas a conectar Supabase. Vite las incluye en el bundle público, por eso solo deben contener la URL y la clave publishable. El diseño no necesita assets externos: el diorama es SVG propio.
