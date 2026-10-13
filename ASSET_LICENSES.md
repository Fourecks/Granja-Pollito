# Assets y procedencia

## Arte original de esta segunda pasada

El concepto `Granja Pollito_ Un Día Bonito (1).png` fue aportado por el usuario como concepto creado para este proyecto y como referencia autorizada para su implementación. Los siguientes recursos se generaron específicamente con ImageGen a partir de esa referencia, sin extraer recursos de videojuegos o packs comerciales:

- `exterior-hd.webp`: composición exterior, edificios, plaza, corrales, vegetación, caminos, río y puente; las parcelas se dejaron con suelo para recibir cultivos dinámicos.
- `actors-v2.webp`: atlas 4 × 4 de pollito amarillo juvenil y tres trabajadores, con poses de reposo, pasos y trabajo.
- `cows-v2.webp`: atlas de vaca en reposo y comiendo.
- `crop-stages-v2.webp`: atlas 4 × 3 de semillas, brotes, plantas jóvenes y maduras de zanahoria, col y tomate.
- `interior-home-v2.webp`, `interior-coop-v2.webp`, `interior-barn-v2.webp`, `interior-shed-v2.webp`: interiores originales de casa, gallinero, establo e invernadero.

Los fondos se convirtieron a WebP (calidad 94); los atlases se recortan en frames al cargar en Phaser y conservan su transparencia. Las sombras, ondas, reflejos, humedad y efectos de tareas son gráficos originales de Phaser. No se atribuye CC0 a estas imágenes generadas: no son un pack externo con esa licencia.

## Phaser

Phaser 4.2.1, Phaser Studio Inc. y contribuidores. Licencia MIT del paquete npm. [Fuente oficial](https://phaser.io/download/release/v4.2.1).

## Recursos retirados de la pasada anterior

Los sprites de gallinas adultas y el tileset anterior de cultivos se sustituyeron en esta pasada. Sus créditos históricos eran Proyd, [Chicken and pen](https://opengameart.org/content/chicken-and-pen), CC0, y pixel32, [Pixel farm and shack](https://opengameart.org/content/pixel-farm-and-shack), CC0. Ya no son utilizados ni incluidos en los assets activos del proyecto.


## Actualización del mundo y celebración

`Granja pixel art de celebración y alegría.png` es la referencia aportada por el usuario para el aspecto de las mascotas y la fiesta. Se generaron recursos originales específicos con ImageGen:

- `exterior-hd.webp`: refinamiento de nitidez del mismo mapa, conservando composición, sin nuevos NPC ni decoración horneada; fuente 1672 × 941, conversión WebP sin pérdida.
- `dogs.webp`: atlas 4 × 2 transparente de Chihuahua café con mancha en un ojo y Maltés blanca, reposo, dos pasos y sentado.
- `celebration-props.webp` (retirado; sustituido por plaza-celebration-v2): atlas 4 × 2 de objetos separados: letrero, mesa/pastel, fondo para fotos, flores, globos, farol, caja LDC y regalos. Se recortan como sprites independientes.

Los tres atlases anteriores de habitantes, vacas y cultivos también se convirtieron a WebP **sin pérdida**, preservando píxeles y transparencia. Las fuentes PNG generadas permanecen fuera del repositorio. Los banderines, cascos/accesorios de invitados, lanzador, partículas, texto luminoso y audio sintetizado se construyen mediante código original del proyecto. No se utilizan GIF, vídeos ni imágenes estáticas de fuegos artificiales.

## Plaza festiva v2 (octubre 2026)

`plaza-celebration-v2.webp` y `worker-chicks.webp` son imágenes originales creadas con la herramienta
integrada imagegen para esta corrección, conservando transparencia y convertidas sin pérdida a WebP.
La referencia visual fue aportada por el usuario. Las publicaciones son libros genéricos, sin portadas copiadas.
Los mensajes se dibujan como texto de Phaser sobre los objetos físicos y permanecen editables.
Los prompts de producción y el inventario están en `docs/plaza-assets.md`.


## Capa 2 — vegetación propia

`public/assets/vegetation-atlas.png` y `.json`: generados para Granja Pollito con la herramienta integrada ImageGen a partir del catálogo original proporcionado por el usuario. Incluyen vegetación, rocas/props y sprites ambientales, sin paquetes de arte de terceros. El mapa de referencia no se usa como fondo ni se distribuye en la aplicación. Dirección de arte y prompts: `docs/world-phase-2.md`.

`public/assets/micro-grass-atlas.png` y `.json`: microcésped propio generado con ImageGen usando el atlas de Capa 2 como referencia. Incluye cuatro familias y cuatro poses suaves, con transparencia. Prompt y arquitectura en `docs/world-phase-2.md`.


`public/assets/tulip-garden-atlas.png` y `.json`: atlas propio generado con ImageGen desde el catálogo original del jardín proporcionado por el usuario y el atlas de vegetación de Granja Pollito. Tulipanes y props coherentes, sin paquetes de terceros. Prompt y organización en `docs/world-phase-25.md`.

## Puentes y agua — referencia propia (octubre 2026)

Los seis atlases `bridge-{rustic,farm,large}-v1`, `waterfall-{main,small}-v1` y `water-depth-v1` fueron creados para este proyecto con ImageGen integrada usando la guía de puentes/cascadas aportada por el usuario como referencia principal. No se emplean paquetes de terceros. Inventario, prompts finales y preparación de sprites: `docs/river-assets-prompts.md`. La guía no se distribuye como asset de juego.
