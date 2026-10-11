# Assets y licencias

Los recursos externos se eligieron por su perspectiva de granja pixel art y por sus licencias CC0 indicadas en sus páginas de OpenGameArt. La composición, caminos, edificios, follaje, props y texturas de pixel art complementarias son originales del proyecto y se dibujan en canvas de baja resolución dentro de Phaser.

## Pixel farm and shack — tileset principal de cultivos

- **Autor:** pixel32
- **Fuente:** [OpenGameArt — Pixel farm and shack](https://opengameart.org/content/pixel-farm-and-shack)
- **Licencia:** CC0, según la ficha del recurso en OpenGameArt. La atribución es opcional; se conserva aquí el crédito de procedencia.
- **Archivo incorporado:** `public/assets/crops_tileset.png` (`crops_tileset.png` en la descarga original).
- **Uso:** texturas de suelo primaveral, estival y otoñal, y un tile de parcela cultivada.
- **Modificaciones:** se elimina el fondo blanco al cargar el atlas, se recortan las celdas utilizadas y se escala con filtrado pixelado. No se redistribuye como pack independiente.

## Chicken and pen — pollitos y animaciones

- **Autor:** Proyd
- **Fuente:** [OpenGameArt — chicken and pen](https://opengameart.org/content/chicken-and-pen)
- **Licencia:** CC0, según la ficha del recurso en OpenGameArt. La atribución es opcional; se conserva aquí el crédito de procedencia.
- **Archivo incorporado:** `public/assets/chickens.png` (sprite `chicken_9.png` incluido en la descarga original).
- **Uso:** sprites 16×16 de pollos y pollitos, huevos y elementos del corral; la escena utiliza frames de la spritesheet para los personajes y sus secuencias de caminar, picotear y dormir.
- **Modificaciones:** se escala con `pixelArt` y `roundPixels` de Phaser; los frames originales no se editan.

## Ilustraciones originales de Granja Pollito

- **Autoría:** arte generado específicamente para este proyecto con ImageGen de OpenAI; no procede de un videojuego ni de un pack de terceros.
- **Archivos:** `public/assets/farm-world-background.png`, `public/assets/coop-building.png`, `public/assets/home-building.png`, `public/assets/barn-building.png` y `public/assets/margarita.png`.
- **Uso:** terreno continuo y sprites principales de gallinero, casa, establo y Margarita (la vaca).
- **Modificaciones:** composición e integración como fondo y sprites transparentes de Phaser; el mapa conserva edificios, animales, parcelas y zonas interactivas separados del fondo.

## Phaser

- **Autor:** Phaser Studio Inc. y contribuidores.
- **Fuente:** [Phaser](https://phaser.io/)
- **Versión:** 4.2.1.
- **Licencia:** MIT, declarada por el paquete npm.
- **Uso:** renderer 2D, cámara, entrada de puntero, texturas, animación y escalado pixel art.
