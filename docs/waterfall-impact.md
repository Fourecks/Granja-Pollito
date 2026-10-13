# Acentos de espuma e impacto — capa 3.2

La referencia aprobada es la capa 3.1, commit 032ad1b7fcffe4eef2fa6362665ffd9eb27ff26c. El cuerpo de dropFrame y createDepthLayers permanece idéntico byte por byte: sin cambio de color base, tamaño, escala, ubicación, silueta o textura de las cinco cascadas, ríos y lago. Los catorce grupos de geometría histórica siguen coincidiendo con su referencia.

WaterfallFoamLayer agrega únicamente píxeles de espuma, ondas, gotas y turbulencia inmediata. Usa un Graphics independiente, por delante del agua de caída (-7.7 frente a -7.8). Sustituye los antiguos anillos/gotas de la capa de reflejos que quedaban debajo de la imagen de la cascada. Los reflejos generales del río no cambian.

El labio contiene una línea rota de solo unos pocos píxeles, con alfa bajo. El impacto ocupa una pequeña franja alrededor del pie exacto de cada caída y varía ligeramente; dos ondas cortas se expanden y desaparecen, o tres en la salida del lago. Tres gotas intermitentes y tres acentos de turbulencia se desvanecen enseguida. La escala se deriva de la anchura de cada caída; el impacto del lago es 20% mayor. Nada recorre el cuerpo completo de la caída.

La espuma tiene un ciclo propio de 12 fases a 8 FPS y un desfase entre cascadas. El cuerpo azul conserva sus seis frames a 7 FPS. Se animan solo los acentos, sin desplazar el sprite aprobado. Paleta contenida: azul claro grisáceo y blanco suave, con alfa limitado. Todo se recorta al agua y se excluyen los puentes; espuma de base, ondas y turbulencia solo ocupan agua inferior, evitando paredes rocosas. Las gotas pueden proyectarse unos pocos píxeles por encima del impacto.

Revisión visual de las cinco cascadas, escritorio/móvil y límites reales de zoom. Siluetas originales de los seis frames idénticas, paleta base sin cambios, cero excepciones, composición sumergida preservada; prueba Canvas móvil, cobertura completa de barrancos, typecheck, build y diff --check.

