# Bloques por subsistemas — Tokio 3D

| ID | Subsistema | Estado |
|---|---|---|
| B00 | Tierra y entrada a Japón | Incorporado |
| B01 | Una sola fuente GIS para vista aérea y avatar | Aplicado |
| B01a | Calles curvas y huellas de edificios reales | Aplicado |
| B01b | Suelo con fotografía aérea alineada | Aplicado |
| B01c | Spawn y colisiones sobre huellas reales | Aplicado |
| B02 | Andenes, cruces, bordillos y señalización | Aplicado (anchuras estimadas; cruces OSM opcionales) |
| B03 | Fachadas japonesas detalladas | Aplicado: ventanas, tipos arquitectónicos, escaparates y azoteas ilustrativas sobre huellas OSM |
| B04 | Publicidad LED 3D sobre edificios OSM | Aplicado: pantallas de fachada, anuncios locales y marcos de neón, densidad por zona |
| B05 | Metro, estaciones y accesos de OSM | Aplicado: marcadores georreferenciados y entradas 3D ilustrativas; interiores no navegables |
| B06 | Tráfico en calles reales | Pendiente |
| B07 | Peatones en rutas reales | Pendiente |
| B08 | Mejoras del avatar y parkour | Parcial |
| B09 | Modelos fieles de lugares emblemáticos | Parcial |

Los 23 distritos especiales y 31 barrios se gestionan en src/regions/wards.js. Los cambios comunes se aplican en el generador del bloque una sola vez. Las pruebas se ejecutan mediante GitHub Actions.

Detalles: [Bloque 1](BLOQUE-1.md), [Bloque 2](BLOQUE-2.md), [Bloque 3](BLOQUE-3.md) [Bloque 4](BLOQUE-4.md) y [Bloque 5](BLOQUE-5.md).
