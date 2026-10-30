# Optimización y propuesta de HUD · 30 de octubre de 2026

Cambios locales, sin publicar. El HUD real de App.tsx/styles.css no se modificó. La propuesta está aislada en `/hud-proposal.html` y sus controles son únicamente una maqueta visual, sin añadir funciones ni escribir datos. Usa DEFAULT_STATE: cero huevos, cero leche y seis tareas listas, no cifras inventadas de producción.

## Trabajo de CPU

`benchmark-runtime.cjs` ejecuta el mismo mundo, tres rutas frías y 20 segundos simulados de los 29 animales (1.250 actualizaciones). Registros en before.json y after.json, medidos en esta Mac; no son una garantía de FPS en otros dispositivos.

- Preparación de navegación/vegetación: 5.562 → 1.606 ms.
- Plaza → establo: 641 → 15 ms.
- Plaza → vacas: 2.614 → 39 ms.
- Plaza → cabras: 10.923 → 572 ms de trabajo total.
- Animales: 2.865 → 86 ms acumulados; peor actualización 111 → 1,87 ms.

El trabajo restante de rutas largas se ejecuta cooperativamente con un presupuesto compartido de 2 ms por fotograma. Los tramos individuales pueden exceder ligeramente ese presupuesto; la prueba observó un máximo de 3,12 ms y el navegador alrededor de 6–8 ms en muestras iniciales. Tareas tienen prioridad sobre paseos, solicitudes nuevas reemplazan solicitudes anteriores y la celebración espera a que terminen sus rutas. El A* conserva las mismas colisiones exactas y caminos continuos.

Índice espacial de aristas para intersecciones, bandas horizontales para pruebas de polígonos y candidatos cercanos ordenados por distancia. No se aproximó la geometría de agua, barrancos, cercas, puertas ni puentes. El terreno conserva límites estáticos para culling y solo recalcula visibilidad al cambiar suficiente la cámara, con margen de seguridad. Hierba frente a los pies se repinta a intervalos de 80 ms, conservando movimiento de actores por fotograma.

El dibujo Retina se limita a 1,5× y aproximadamente 2 Mpx cuando el tamaño lo permite, con muestreo pixel art. Cámara e interiores usan el mismo factor; se evita redimensionar el canvas cuando las medidas no cambiaron. No hay selector nuevo ni reducción de habitantes, vegetación, cascadas o parcelas.

## Validación

TypeScript, compilación de producción y batería existente: 126 rutas, 16.201 muestras, 35 caminos, 18 zonas, tareas, puertas, edificios, puentes, topografía, vegetación, animales y cangrejos. Nueva prueba contrasta 2.500 posiciones y límites contra los polígonos completos, 100 segmentos contra la referencia sin índice, igualdad de ruta A* cooperativa, prioridades y reemplazo de solicitudes. Renderizado y HUD revisados en navegador, escritorio y 390 px. Las lecturas FPS de la vista integrada variaron alrededor de 17–20; no se atribuye una mejora de FPS a partir de esa muestra ni se promete 60 FPS.

## Dirección visual de la propuesta

Habilidad design-taste-frontend, dirección Framed sheet, semilla 1730062111. Marco tomado del verde salvia de la granja y tipografía de marca Fraunces con DM Sans. Se adapta la estructura a un juego sin barra lateral porque los controles existentes no justifican navegación nueva. El mapa ocupa el centro, recursos aparecen en el pie, Música/Información en cabecera y Sorpresa/Tareas en el pie. No hay buscador, inventario nuevo, minimapa ni notificaciones añadidas. La pregunta de la pantalla es «¿Cómo está la granja y qué cuidado quiero hacer?», contestada por el mapa y los recursos. No se usó el inspector CDP de la habilidad; la verificación visual se hizo con cua_repl.
