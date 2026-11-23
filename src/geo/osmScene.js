import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import {insideFootprint,chooseSpawn} from "./sceneData.js";
import {makeAdvertising3D} from "./advertising3D.js";
import {satelliteGround} from "./satelliteGround.js";
import {makeStreetDetails} from "./streetDetails.js";
import {makeFacadeBuildings} from "./facadeBuildings.js";

/**
 * BLOQUES 1-3: world renderer compartido desde los datos OSM del mapa aéreo.
 * Ya no genera edificios aleatorios, manzanas rectangulares ni calles sintéticas.
 * Crea mallas 3D a partir de polígonos y líneas de la MISMA fuente OpenFreeMap.
 */
function material(color,extra={}){
 return new THREE.MeshStandardMaterial({color,roughness:.87,metalness:.07,side:THREE.DoubleSide,...extra});
}
const groundMat=material(0x777f73),parkMat=material(0x669570,{transparent:true,opacity:.32}),waterMat=material(0x488db0,{transparent:true,opacity:.35,metalness:.12,roughness:.33});
function ringCoords(ring){
 const pts=ring.slice(0,-1).map(p=>new THREE.Vector2(p[0],-p[1]));
 if(pts.length<3)return [];
 const dedup=[];
 for(const p of pts){
  const previous=dedup[dedup.length-1];
  if(!previous||p.distanceToSquared(previous)>.09)dedup.push(p);
 }
 return dedup;
}
function polyShape(rings){
 const outer=ringCoords(rings[0]);
 if(outer.length<3)return null;
 if(!THREE.ShapeUtils.isClockWise(outer))outer.reverse();
 const shape=new THREE.Shape(outer);
 for(const holeRing of rings.slice(1)){
  const hole=ringCoords(holeRing);
  if(hole.length<3)continue;
  if(THREE.ShapeUtils.isClockWise(hole))hole.reverse();
  shape.holes.push(new THREE.Path(hole));
 }
 return shape;
}
function addMerged(group,geometries,mat){
 if(!geometries.length)return;
 // Merging drastically reduces draw calls for thousands of real footprints.
 const merged=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
 if(!merged)throw new Error("No se pudo combinar la geometría GIS");
 const mesh=new THREE.Mesh(merged,mat);
 mesh.frustumCulled=false;mesh.receiveShadow=true;group.add(mesh);
 if(merged!==geometries[0])for(const g of geometries)g.dispose();
}
function polygonSurface(group,polygons,mat,elevation,limit=900){
 const geos=[];
 for(const poly of polygons.slice(0,limit)){
  const shape=polyShape(poly.rings);if(!shape)continue;
  const geometry=new THREE.ShapeGeometry(shape,1);
  geometry.rotateX(-Math.PI/2);
  geometry.translate(0,elevation,0);geos.push(geometry);
 }
 addMerged(group,geos,mat);
}
function ribbonMesh(parent,lines,color,width,y){
 const positions=[];
 for(const line of lines){
  const coords=line.points;
  for(let i=1;i<coords.length;i++){
   const a=coords[i-1],b=coords[i],dx=b[0]-a[0],dz=b[1]-a[1];
   const l=Math.hypot(dx,dz);
   if(l<.25)continue;
   const nx=dz/l*width/2,nz=-dx/l*width/2;
   const ax=a[0]+nx,az=a[1]+nz,bx=a[0]-nx,bz=a[1]-nz;
   const cx=b[0]+nx,cz=b[1]+nz,dx2=b[0]-nx,dz2=b[1]-nz;
   positions.push(
    ax,y,az, bx,y,bz, cx,y,cz,
    bx,y,bz, dx2,y,dz2,cx,y,cz
   );
  }
 }
 if(!positions.length)return;
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material(color,{metalness:0,roughness:1}));
 mesh.frustumCulled=false;parent.add(mesh);
}
function drawRails(parent,rail){
 ribbonMesh(parent,rail,0x38464f,3.2,.13);
 ribbonMesh(parent,rail,0xd7dee1,1.25,.145);
}
function buildSpatialIndex(buildings){
 const cell=100,grid=new Map();
 for(const b of buildings){
  const x0=Math.floor((b.minX-2)/cell),x1=Math.floor((b.maxX+2)/cell);
  const z0=Math.floor((b.minZ-2)/cell),z1=Math.floor((b.maxZ+2)/cell);
  for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){
   const key=ix+","+iz;
   if(!grid.has(key))grid.set(key,[]);
   grid.get(key).push(b);
  }
 }
 return (x,z)=>{
  const candidates=[],unique=new Set(),ix=Math.floor(x/cell),iz=Math.floor(z/cell);
  for(let i=ix-1;i<=ix+1;i++)for(let j=iz-1;j<=iz+1;j++){
   const entries=grid.get(i+","+j)||[];
   for(const b of entries)if(!unique.has(b)){unique.add(b);candidates.push(b);}
  }
  return candidates;
 };
}
function safeSpawn(snapshot,nearby){
 let candidate=chooseSpawn(snapshot);
 if(!nearby(candidate.x,candidate.z).some(b=>insideFootprint(b,candidate.x,candidate.z,1)))return candidate;
 // The road is mapped but intersects a building: choose another real
 // streetscape point instead of putting the player inside a wall.
 const offsets=[[3,0],[-3,0],[0,3],[0,-3],[7,0],[-7,0],[0,7],[0,-7],[14,0],[-14,0],[0,14],[0,-14]];
 for(const [dx,dz] of offsets){
  const x=candidate.x+dx,z=candidate.z+dz;
  if(!nearby(x,z).some(b=>insideFootprint(b,x,z,.65)))return {x,y:.15,z};
 }
 throw new Error("No fue posible encontrar un punto libre junto a una calle real.");
}
export function makeGeoWorld(parent,snapshot){
 if(!snapshot?.origin||!snapshot.buildings?.length||!snapshot.roads?.length){
  throw new Error("La zona carece de suficientes datos GIS; no se mostrará una ciudad inventada.");
 }
 const group=new THREE.Group();parent.add(group);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2200,2200),groundMat);
 ground.rotation.x=-Math.PI/2;ground.position.y=-.12;group.add(ground);
 const imagery=satelliteGround(group,snapshot.origin);
 polygonSurface(group,snapshot.parks,parkMat,-.066);
 polygonSurface(group,snapshot.water,waterMat,-.055);
 const streets=makeStreetDetails(group,snapshot);
 drawRails(group,snapshot.rail);
 const facades=makeFacadeBuildings(group,snapshot.buildings,{streetIndex:streets.index,
   signage:snapshot.advertisingEnabled!==false});
 const buildingCount=facades.count;
 const advertising=makeAdvertising3D(group,snapshot,streets.index,
   {max:snapshot.advertisingEnabled===false?0:undefined});
 const billboardCount=advertising.count;
 const nearby=buildSpatialIndex(snapshot.buildings);
 const sidewalk=streets.spawn;
 const spawn=sidewalk&&!nearby(sidewalk.x,sidewalk.z).some(b=>insideFootprint(b,sidewalk.x,sidewalk.z,.6))
   ?sidewalk:safeSpawn(snapshot,nearby);
 return {group,spawn,nearby,
  surfaceHeight:streets.surfaceHeight,
  update(time){streets.update(time);advertising.update(time);},
  dispose:()=>{imagery.dispose();streets.dispose();facades.dispose();advertising.dispose();},
  stats:{...streets.stats,
  buildings:buildingCount,facadeStyles:facades.styleCounts,
  retailSigns:facades.signCount,roofDetails:facades.rooftopDetails,
  anchoredAds:billboardCount,adZone:advertising.zone,adBreakdown:advertising.breakdown,
  roads:snapshot.roads.length,
  parks:snapshot.parks.length,water:snapshot.water.length,
  rail:snapshot.rail.length,billboards:billboardCount,
  geoCenter:snapshot.origin,satelliteTiles:imagery.tileCount
 }};
}
