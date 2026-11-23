import assert from "node:assert/strict";
import {
 geoToLocal,localToGeo,normalizeOSM,insideFootprint,
 insidePolygon,distanceToSegment,chooseSpawn
} from "../src/geo/sceneData.js";
import {lonLatToTile,tileToLonLat} from "../src/geo/mercator.js";

const origin=[139.7005,35.6594];
const p=[139.7008,35.6597];
const local=geoToLocal(p,origin),roundtrip=localToGeo(local,origin);
assert.ok(local[0]>0 && local[1]<0,"Eje norte-sur incorrecto");
assert.ok(Math.abs(roundtrip[0]-p[0])<1e-8 && Math.abs(roundtrip[1]-p[1])<1e-8,"Proyección y desproyección deben coincidir");
const raw={
 building:[{
  id:"test-building",properties:{render_height:27,render_min_height:0},
  geometry:{type:"Polygon",coordinates:[[
   [139.70066,35.65955],[139.70074,35.65955],
   [139.70074,35.65964],[139.70066,35.65964],[139.70066,35.65955]
  ]]}
 }],
 transportation:[{
  id:"test-road",properties:{class:"secondary"},
  geometry:{type:"LineString",coordinates:[
   [139.70030,35.6594],[139.70050,35.6594],
   [139.70061,35.65952],[139.70063,35.65963]
  ]}
 }],
 water:[{geometry:{type:"Polygon",coordinates:[[
  [139.701,35.660],[139.7011,35.660],[139.7011,35.6601],[139.701,35.6601],[139.701,35.660]
 ]]},properties:{}}],
 landuse:[{geometry:{type:"Polygon",coordinates:[[
  [139.699,35.660],[139.6991,35.660],[139.6991,35.6601],[139.699,35.6601],[139.699,35.660]
 ]]},properties:{class:"park"}}]
};
const data=normalizeOSM(raw,origin);
assert.equal(data.buildings.length,1,"Faltan edificios GIS");
assert.equal(data.buildings[0].height,27,"Alturas GIS modificadas");
assert.equal(data.roads.length,1,"Faltan calles GIS");
assert.equal(data.roads[0].points.length,4,"Se perdieron las curvas de una calle");
assert.equal(data.water.length,1);
assert.equal(data.parks.length,1);
const building=data.buildings[0];
assert.ok(insideFootprint(building,building.x,building.z),"El edificio debe conservar su contorno");
assert.ok(!insideFootprint(building,0,0),"Edificios no deben cubrir la calle central");
const spawn=chooseSpawn(data);
assert.ok(Number.isFinite(spawn.x)&&Number.isFinite(spawn.z));
assert.ok(!insidePolygon(spawn.x,spawn.z,building.rings));
const duplicate=normalizeOSM({...raw,building:[raw.building[0],raw.building[0]]},origin);
assert.equal(duplicate.buildings.length,1,"Edificios de las mismas teselas deben deduplicarse");
assert.equal(distanceToSegment(1,4,[0,0],[2,0]).distance,4);
const t=lonLatToTile(...origin,16);
const tile=tileToLonLat(t[0],t[1],16);
assert.ok(Math.abs(tile[0]-origin[0])<1e-8&&Math.abs(tile[1]-origin[1])<1e-8,"La imagen aérea y las calles no están registradas");
console.log("OK: proyección, curvas, huellas, alturas, spawn y satélite alineados");
