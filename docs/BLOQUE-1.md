# BLOQUE 1 · Fuente única de ciudad

**Estado:** implementado en la rama main. El modo a pie ya no crea calles o edificios a partir de una cuadrícula artificial.

## Arquitectura de la actualización

1. El usuario inspecciona Tokio en MapLibre (OpenStreetMap/OpenFreeMap).
2. Al pulsar entrar en la ciudad, el sistema guarda exactamente el centro y la orientación del mapa real.
3. Temporalmente carga las teselas vectoriales necesarias a mayor zoom y espera la fuente de edificios.
4. Extrae edificios, calles, ferrocarriles, parques y agua desde las mismas teselas del mapa aéreo.
5. src/geo/sceneData.js convierte coordenadas lon/lat a metros relativos al centro y preserva geometrías, alturas y curvas.
6. src/geo/osmScene.js genera la escena caminable desde esos polígonos y líneas.
7. src/geo/satelliteGround.js proyecta las mismas teselas satelitales de Esri bajo las geometrías a pie.
8. src/player.js usa los contornos para colisiones y un punto de acceso cerca de una calle real.
9. El mapa aéreo recupera su cámara original al salir del modo caminable.

**El modo a pie y la vista aérea comparten ahora la fuente GIS y el punto geográfico.** Ya no se ejecutan makeRoads ni makeBuildings aleatorios para construir la ciudad principal.

## Archivo por responsabilidad

- src/geo/mapView.js: proveedor GIS y captura de teselas visibles.
- src/geo/sceneData.js: geometría en coordenadas métricas y operaciones espaciales.
- src/geo/osmScene.js: edificios, calzadas, terrenos, ferrocarriles y rótulos.
- src/geo/satelliteGround.js: fotografía aérea correctamente proyectada.
- src/city.js: ciclo de vida de la escena compartida.
- src/player.js: física, colisiones sobre contornos reales y aparición en calle.
- src/main.js: cambio de vista y zona.
- tests/geo.test.mjs: regresión de coordenadas, calles, polígonos y alturas.

## Alcance y limitaciones del bloque

- El área caminable se genera con las teselas descargadas alrededor del centro de cámara, no simultáneamente para toda la metrópoli.
- Los polígonos de edificios son fieles a las huellas de OSM disponibles, pero las fachadas son esquemáticas y algunas alturas de OSM son aproximadas.
- Las calles se muestran sobre los ejes reales con anchos orientativos, pendientes y aceras detalladas quedan para un bloque posterior.
- Las teselas pueden venir partidas por bordes; la deduplicación conserva fragmentos distintos, sin inventar edificios.
- No se implementan todavía semáforos y tráfico ubicados según la cartografía real, ni todos los túneles y entradas de estaciones.
- Si las teselas no se pueden descargar no se presenta una ciudad falsa como sustituto: se conserva la vista aérea y aparece un error.
- La obtención de datos depende de la conexión y de los proveedores cartográficos. El uso de fotografía satelital mantiene créditos a Esri.

## Prueba funcional esperada

1. Abrir la vista aérea y situarse sobre Shibuya.
2. Identificar un giro de calle y dos edificios adyacentes.
3. Pulsar entrar en la misma ciudad.
4. Comprobar que el giro y las huellas tienen las mismas posiciones relativas.
5. Volver a la vista aérea; el centro y la orientación deben conservarse.
6. Repetir en otro distrito y confirmar que el mismo bloque de geometría funciona sin duplicación.
