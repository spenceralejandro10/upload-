# Arquitectura modular — Tokio 3D

## Una fuente cartográfica, dos vistas

MapLibre renderiza la vista aérea con datos geográficos OpenStreetMap/OpenFreeMap. La función captureWalkData en src/geo/mapView.js extrae las mismas teselas visibles y guarda la ubicación de cámara.

src/geo/sceneData.js normaliza coordenadas, edificios, carreteras, agua y parques a metros. src/geo/osmScene.js construye la escena Three.js usando esas mismas huellas y curvas. src/geo/satelliteGround.js proyecta el mismo tipo de tesela satelital sobre el suelo. src/city.js y src/player.js gestionan el mundo y las colisiones a partir de los polígonos reales.

La ciudad caminable deja de usar los generadores procedurales antiguos. Los dos motores siguen siendo independientes, pero comparten geometría cartográfica y posición geográfica.

## Reglas de edición

1. Cambiar solo el módulo correspondiente a la mejora solicitada.
2. No duplicar datos de calles o edificios por barrio.
3. Probar primero en una zona y después confirmar otra zona.
4. No mostrar una ciudad inventada si falla la descarga de GIS.
5. Mantener los tests automáticos y publicar por commits.

## Límites del Bloque 1

Se carga la zona próxima a la cámara, no toda Tokio. Las huellas de edificios y los ejes de calles proceden de OSM; algunas alturas son estimadas. Las fachadas aún son aproximadas y las anchuras de calles se representan visualmente. El parque de vehículos, semáforos, metro subterráneo y aceras precisas requieren bloques posteriores. La escena caminable no es todavía una reproducción fotogramétrica completa.

Documentación detallada: BLOQUE-1.md.
