import assert from "node:assert/strict";
import {planAdvertising,realFacades,districtActivity,AD_DISTRICTS} from "../src/geo/adPlacement.js";
import {geoToLocal,insideFootprint} from "../src/geo/sceneData.js";
import {makeStreetIndex} from "../src/geo/streetModel.js";

function rectangle(x,z,w,d,height,id,tags={building:"commercial"}){
 const ring=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],
  [x-w/2,z+d/2],[x-w/2,z-d/2]];
 return {
  x,z,halfX:w/2,halfZ:d/2,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,
  height,base:0,tags,sourceId:id,rings:[ring]
 };
}
const shibuya=[139.70055,35.65947],inactive=[139.5,35.8];
const buildings=[
 rectangle(0,0,20,14,48,"osm:101"),
 rectangle(28,1,17,15,32,"osm:102"),
 rectangle(-27,1,15,15,24,"osm:103"),
 rectangle(52,4,15,14,18,"osm:104")
];
const roads=[{kind:"secondary",points:[[-100,-15],[110,-15]],width:11,brunnel:""}];
const streets=makeStreetIndex(roads);
const sides=realFacades(buildings[0],streets);
assert.ok(sides.length>0,"No se detectaron fachadas reales orientadas a calle");
assert.ok(sides[0].nx===0 && sides[0].nz<0,
 "El cartel debe orientarse a la calle y no al interior del edificio");
const snapshot={origin:shibuya,buildings,roads};
const plan=planAdvertising(snapshot,streets,{limit:12});
assert.ok(plan.entries.length>0,"Shibuya debería tener anuncios anclados");
assert.ok(plan.anchorCount>0,"Debe integrarse al menos un punto real de referencia");
assert.ok(plan.entries.length<=12,"Se debe limitar la carga de pantallas");
for(const item of plan.entries){
 assert.ok(Number.isFinite(item.x)&&Number.isFinite(item.y)&&Number.isFinite(item.z));
 assert.ok(item.y>=3 && item.height>0 && item.width>0,"Panel inválido");
 assert.ok(Math.abs(Math.hypot(item.nx,item.nz)-1)<1e-5,"Normal de pared no normalizada");
 assert.ok(item.illustrative,"Los anuncios son ilustrativos, no reales");
 assert.ok(item.sourceBuilding!==null,"Los anuncios deben estar asociados a huellas OSM");
 const matching=buildings.find(b=>b.sourceId===item.sourceBuilding);
 assert.ok(matching);
 assert.ok(!insideFootprint(matching,item.x,item.z),"El panel debe quedar fuera del muro");
 assert.ok(item.y+item.height/2<=matching.height+.001,
   "Un cartel no puede sobresalir del edificio al que pertenece");
}
assert.deepEqual(plan,planAdvertising(snapshot,streets,{limit:12}),
 "La distribución de carteles debe ser estable entre visitas");
assert.equal(planAdvertising(snapshot,streets,{limit:0}).entries.length,0,
 "El control de desactivar publicidad debe ocultar todos los carteles");
assert.ok(districtActivity(shibuya).intensity>.9);
assert.ok(districtActivity(inactive).intensity<.01);
assert.equal(AD_DISTRICTS.length>=4,true);
const relocated={...snapshot,origin:inactive};
assert.equal(planAdvertising(relocated,streets,{limit:12}).entries.length,0,
 "No se deben inventar rótulos intensivos fuera de las zonas comerciales");
console.log("OK BLOQUE 4: pantallas 3D ancladas a fachadas OSM, orientation, altura, densidad y desactivación");
