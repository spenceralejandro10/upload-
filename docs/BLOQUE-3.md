# BLOQUE 3 — Fachadas japonesas detalladas sobre Tokio real

**Estado:** aplicado en GitHub, rama main.

## Cambios visibles

- Los edificios **siguen utilizando las mismas huellas, tamaños, alturas y coordenadas cartográficas** de OpenStreetMap/OpenFreeMap. No se ha incorporado una ciudad procedural distinta.
- Se reemplazó el color gris uniforme por fachadas con ventanas, marcos, cristales, reflejos y ritmos de plantas dibujados en texturas repetidas a escala aproximada.
- Se implementaron nueve familias de estilo visual: vivienda baja, apartamentos, comercio, uso mixto, oficinas, torres acristaladas, hoteles, industria y equipamientos públicos.
- Se añadieron balcones y barandillas ilustrativos en fachadas de vivienda y apartamentos.
- Algunos edificios comerciales muestran plantas bajas acristaladas, escaparates y rótulos japoneses genéricos (no se presentan como negocios verificados).
- Algunas cubiertas grandes cuentan con elementos visuales de climatización.
- Se usa un algoritmo determinista por edificio: no cambian las fachadas aleatoriamente cuando se visita otra vez la zona.
- Las fachadas, señales y azoteas son un **módulo reutilizable**; los cambios futuros a una tipología se aplicarán a todas sus instancias.

## Garantías de precisión

**Reales:** posición, huella, proporción de contornos y altura cuando está registrada en los datos OSM.

**Estilizados:** color de fachada, ventanas, balcones, material de cubierta, escaparates, climatización y rótulos donde no haya información específica. Los edificios no son modelos 3D verificados individualmente. No se asignan logos comerciales auténticos.

Si existen etiquetas OSM como building, building:levels, shop, office o roof:shape se conservan para la clasificación visual, pero no se implica que los materiales inventados sean registros reales.

## Módulos

| Archivo | Responsabilidad |
|---|---|
| src/geo/facadeStyles.js | Clasificación determinista de tipologías visuales a partir de etiquetas y altura OSM |
| src/geo/facadeBuildings.js | Construcción en grupos de fachadas con UVs, ventanas, escaparates, techos, rótulos y detalles de azotea |
| src/geo/sceneData.js | Mantener las etiquetas disponibles desde la fuente GIS |
| src/geo/osmScene.js | Incorporar el nuevo bloque de fachada a la ciudad, sin alterar las calles o el personaje |
| tests/facades.test.mjs | Validación de tipologías, determinismo, conservación de altura y huellas |
| tests/smoke.test.mjs | Comprobación sintáctica y estructural de todos los módulos |

## Rendimiento

En lugar de crear una malla por ventana, las fachadas comparten texturas por tipología, y las paredes se agrupan en pocas mallas. Se conserva el límite de edificios del entorno para no cargar toda Tokio en un solo paso. Las texturas se eliminan al abandonar/cambiar zona, liberando memoria GPU.

## Prueba manual

1. Abrir el mapa de Tokio y acercar la cámara a Shibuya o Shinjuku.
2. Pulsar **Entrar en la misma ciudad en 3D**.
3. Comprobar que las esquinas y huellas coinciden con las vistas desde el aire.
4. Examinar fachadas próximas: ventanas y distribución de plantas varían entre edificios bajos, apartamentos, locales y oficinas.
5. Volver a la vista aérea y probar en un distrito residencial para verificar los mismos modelos compartidos.

## Pendiente para mayor fidelidad

Fotografías auténticas de cada fachada, geometría real de balcones y escaparates, identificación individual de negocios, modelos GLB de edificios emblemáticos y variación por época y tipo de construcción.

Los bloques futuros podrán sustituir la textura o el perfil de fachada por un modelo confirmado de cada dirección sin modificar su huella GIS.
