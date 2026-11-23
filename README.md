# JAPÓN 3D — de la Tierra a Tokio

**Sitio:** https://spenceralejandro10.github.io/upload-/

La primera vista muestra el planeta Tierra. Al seleccionar Japón se abre una **vista aérea geográfica de Tokio**, con mapas y fotografía satelital real, trazado urbano, calles, zonas verdes, puertos, ríos, aeropuertos y edificios 3D a partir de huellas de OpenStreetMap.

**Precisión:** el mapa aéreo es cartografía real; la geometría/altura de cada edificio depende de los datos disponibles. No todos los edificios tienen altura exacta. Los carteles luminosos son una visualización escénica, no campañas publicitarias actuales. El **modo caminable experimental** todavía utiliza un escenario procedural separado, no las calles reales.

## Vistas y navegación

1. **Planeta:** arrastra para girar, rueda para ampliar; botón "Entrar a Japón".
2. **Aérea de Tokio:** explora el mapa continuo, inclina y gira la cámara, selecciona distrito especial y barrio. Botones "Vista general" y "Cruce de Shibuya".
3. **Capas:** activa o desactiva fotografía aérea, publicidad escénica, lugares emblemáticos y metro esquemático.
4. **A pie (experimental):** botón de caminata, avatar con W A S D, Mayús correr, Alt+Mayús turbo, Espacio doble salto, E escalar, F volar, V cambiar cámara, R reaparecer. Esc libera el ratón.
5. Se puede volver desde la vista a pie a la vista aérea real y desde allí a la Tierra.

## Tokio dividido en zonas

Los 23 distritos especiales (ku) y 31 zonas de referencia están definidos en src/regions/wards.js. Los centros de cámara están en src/geo/wardCenters.js. El mapa no se divide físicamente en cuadrados: se desplaza continuamente por la geografía auténtica de Tokio. Haneda está en Tokio; Narita se marca en Chiba, fuera de Tokio.

## Bloques editables

| Bloque | Archivo(s) |
|---|---|
| Planeta y selección de Japón | src/globe.js y src/config.js |
| Mapa aéreo real, edificios 3D, calles, parques, agua | src/geo/mapView.js |
| Organización de 23 ku y barrios | src/regions/wards.js |
| Centros de los distritos | src/geo/wardCenters.js |
| Aeropuertos, hospitales, monumentos, comercios, estaciones | src/geo/places.js |
| Publicidad luminosa escénica | src/geo/billboards.js |
| Metro esquemático | src/geo/metro.js |
| Calles y semáforos experimentales | src/roads.js |
| Edificios experimentales | src/buildings.js |
| Monumentos experimentales | src/landmarks.js |
| Tráfico y peatones experimentales | src/actors.js |
| Avatar y movilidad | src/player.js |
| Generación caminable | src/city.js |
| Control de modos y cambios de zona | src/main.js |
| Paneles e interfaz | index.html y styles.css |
| Validaciones de GitHub | tests/smoke.test.mjs |

**Una mejora se hace una sola vez en el generador de ese bloque y afecta a todas las instancias que lo usan.** Ver docs/ARQUITECTURA.md y docs/BLOQUES.md.

## Ejecución

GitHub Pages: Settings → Pages → main / root.

Localmente: ejecuta python -m http.server 8000 en la carpeta y abre http://localhost:8000. No abrir index.html directamente con file://.

Se necesita Internet y WebGL.

## Tecnología y atribuciones

- Three.js 0.160.1 y MapLibre GL JS 6.16.0.
- OpenStreetMap + OpenFreeMap: topología real de vías, parcelas, edificios, agua y parques.
- ArcGIS World Imagery: fotografía aérea con créditos a Esri y proveedores dentro del mapa.
- Líneas de metro de referencia (no trayectorias exactas de túneles). Las vías férreas base sí vienen de la cartografía OSM.
- Carteles diseñados como representación visual de la publicidad luminosa de Tokio.
