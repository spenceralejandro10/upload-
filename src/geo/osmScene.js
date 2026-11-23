import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import {insideFootprint,chooseSpawn,geoToLocal} from "./sceneData.js";
import {SIGNS} from "./billboards.js";
import {satelliteGround} from "./satelliteGround.js";
import {makeStreetDetails} from "./streetDetails.js";

/**
 * BLOQUE 1: world renderer compartido desde los datos OSM del mapa aéreo.
 * Ya no genera edificios aleatorios, manzanas rectangulares ni calles sintéticas.
 * Crea mallas 3D a partir de polígonos y líneas de la MISMA fuente OpenFreeMap.
 */
const PALETTE=[0xa9b2b9,0x879da9,0xc0b6a9,0x9eaaa8,0x8d9fae,0xb4b9c0];
const ROAD_STYLE={
 motorway:[0x535c65,18],trunk:[0x59616b,15],primary:[0x58616b,13],
 secondary:[0x606a72,11],tertiary:[0x606871,9],street:[0x5f666d,7.5],
 residential:[0x626b73,6.6],minor:[0x626a72,6.4],
 service:[0x676f75,4.8],living_street:[0x6e757b,4.6],
 pedestrian:[0xa6a09a,5],path:[0x9c998d,2.5],track:[0x88877c,3]
};
function material(color,extra={}){
 return new THREE.MeshStandardMaterial({color,roughness:.87,metalness:.07,side:THREE.DoubleSide,...extra});
}
const mats=PALETTE.map(c=>material(c));
const groundMat=material(0x777f73), parkMat=material(0x669570,{transparent:true,opacity:.32}),waterMat=material(0x488db0,{transparent:true,opacity:.35,metalness:.12,roughness:.33});
const roadMats=new Map(),railMat=material(0xbfc2b8);
function stableIndex(b){
 const n=Math.abs(Math.floor(b.x*3+b.z*7+b.height*11));
 return n%PALETTE.length;
}
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
function buildingsLayer(group,buildings){
 const buckets=Array.from({length:PALETTE.length},()=>[]);
 const max=window.innerWidth<700?1200:3000;
 const order=buildings.slice().sort((a,b)=>(a.x*a.x+a.z*a.z)-(b.x*b.x+b.z*b.z));
 let visible=0;
 for(const b of order){
  if(visible>=max)break;
  const shape=polyShape(b.rings);
  if(!shape)continue;
  const depth=Math.max(2.2,b.height-b.base);
  const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:1});
  geo.rotateX(-Math.PI/2);
  geo.translate(0,b.base+.09,0);
  buckets[stableIndex(b)].push(geo);
  visible++;
 }
 for(let i=0;i<buckets.length;i++)addMerged(group,buckets[i],mats[i]);
 return visible;
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
function drawRoads(parent,roads){
 const categories=new Map();
 for(const r of roads){
  const style=ROAD_STYLE[r.kind]||ROAD_STYLE.residential;
  const key=r.kind in ROAD_STYLE?r.kind:"residential";
  if(!categories.has(key))categories.set(key,[]);
  categories.get(key).push(r);
 }
 for(const [kind,lines] of categories){
  const [color,width]=ROAD_STYLE[kind];
  ribbonMesh(parent,lines,color,width,.045);
 }
}
function drawRails(parent,rail){
 ribbonMesh(parent,rail,0x38464f,3.2,.13);
 ribbonMesh(parent,rail,0xd7dee1,1.25,.145);
}
function makeSign(group,advertisement,center){
 const c=document.createElement("canvas");c.width=512;c.height=180;
 const ctx=c.getContext("2d");
 ctx.fillStyle="#07172a";ctx.fillRect(0,0,512,180);
 ctx.fillStyle=advertisement.accent||"#7afafa";ctx.fillRect(6,7,500,8);ctx.fillRect(6,165,500,8);
 ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 78px sans-serif";
 ctx.fillStyle="#ffffff";ctx.fillText(advertisement.title,256,80,490);
 ctx.font="bold 26px sans-serif";ctx.fillStyle=advertisement.accent||"#7afafa";
 ctx.fillText(advertisement.subtitle,256,141,480);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.SpriteMaterial({map:texture,depthTest:true,transparent:true});
 const sign=new THREE.Sprite(m);
 sign.scale.set(15,5.3,1);
 sign.position.set(center.x,Math.max(13,Math.min(58,center.height*.72)),center.z);
 group.add(sign);
}
function decorate(group,snapshot){
 let count=0;
 for(const ad of SIGNS){
  const [x,z]=geoToLocal(ad.loc,snapshot.origin);
  if(Math.abs(x)>650||Math.abs(z)>650)continue;
  let nearest=null,d=Infinity;
  for(const b of snapshot.buildings){
   const dd=(b.x-x)**2+(b.z-z)**2;
   if(dd<d){d=dd;nearest=b;}
  }
  if(!nearest||d>95*95)continue;
  makeSign(group,ad,nearest);count++;
 }
 return count;
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
 const buildingCount=buildingsLayer(group,snapshot.buildings);
 const billboardCount=decorate(group,snapshot);
 const nearby=buildSpatialIndex(snapshot.buildings);
 const sidewalk=streets.spawn;
 const spawn=sidewalk&&!nearby(sidewalk.x,sidewalk.z).some(b=>insideFootprint(b,sidewalk.x,sidewalk.z,.6))
   ?sidewalk:safeSpawn(snapshot,nearby);
 return {group,spawn,nearby,
  surfaceHeight:streets.surfaceHeight,
  update:streets.update,
  dispose:()=>{imagery.dispose();streets.dispose();},
  stats:{...streets.stats,
  buildings:buildingCount,roads:snapshot.roads.length,
  parks:snapshot.parks.length,water:snapshot.water.length,
  rail:snapshot.rail.length,billboards:billboardCount,
  geoCenter:snapshot.origin,satelliteTiles:imagery.tileCount
 }};
}
