# BLOQUE 5 — Metro, estaciones y accesos geográficos de Tokio

**Estado:** incorporado al proyecto de GitHub.

## Qué se incorporó

- Al abrir la vista aérea de Japón, la capa **Metro · líneas y accesos OSM** está activada de forma predeterminada.
- Las cuatro líneas de metro utilizadas como referencia siguen identificadas expresamente como **esquemáticas**: no son una copia de los túneles ni representan toda la red del área metropolitana.
- Se consultan datos de OpenStreetMap con Overpass para identificar **accesos reales etiquetados** railway=subway_entrance, railway=train_station_entrance y estaciones etiquetadas railway=station o public_transport=station + subway=yes.
- Los accesos registrados aparecen como marcadores sobre sus coordenadas en el mapa aéreo. Al entrar al modo caminable se crean modelos 3D sencillos de entradas, letreros y escaleras decorativas junto al punto OSM correspondiente.
- Se muestran únicamente las vías férreas que la cartografía de superficie identifica como no subterráneas. Los segmentos con tunnel o layer negativo quedan excluidos del dibujo sobre el suelo.
- Se conserva el terreno satelital, el trazado de calles, los edificios, las aceras, las pantallas y los controles del avatar del resto de los bloques. El cambio se aplica por módulo en todos los distritos disponibles.

## Separación por módulos

| Archivo | Responsabilidad |
|---|---|
| src/geo/metro.js | Diagrama esquemático de cuatro líneas y estaciones de referencia |
| src/geo/transitData.js | Consulta y normalización de entradas y estaciones OSM |
| src/geo/metroWorld.js | Accesos 3D, carteles de estación y vías visibles sobre superficies reales |
| src/geo/mapView.js | Marcadores aéreos OSM, estado y descarga de datos para caminar |
| src/geo/osmScene.js | Incorpora el bloque ferroviario dentro del entorno caminable |
| src/main.js / index.html / styles.css | Controles y visualización |
| tests/transit.test.mjs | Pruebas de normalización, filtros, coordenadas y deduplicación |
| tests/smoke.test.mjs | Comprobación de sintaxis del nuevo bloque |

## Precisión y limitaciones

**Geográficas:** posiciones de accesos y estaciones solo cuando están registradas en OSM. Los proveedores externos pueden no responder o carecer de ciertos accesos; en ese caso no se inventan.

**Visuales:** los techos, puertas, escaleras, carteles y postes de las estaciones son representaciones aproximadas, **no reproducciones arquitectónicas exactas**. No se representan interiores, andenes subterráneos, escaleras mecánicas ni túneles navegables. No se muestra el servicio ferroviario en tiempo real.

**Red:** el diagrama de cuatro líneas procede de una referencia aproximada del proyecto, no del trazado GIS oficial del metro. Las vías visibles sobre la superficie corresponden a tramos OSM cuando la fuente contiene esos datos.

## Cómo verificarlo

1. Entrar a Tokio desde el globo y enfocar una zona con estaciones, por ejemplo Shibuya o Ginza.
2. Comprobar que el control de metro está activado. A un zoom de barrio aparecerán accesos y estaciones cuando Overpass suministre datos.
3. Entrar al recorrido del avatar en esa zona y comprobar que los modelos se sitúan sobre las coordenadas GIS, sin introducir otra cuadrícula.
4. Volver a la vista aérea, desactivar metro y entrar nuevamente para confirmar que ya no se muestran entradas 3D del módulo.
5. Comprobar en otro distrito y verificar que no se han movido las calles ni los edificios.
6. Ejecutar npm test: debe incluir tests/transit.test.mjs.

## Fuentes de datos

- https://wiki.openstreetmap.org/wiki/Tag:railway%3Dsubway_entrance
- https://wiki.openstreetmap.org/wiki/Metro_Mapping
- https://openmaptiles.org/docs/schema/
- © OpenStreetMap contributors, OpenFreeMap y proveedores cartográficos acreditados.

**Nota:** haber concluido este quinto bloque no significa que se hayan completado los futuros subsistemas de tráfico en vías reales, peatones o modelos arquitectónicos individuales.
