import assert from "node:assert/strict";
import {roadProfile,offsetPolyline,streetSections,makeStreetIndex,normalizeCrossingNodes} from "../src/geo/streetModel.js";
import {geoToLocal} from "../src/geo/sceneData.js";

const road={kind:"secondary",subclass:"",points:[[-45,0],[0,0],[25,25],[45,34]]};
const profile=roadProfile(road);
assert.equal(profile.width,10);
assert.ok(profile.walk>0);
assert.equal(roadProfile({...road,kind:"path",subclass:"footway"}).pedestrian,true);
assert.equal(roadProfile({...road,kind:"path",subclass:"footway"}).lanes,0);
assert.equal(roadProfile({...road,brunnel:"tunnel"}).draw,false);
assert.equal(roadProfile({...road,kind:"motorway"}).walk,0);
assert.equal(roadProfile({...road,width:7.2}).width,7.2);
assert.equal(roadProfile({...road,width:1000}).width,10);
assert.equal(roadProfile({...road,kind:"path",subclass:"steps"}).walk,0);

const lines=streetSections([road]);
assert.equal(lines.length,1);
assert.equal(lines[0].center.length,4);
assert.equal(lines[0].leftRoad.length,4);
assert.equal(lines[0].rightRoad.length,4);
const a=offsetPolyline(road.points,profile.width/2);
const b=offsetPolyline(road.points,-profile.width/2);
assert.equal(a.length,road.points.length);
assert.notDeepEqual(a[2],a[1],"Los cambios de dirección deben preservarse");
assert.ok(Math.hypot(a[0][0]-b[0][0],a[0][1]-b[0][1])>8);

const index=makeStreetIndex([road]);
const projected=index.nearest(0,1);
assert.ok(projected&&projected.distance<2);
assert.ok(index.surfaceHeight(0,0)>.04&&index.surfaceHeight(0,0)<.1,"Debe existir calzada baja");
assert.ok(index.surfaceHeight(0,6.8)>.18,"Debe existir bordillo elevado");
assert.ok(index.surfaceHeight(0,30)===0,"No se deben inventar aceras donde no hay calle");
const buildings=[{rings:[[[-10,25],[5,25],[5,35],[-10,35],[-10,25]]],minX:-10,maxX:5,minZ:25,maxZ:35}];
const spawn=index.selectSidewalkSpawn(buildings);
assert.ok(spawn&&Number.isFinite(spawn.x)&&Number.isFinite(spawn.z));
assert.ok(spawn.y>.2);

const origin=[139.7005,35.6594],coords=[[139.7005,35.6594],[139.7006,35.6595]];
const nodes=[
 {type:"node",id:1,lon:coords[0][0],lat:coords[0][1],
  tags:{highway:"crossing",crossing:"traffic_signals",crossing_ref:"zebra",tactile_paving:"yes",kerb:"lowered"}},
 {type:"node",id:2,lon:coords[1][0],lat:coords[1][1],
  tags:{highway:"crossing",crossing:"unmarked"}},
 {type:"node",id:3,lon:coords[0][0]+.00002,lat:coords[0][1],
  tags:{highway:"traffic_signals"}},
 {type:"way",id:4,lon:0,lat:0,tags:{highway:"crossing"}}
];
const crossings=normalizeCrossingNodes(nodes,origin);
assert.equal(crossings.crossings.length,2);
assert.equal(crossings.signals.length,2);
assert.ok(crossings.crossings[0].painted);
assert.ok(crossings.crossings[0].tactile);
assert.equal(crossings.crossings[0].kerb,"lowered");
assert.equal(crossings.crossings[1].painted,false);
assert.deepEqual([crossings.crossings[0].x,crossings.crossings[0].z],geoToLocal(coords[0],origin));
const duplicate=normalizeCrossingNodes([...nodes,nodes[0]],origin);
assert.equal(duplicate.crossings.length,2,"No repetir cruces duplicados");
console.log("OK BLOQUE 2: trazado curvo, perfiles, aceras, bordillos, aparición y cruces OSM");
