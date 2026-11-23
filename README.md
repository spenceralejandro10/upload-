# Japón 3D | De la Tierra a Tokio

Experiencia tridimensional de navegador: planeta Tierra con **mapa geográfico real**, iluminación, nubes y marcador de Japón. **Solo Japón se puede abrir en modo calle**. Desde el globo se entra a Tokio y se puede explorar una maqueta urbana con personaje propio, peatones, vehículos, edificios y monumentos.

**Versión 0.1:** el planeta usa cartografía visual auténtica; los barrios de Tokio son una simulación procedural e inspirada en lugares reales, no una réplica exacta del callejero.

## Lanzamiento

GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root).

Después del despliegue, la página puede abrirse desde https://spenceralejandro10.github.io/upload-/ .

Para ejecutar en un servidor local:
- En la carpeta del repositorio, ejecutar: python -m http.server 8000
- Visitar http://localhost:8000

Three.js y las texturas terrestres se cargan desde Internet.

## Controles

**Tierra:** arrastrar el ratón para girar, rueda para acercar, clic en el marcador de Japón o botón de entrada. Otros países no se pueden abrir.

**Tokio:** W A S D para moverse; Mayús correr; Alt + Mayús turbo; Espacio salto/doble salto; E escalar junto a fachadas; F volar; Espacio/Ctrl subir/bajar durante vuelo; V alternar cámara; R reaparecer. Haz clic en la ciudad para capturar el ratón, Esc para liberarlo.

## Bloques editables

| Qué queremos ajustar | Archivo |
|---|---|
| Tierra, continentes y nubes | src/globe.js |
| País habilitado y barrios | src/config.js |
| Calles y andenes | src/roads.js |
| Modelos, fachadas y edificios | src/buildings.js |
| Monumentos | src/landmarks.js |
| Carros y peatones | src/actors.js |
| Generación de las zonas | src/city.js |
| Avatar, movimiento y cámaras | src/player.js |
| Entrada y salida de Japón | src/main.js |
| Diseño de la interfaz | styles.css |

Arquitectura: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

Tablero del proyecto: [docs/BLOQUES.md](docs/BLOQUES.md).

## Licencias y tecnología

Proyecto JavaScript ES Modules + Three.js 0.160.1. Las imágenes satelitales de la Tierra están referenciadas desde los ejemplos de Three.js (datos visuales geográficos reales). No se almacena ninguna fotografía privada ni se utiliza una clave API.
