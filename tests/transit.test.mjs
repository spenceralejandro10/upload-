import assert from "node:assert/strict";
import {normalizeTransitElements,transitQuery,nearTransitElements} from "../src/geo/transitData.js";
import {geoToLocal} from "../src/geo/sceneData.js";
const origin=[139.70055,35.65947];
const raw=[
 {type:"node",id:101,lon:139.7006,lat:35.6595,tags:{
  railway:"subway_entrance",ref:"A1",name:"渋谷駅 入口",wheelchair:"yes"}},
 {type:"node",id:102,lon:139.7007,lat:35.6596,tags:{
  railway:"station",name:"Shibuya",subway:"yes",operator:"Tokyo Metro"}},
 {type:"node",id:103,lon:139.7011,lat:35.6597,tags:{
  railway:"train_station_entrance",ref:"West"}},
 {type:"way",id:104,center:{lon:139.7004,lat:35.65945},tags:{
  railway:"subway_entrance",name:"Entrada de referencia"}},
 {type:"node",id:105,lon:139.72,lat:35.67,tags:{railway:"subway_entrance"}},
 {type:"node",id:106,lon:139.7008,lat:35.6597,tags:{shop:"yes"}},
 {type:"node",id:107,lon:139.7009,lat:35.6597,tags:{public_transport:"station",subway:"yes",name:"Estación subterránea"}}
];
const model=normalizeTransitElements(raw,origin);
assert.equal(model.status,"ok");
assert.equal(model.entrances.length,3,"Entradas nodos y vías cerca del área");
assert.equal(model.stations.length,2,"Distinguir estaciones de las entradas");
assert.equal(model.entrances[0].code,"A1");
assert.equal(model.entrances[0].accessible,"yes");
const [x,z]=geoToLocal([raw[0].lon,raw[0].lat],origin);
assert.equal(model.entrances[0].x,x);
assert.equal(model.entrances[0].z,z);
assert.equal(normalizeTransitElements([...raw,raw[0]],origin).entrances.length,3,
 "No duplicar objetos OSM");
assert.equal(nearTransitElements(model,{radius:2}).entrances.length,0);
assert.ok(nearTransitElements(model,{radius:200}).entrances.length>=1);
assert.ok(transitQuery(origin).includes('railway"="subway_entrance'));
assert.ok(transitQuery(origin).includes('train_station_entrance'));
assert.ok(!model.entrances.some(e=>e.id==="node:105"),"Excluir el barrio distante");
const disabled={entrances:[],stations:[],status:"unavailable"};
assert.equal(nearTransitElements(disabled).stations.length,0);
console.log("OK BLOQUE 5: accesos y estaciones OSM, coordenadas, filtros, deduplicación y estado externo.");
