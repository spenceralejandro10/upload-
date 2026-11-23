# JAPÓN 3D — Tierra y Tokio con geometría compartida

Sitio: https://spenceralejandro10.github.io/upload-/

## BLOQUE 3 — Fachadas japonesas en los mismos edificios OSM

**Aplicado:** los edificios caminables ahora tienen nueve familias visuales (viviendas, apartamentos, comercios, usos mixtos, oficinas, torres acristaladas, hoteles, industria y equipamientos), con ventanas, marcos, reflejos y balcones ilustrativos. Se añadieron escaparates a nivel de calle, algunos rótulos genéricos en japonés y equipos de azotea en determinados edificios.

**La ciudad no cambia:** las fachadas se aplican a las mismas huellas, coordenadas y alturas del mapa geográfico del Bloque 1. Los estilos son aproximaciones cuando faltan datos específicos de OSM; no se han recreado los materiales reales de cada edificio.

Los cambios a un estilo se aplican por módulo a todas las zonas. Implementado en `src/geo/facadeStyles.js` y `src/geo/facadeBuildings.js`; pruebas en `tests/facades.test.mjs`.

Documentación: [Bloque 3](docs/BLOQUE-3.md).

## BLOQUE 2 — Calles, andenes y cruces

**Aplicado en GitHub:** el avatar ahora utiliza calzadas y rutas peatonales construidas sobre ejes reales OSM. El módulo compartido de calles añade aceras elevadas, bordillos, carriles y marcas viales. Se consultan nodos OSM etiquetados para dibujar pasos cebra, pavimento táctil y semáforos en sus ubicaciones; si la consulta a Overpass falla, estos detalles opcionales no se inventan.

La posición de aparición del avatar prioriza una acera cercana libre de edificios; la altura de su suelo se adapta a la acera o calzada. El sistema se aplica a cualquier distrito mediante `src/geo/streetModel.js` y `src/geo/streetDetails.js`.

**Precisión:** la forma de las calles sí procede de OSM, pero la mayoría de anchuras de calzada y aceras son estimaciones visuales. Las señales cambian de color con una animación ilustrativa, no con los ciclos reales del tráfico de Tokio. Los pasos cebra solo aparecen donde OSM indica marcas y la consulta responde.

Más información: [documentación del Bloque 2](docs/BLOQUE-2.md).

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
- src/geo/facadeStyles.js y src/geo/facadeBuildings.js: tipologías visuales, ventanas, escaparates y azoteas sobre edificios OSM.
- src/geo/satelliteGround.js: mosaico satelital del suelo.
- src/geo/mercator.js: proyección compartida.
- src/regions/wards.js: 23 distritos especiales y barrios.
- src/player.js: colisiones sobre polígonos y aparición en una calle real.
- src/city.js: escena caminable con geometría GIS.
- src/main.js: control de transiciones y sincronización de zonas.
- tests/geo.test.mjs: validación de curvas, polígonos y proyección.
- tests/smoke.test.mjs: validación de estructura y sintaxis.

Consulta docs/BLOQUE-1.md, docs/BLOQUE-2.md, docs/BLOQUE-3.md, docs/ARQUITECTURA.md y docs/BLOQUES.md para las reglas y límites de desarrollo.

## Ejecutar

En GitHub Pages el sitio se publica desde main. Localmente se sirve con python -m http.server 8000 y se abre http://localhost:8000. Requiere WebGL e Internet.

Cartografía © OpenStreetMap y OpenFreeMap. Imágenes © Esri y proveedores. Three.js y MapLibre GL JS. Los carteles son ilustrativos y el metro superpuesto es esquemático.
