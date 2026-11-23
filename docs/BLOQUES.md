# Tablero de desarrollo por bloques

| Bloque | Sistema | Archivo central | Primera versión |
|---|---|---|---|
| B00 | Globo y continentes | src/globe.js | Tierra satelital y estrellas |
| B01 | Acceso a Japón | src/main.js | Entrada y regreso al planeta |
| B02 | Calles | src/roads.js | Calzadas, marcas, cruces |
| B03 | Andenes y semáforos | src/roads.js | Aceras, postes y luces |
| B04 | Edificios | src/buildings.js | Fachadas y alturas compartidas |
| B05 | Monumentos | src/landmarks.js | Torre de Tokio, Skytree, templo |
| B06 | Carros | src/actors.js | Tráfico móvil |
| B07 | Peatones | src/actors.js | Personas con movimiento |
| B08 | Avatar | src/player.js | Correr, saltar, escalar, volar |
| B09 | Cámaras | src/player.js | Primera y tercera persona |
| B10 | Barrios | src/config.js y src/city.js | 7 sectores de Tokio |
| B11 | Interfaz | index.html, styles.css | HUD, selector, controles |
| B12 | Pruebas | Pendiente | Test visual y rendimiento |

## Para cerrar un bloque

- Mejora aislada y verificable en una zona.
- Mismo resultado en todas las instancias del modelo compartido.
- Ninguna regresión en la Tierra, el acceso a Japón o el avatar.
- Confirmación del cambio mediante commit.

## Estado

v0.1 (2026-11-23): primeros módulos y navegación Tierra → Japón → barrios de Tokio. Las calles y los edificios urbanos aún no son georreferenciados.
