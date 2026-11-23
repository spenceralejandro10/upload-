# Arquitectura modular — Tokio 3D

## Dos motores separados

### Cartografía real
src/geo/mapView.js utiliza MapLibre con OpenStreetMap/OpenFreeMap y fotografía satelital. Dibuja las huellas de los edificios con datos de altura variables, calles de verdad (no cuadrículas), ferrocarriles, parques, ríos y puntos de interés.

Las ubicaciones están separadas:
- src/regions/wards.js: 23 distritos especiales y barrios.
- src/geo/wardCenters.js: centros de cámara aproximados.
- src/geo/places.js: monumentos, aeropuertos, hospitales, universidades, estaciones y comercios.
- src/geo/billboards.js: anuncios de demostración (no publicidad oficial real actual).
- src/geo/metro.js: líneas esquemáticas de metro (no exactitud topográfica).

### Mundo caminable experimental
Three.js con src/city.js, src/roads.js, src/buildings.js, src/landmarks.js, src/actors.js y src/player.js. Los edificios y calles son todavía procedurales. La transición del mapa geográfico al avatar existe, pero **no se debe afirmar que la escena a pie es una copia exacta de Tokio**.

## Método de trabajo

1. Elegir un bloque (p. ej. anuncios).
2. Modificar solamente ese módulo.
3. Revisar un punto (Shibuya), después comprobar el resto (Akihabara, Shinjuku).
4. Verificar regresiones de Tierra, vista aérea y caminata.
5. Guardar el cambio en un commit de GitHub.
6. Comprobar GitHub Actions.

## Metas de precisión

El mapa satelital sí contiene la distribución geográfica real. Las alturas OSM pueden ser aproximadas; modelos particulares deben validarse individualmente. Para lograr calles caminables reales, habrá que alimentar el motor del avatar con una malla 3D generada desde datos GIS y colisiones construidas a partir de la misma cartografía.

## Dependencias

Three.js 0.160.1, MapLibre GL JS 6.16.0, OpenFreeMap, OpenStreetMap, ArcGIS World Imagery. Los proveedores externos requieren Internet. Créditos de cartografía visibles dentro del mapa.
