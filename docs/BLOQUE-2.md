# BLOQUE 2 — Calles, aceras, bordillos y señalización

## Implementación

- **Calles reales:** se mantienen los puntos y curvas de la capa transportation de OpenStreetMap/OpenFreeMap. No se crean cuadrados ni un nuevo trazado.
- **Perfiles por tipo de calle:** calzadas, rutas peatonales, calles residenciales, arterias, vías de servicio y vías rápidas. Las anchuras se estiman cuando la cartografía no dispone de ese dato.
- **Aceras con bordillo:** mallas a ambos lados de los ejes viales, con superficie elevada y canto vertical continuo. Para zonas peatonales se muestran sendas sobre el trazado original.
- **Marcas viales:** líneas centrales discontinuas ilustrativas en calles de dos o más carriles.
- **Cruces y semáforos:** consulta opcional a Overpass por nodos de OSM con highway=crossing o highway=traffic_signals. Se muestran cebras cuando las etiquetas de OSM indican marcas, señales donde los nodos las indican y pavimento táctil cuando aparece tactile_paving=yes. No se sitúan pasos peatonales inventados en cada cruce.
- **Rampas:** superposición visual al encontrar kerb=lowered o kerb=flush; aún no incluye una malla física de pendiente en cada acceso.
- **Avatar:** prefiere aparecer en una acera de una calle OSM próxima y la detección de suelo tiene en cuenta las diferentes alturas.

## Archivos por responsabilidad

| Archivo | Función |
|---|---|
| src/geo/streetModel.js | Clasificación de calles, cálculo de offsets/miter, índice espacial, punto de aparición y validación de nodos OSM |
| src/geo/streetDetails.js | Mallas visuales de calzada, acera, bordillo, marcas, cebras y señales |
| src/geo/crossingData.js | Consultas opcionales Overpass (sin claves ni datos de usuario) |
| src/geo/mapView.js | Captura las teselas y los detalles de los cruces |
| src/geo/osmScene.js | Utiliza el bloque vial para generar la escena |
| src/city.js / src/player.js | Colisiones y altura de la acera |
| tests/street.test.mjs | Prueba de perfiles, curvas, orientación y cruces etiquetados |

## Alcance y límites

Las coordenadas de calles y los nodos de cruces derivan de OpenStreetMap. **No son medidas oficiales de bordillos ni de anchos reales:** los valores de los perfiles son aproximados cuando OSM no incluye `width`. Las calzadas en túnel no se dibujan como carreteras superficiales y las autopistas no reciben aceras genéricas. La geometría de cruces se orienta según el segmento cartográfico más próximo; la señalización y la duración de los semáforos son ilustrativas. La disponibilidad de nodos depende de Overpass y de las etiquetas OSM. Si no hay nodos verificables, se ocultan los elementos opcionales.

No se añaden todavía vehículos ni peatones con rutas reales; tampoco se garantiza accesibilidad universal, escalas exactas de intersección, ni colisiones con el mobiliario urbano.

## Prueba funcional

1. Abre Tokio y enfoca un barrio residencial o Shibuya en la vista aérea.
2. Entra en el modo caminable: identifica una avenida real con tramos curvos.
3. Comprueba que las aceras siguen esa curva y están elevadas respecto al asfalto.
4. Verifica que el avatar aparece junto a una calle, no en una azotea.
5. En zonas con nodos OSM de pasos etiquetados y servicio disponible, verifica cebras y semáforos.
6. Cambia de distrito y comprueba que el mismo generador se aplica sin cambios locales.

## Fuentes y créditos

- https://openmaptiles.org/docs/schema/
- https://wiki.openstreetmap.org/wiki/Key:crossing
- https://wiki.openstreetmap.org/wiki/Overpass_API
- Cartografía © OpenStreetMap contributors / OpenFreeMap
