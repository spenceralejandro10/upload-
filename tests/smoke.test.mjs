import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
const modules=[
 "src/config.js","src/globe.js","src/roads.js","src/buildings.js","src/landmarks.js",
 "src/actors.js","src/city.js","src/player.js","src/main.js","src/regions/wards.js",
 "src/geo/mapView.js","src/geo/wardCenters.js","src/geo/places.js",
 "src/geo/billboards.js","src/geo/metro.js","src/geo/sceneData.js",
 "src/geo/osmScene.js","src/geo/satelliteGround.js","src/geo/mercator.js"
];
for(const path of modules){
 assert.ok(existsSync(path),"Falta módulo: "+path);
 execFileSync(process.execPath,["--check",path],{stdio:"pipe"});
}
const wardFile=readFileSync("src/regions/wards.js","utf8");
for(const place of ["shibuya","shinjuku","akihabara","asakusa","minato","sumida","chiyoda"]){
 assert.ok(wardFile.includes(place),"Falta zona: "+place);
}
const {WARDS,DISTRICTS}=await import("../src/regions/wards.js");
assert.equal(WARDS.length,23,"Tokio debe organizarse en 23 distritos especiales");
assert.ok(DISTRICTS.length>23,"Deben existir barrios por cada distrito");
assert.equal(new Set(DISTRICTS.map(d=>d.id)).size,DISTRICTS.length,"Los barrios requieren IDs únicos");
const {PLACES}=await import("../src/geo/places.js");
assert.ok(PLACES.some(p=>p.id==="shibuya-cross"),"Falta Shibuya Crossing");
assert.ok(PLACES.some(p=>p.id==="haneda"),"Falta Haneda");
assert.ok(PLACES.some(p=>p.id==="narita"),"Falta Narita");
const {metroGeoJSON}=await import("../src/geo/metro.js");
assert.ok(metroGeoJSON().features.length>=3,"Faltan líneas de metro");
const html=readFileSync("index.html","utf8");
for(const id of ["aerial-map","aerial-panel","ward-select","area-select","satellite-toggle","metro-toggle","advertising-toggle","enter-btn"]){
 assert.ok(html.includes(id),"Falta control: "+id);
}
const map=readFileSync("src/geo/mapView.js","utf8");
assert.ok(map.includes("source-layer"),"El mapa necesita edificios procedentes de OSM");
assert.ok(map.includes("World_Imagery"),"Falta capa de fotografía real");
assert.ok(map.includes("fill-extrusion"),"Faltan volúmenes 3D a partir de huellas reales");
console.log("OK: "+modules.length+" módulos sintácticos, 23 distritos, "+DISTRICTS.length+" barrios, "+PLACES.length+" lugares, metro y mapas 3D.");
