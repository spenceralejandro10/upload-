# Tablero de bloques — Tokio 3D

| Bloque | Módulo | Situación |
|---|---|---|
| 00 | Globo y continentes (src/globe.js) | Incorporado |
| 01 | Acceso desde la Tierra (src/main.js) | Incorporado |
| 02 | Imagen satelital aérea (src/geo/mapView.js) | Incorporado |
| 03 | Edificios, agua, calles y parques OSM (src/geo/mapView.js) | Incorporado; precisión según datos |
| 04 | Los 23 ku (src/regions/wards.js) | Incorporado |
| 05 | Los barrios (src/regions/wards.js) | 31 zonas |
| 06 | Lugares, hospitales y aeropuertos (src/geo/places.js) | Marcadores |
| 07 | Publicidad de estilo japonés (src/geo/billboards.js) | Escénica |
| 08 | Metro (src/geo/metro.js) | Esquemático |
| 09 | Avatar (src/player.js) | Experimentación |
| 10 | Calles para caminar (src/roads.js) | Procedural; pendiente GIS |
| 11 | Edificios para caminar (src/buildings.js) | Procedural; pendiente GIS |
| 12 | Tráfico y peatones (src/actors.js) | Experimental |
| 13 | Monumentos caminables (src/landmarks.js) | Experimental |
| 14 | Integración (src/main.js) | Incorporado |
| 15 | UI (index.html y styles.css) | Incorporado |
| 16 | Tests CI (tests/smoke.test.mjs) | Incorporado |

## Criterio de aprobación

Una mejora probada en una instancia debe aplicarse mediante su módulo compartido al resto; sin duplicar código ni romper otras funciones. Cada ajuste se revisa y se guarda en un commit individual.

## Prioridad de siguiente fase

Mantener el mapa aéreo verdadero y convertir las colisiones y las calles del mundo caminable a datos reales. Mejorar modelos particulares y pantallas con validación por edificio.
