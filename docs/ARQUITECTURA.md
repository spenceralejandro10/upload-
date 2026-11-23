# Arquitectura técnica · Japón 3D

## Objetivo

**No hay que reescribir toda la ciudad para corregir un solo objeto.** Las reglas viven en módulos independientes. Por ejemplo, una modificación a la función que genera fachadas se aplica a todos los edificios que usan ese generador.

## Flujo y dependencias

index.html → src/main.js
- Globe (src/globe.js)
  - Mapa satelital del planeta con continentes reales
  - Marcador de Japón calculado por latitud/longitud
- TokyoCity (src/city.js)
  - src/roads.js → calles, aceras, cruces y semáforos
  - src/buildings.js → modelos reutilizados, alturas y colisiones
  - src/landmarks.js → monumentos y señas del barrio
  - src/actors.js → automóviles y peatones
- Player (src/player.js)
  - Movimiento, cámara, parkour, vuelo y animación
- src/config.js
  - Coordenadas y configuraciones por distrito

## Reglas

1. Un cambio de calles se efectúa en src/roads.js; uno de fachadas en src/buildings.js.
2. No hacer copias independientes del mismo sistema para cada barrio.
3. Los parámetros propios de un barrio pertenecen a src/config.js.
4. Mantener las APIs públicas: makeRoads, makeBuildings, makeLandmark, makeActors, TokyoCity, Player y Globe.
5. Probar el cambio en un barrio antes de comprobar su propagación a los demás.
6. Crear commits separados por bloque funcional.

## Cartografía

La textura global representa continentes auténticos. La ciudad es todavía una maqueta procedural inspirada en Tokio; **no se debe confundir con una réplica cartográfica 1:1**. En versiones posteriores se podrán sustituir los generadores por datos geográficos de OSM y modelos con coordenadas, conservando el resto de los módulos.

## Rendimiento

Los edificios comparten geometría y se dibujan mediante InstancedMesh agrupado por material. Las colisiones consultan una cuadrícula local. Cada distrito se construye al seleccionarse, para evitar que toda Tokio esté en la memoria simultáneamente.

## Dependencias

Three.js ES modules 0.160.1 desde jsDelivr, texturas terrestres de los ejemplos de threejs.org. Requiere Internet y un navegador compatible con WebGL. Para ejecutar localmente, servir la carpeta por HTTP.
