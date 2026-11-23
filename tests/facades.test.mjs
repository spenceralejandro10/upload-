import assert from "node:assert/strict";
import {facadeProfile,facadeSummary,facadeProfile as profile,buildingSeed,FACADES,STYLE_NAMES} from "../src/geo/facadeStyles.js";
import {normalizeOSM,insideFootprint,geoToLocal} from "../src/geo/sceneData.js";

const origin=[139.70055,35.65947];
const features=[
 {id:1001,properties:{render_height:13,render_min_height:0,building:"apartments","building:levels":4},
  geometry:{type:"Polygon",coordinates:[[[139.7004,35.6596],[139.7005,35.6596],[139.7005,35.6597],[139.7004,35.6597],[139.7004,35.6596]]]}},
 {id:1002,properties:{render_height:116,render_min_height:0,building:"commercial","building:levels":32},
  geometry:{type:"Polygon",coordinates:[[[139.701,35.6596],[139.7011,35.6596],[139.70112,35.6597],[139.701,35.6597],[139.701,35.6596]]]}},
 {id:1003,properties:{render_height:9,render_min_height:0,building:"warehouse"},
  geometry:{type:"Polygon",coordinates:[[[139.7006,35.6596],[139.7007,35.6596],[139.70072,35.6597],[139.7006,35.6597],[139.7006,35.6596]]]}}
];
const snapshot=normalizeOSM({building:features,transportation:[]},origin);
assert.equal(snapshot.buildings.length,3,"Debe conservarse la misma cantidad de huellas OSM");
const buildings=snapshot.buildings;
assert.equal(buildings[0].height,13);
assert.equal(buildings[1].height,116);
assert.equal(buildings[2].height,9);
assert.equal(buildings[0].tags.building,"apartments","OSM tags deben sobrevivir a la normalización");
assert.equal(buildings[1].tags["building:levels"],32);
const profiles=buildings.map(facadeProfile);
assert.equal(profiles[0].style,"apartment");
assert.equal(profiles[1].style,"office","Torres comerciales de altura conocida no pueden usar fachada de casa");
assert.equal(profiles[2].style,"industrial");
assert.equal(profiles[2].evidence,"OSM-building-tag");
for(const [i,p] of profiles.entries()){
 assert.ok(STYLE_NAMES.includes(p.style));
 assert.ok(p.floor>2.2&&p.bay>2,"Tamaño de ventanas por planta inválido");
 assert.equal(p.height,buildings[i].height-buildings[i].base,"Las fachadas NO deben cambiar la altura real");
 assert.ok(p.storeys>=1);
 assert.deepEqual(p,facadeProfile(buildings[i]),"No debe haber variaciones aleatorias en cada render");
}
assert.equal(facadeSummary(buildings).apartment,1);
assert.equal(facadeSummary(buildings).office,1);
assert.equal(facadeSummary(buildings).industrial,1);
assert.equal(facadeProfile({...buildings[0],tags:{building:"house","roof:shape":"gabled"}}).roof,"gabled");
assert.equal(facadeProfile({...buildings[0],tags:{building:"house"}}).roofEvidence,"not-recorded");
assert.ok(Object.keys(FACADES).length>=7);
const center=[buildings[0].x,buildings[0].z];
assert.ok(insideFootprint(buildings[0],center[0],center[1]));
assert.ok(!insideFootprint(buildings[1],center[0],center[1]));
assert.ok(geoToLocal(origin,origin).every(x=>Math.abs(x)<1e-7));
const noTags={x:20,z:30,height:8,base:0,sourceId:123,tags:{}};
assert.ok(STYLE_NAMES.includes(facadeProfile(noTags).style));
const clone={...noTags};assert.equal(buildingSeed(noTags),buildingSeed(clone));
console.log("OK BLOQUE 3: 9 estilos visuales deterministas, materiales por planta, mismas huellas y alturas OSM");
