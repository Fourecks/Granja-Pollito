# Plaza y animales — implementación local

La plaza conserva su pavimento y accesos. Añade una fuente de piedra central con seis chorros animados, espuma, gotas y ondas; cuatro bancas del atlas existente. El vaso y las bancas tienen colisión y los granjeros los rodean. Se recortó únicamente el extremo del camino plaza-coop bajo el nuevo vaso; no se tocaron ríos, lagos, cascadas ni barrancos. Las posiciones de celebración que coincidían con la fuente se desplazaron a su perímetro. Las semillas originales de vegetación se conservan para evitar redistribuir el mundo.

29 animales junto a sus refugios: 3 vacas, 2 caballos, 3 cerdos, 12 pollitos, 4 cabras y 5 conejos. Los cuatro primeros grupos se mantienen en sus corrales; cabras y conejos permanecen cerca de sus casas. Ocho poses por pelaje, tres variantes por especie, caminar, descansar y comer con movimiento de cabeza, cola, patas y pequeñas partículas de pasto/semillas. Los animales muestrean y recorren solo segmentos transitables dentro de sus límites; no alteran tareas ni datos persistidos.

Fuente: `public/assets/plaza-fountain-v1.png`, creada con ImageGen integrado, transparencia real, reducida a resolución de juego. Prompt: fuente de piedra circular de pueblo, vista cenital oblicua del juego de granja, agua azul, cuenco superior y pedestal, chorros finos y espuma discreta, pixel art sombreado, aislada y sin escenario ni texto. Animación añadida en `PlazaLayer.ts`. Los animales se dibujan en canvas a resolución nativa para mantener anclajes y cuadros coherentes.

Verificación: navegación completa, hogares y puertas, colisiones de mobiliario, seis especies y dos minutos simulados sin salir de hábitats ni entrar al agua, revisión visual local, TypeScript y compilación de producción. No se ha publicado ni desplegado esta revisión.

## Cangrejos de playa

Colonia distribuida por bandas de la playa inferior, exclusivamente en arena seca transitable, fuera de caminos y agua. Tres colores de caparazón, patas y pinzas animadas, pausas y recorridos laterales locales. Cada cangrejo vuelve a su propia madriguera, se entierra progresivamente con pequeñas partículas de arena, permanece oculto y vuelve a emerger. La prueba `check-crabs.cjs` verifica el ciclo completo y límites de arena durante 150 segundos simulados.
