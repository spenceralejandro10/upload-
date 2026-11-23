# BLOQUE 4 — Publicidad 3D integrada en Tokio

**Estado:** implementado sobre los edificios del mapa GIS, sin generar una ciudad adicional.

## Cambios

- Pantallas LED físicamente adheridas a fachadas de edificios tomados de OpenStreetMap. Marcos luminosos, material emisivo animado y texturas originales con texto japonés.
- Tres formatos: grandes pantallas, anuncios verticales y carteles de comercios.
- La densidad comercial depende de la cercanía a Shibuya, Kabukichō, Akihabara, Ginza, Ikebukuro y Roppongi.
- Selección de fachadas orientadas hacia los ejes reales de las calles, utilizando el contorno del polígono OSM.
- Tamaños y alturas limitados por las dimensiones de los edificios.
- Anuncios deterministas: no cambian aleatoriamente en cada visita.
- Instancias de geometría y materiales compartidos para controlar rendimiento.
- El selector de publicidad de la vista aérea también controla la generación de estas pantallas en el modo caminable.

## Módulos

| Archivo | Responsabilidad |
|---|---|
| src/geo/billboards.js | Puntos ilustrativos de referencia |
| src/geo/adPlacement.js | Densidad, elección de edificio, normal exterior y dimensiones |
| src/geo/advertising3D.js | Pantallas, LED, animación y recursos 3D |
| src/geo/osmScene.js | Integración del módulo en el mapa caminable |
| src/main.js | Opción de mostrar u ocultar publicidad |
| tests/advertising.test.mjs | Posición, orientación, dimensiones y comportamiento determinista |

## Lo que representa fielmente

Las coordenadas, huellas y orientaciones urbanas vienen de OpenStreetMap/OpenFreeMap. Los rótulos son recreaciones ilustrativas: **no garantizan que haya actualmente tal pantalla, marca o anuncio en un inmueble determinado**. Las posiciones de los puntos de referencia son aproximadas, no una inspección fotogramétrica.

La vista aérea todavía muestra letreros como marcadores MapLibre; el montaje físico 3D se aplica al recorrido caminable. Los textos, gráficos y la animación luminosa no provienen de publicidad comercial real.

## Comprobación

1. Entrar a Japón desde el planeta y situar la vista aérea sobre Shibuya.
2. Activar Publicidad y pantallas de Tokio.
3. Entrar en modo caminable y verificar anuncios sujetos a fachadas, sin carteles flotantes sobre las calles.
4. Repetir en Akihabara y Ginza.
5. Volver a vista aérea, desactivar la casilla y regresar al avatar: las pantallas del Bloque 4 se omiten.
6. Ejecutar npm test en GitHub Actions.

## Próximo bloque

B05: metro, estaciones y accesos reales.
