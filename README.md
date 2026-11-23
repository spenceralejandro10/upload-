# JAPÓN 3D — Tierra y Tokio con geometría compartida

Sitio: https://spenceralejandro10.github.io/upload-/

## Bloque 1 — Aplicado

La vista aérea y el modo avatar ya usan la misma fuente cartográfica: las teselas vectoriales de OpenFreeMap/OpenStreetMap cargadas en MapLibre. La entrada al modo caminable extrae las huellas de edificios, trazados de calles, agua, parques y ferrocarriles de la posición que se está viendo, los transforma a metros y los dibuja en Three.js. El suelo también reutiliza fotografía aérea Esri proyectada a las mismas coordenadas.

No se construye una ciudad procedural distinta para el modo avatar. Los generadores anteriores de cuadrículas, calles y edificios siguen en el repositorio solo como código histórico, sin uso en la ruta principal.

Los contornos y curvas coinciden en coordenadas con el mapa real, pero las fachadas y el ancho de las calles siguen siendo aproximados. El área caminable solo carga teselas próximas al centro; no toda Tokio al mismo tiempo.

## Cómo probarlo

1. Entra en Japón y acerca la vista aérea a Shibuya, Kamata u otro barrio.
2. Pulsa Entrar en la misma ciudad en 3D.
3. El personaje aparece cerca de una calle real. Compara las curvas y huellas.
4. Vuelve a la vista aérea y comprueba que conserva la cámara.

Controles: W A S D para caminar, Mayús correr, Alt+Mayús turbo, Espacio saltar, E escalar, F volar, V cambiar cámara y R reaparecer.

## Arquitectura por bloques

- src/geo/mapView.js: fuente GIS y vista aérea.
- src/geo/sceneData.js: convertir y normalizar geometrías reales.
- src/geo/osmScene.js: dibujar las mismas huellas y curvas en Three.js.
- src/geo/satelliteGround.js: mosaico satelital del suelo.
- src/geo/mercator.js: proyección compartida.
- src/regions/wards.js: 23 distritos especiales y barrios.
- src/player.js: colisiones sobre polígonos y aparición en una calle real.
- src/city.js: escena caminable con geometría GIS.
- src/main.js: control de transiciones y sincronización de zonas.
- tests/geo.test.mjs: validación de curvas, polígonos y proyección.
- tests/smoke.test.mjs: validación de estructura y sintaxis.

Consulta docs/BLOQUE-1.md, docs/ARQUITECTURA.md y docs/BLOQUES.md para las reglas y límites de desarrollo.

## Ejecutar

En GitHub Pages el sitio se publica desde main. Localmente se sirve con python -m http.server 8000 y se abre http://localhost:8000. Requiere WebGL e Internet.

Cartografía © OpenStreetMap y OpenFreeMap. Imágenes © Esri y proveedores. Three.js y MapLibre GL JS. Los carteles son ilustrativos y el metro superpuesto es esquemático.
