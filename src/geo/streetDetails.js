import * as THREE from "three";
import {makeStreetIndex} from "./streetModel.js";

/**
 * BLOQUE 2 — detalles urbanos a partir de calles OSM.
 * Geometría de las calles: real. Anchuras y estilo de acera: aproximados.
 * Los pasos y semáforos se sitúan solo en nodos OSM etiquetados.
 */
const mat=(color,more={})=>new THREE.MeshStandardMaterial({
 color,roughness:.96,metalness:0,side:THREE.DoubleSide,...more
});
const MATERIAL={
 road:mat(0x414a53),highway:mat(0x3e4650),foot:mat(0x898d87),
 sidewalk:mat(0xa8a9a2),curb:mat(0xd1d0c6),center:mat(0xd6ddda),
 zebra:mat(0xf7f4ea),tactile:mat(0xd7b64d),
 signal:mat(0x24313a),housing:mat(0x151d25)
};
function addTriangles(arr,a,b,c,d,y){
 arr.push(a[0],y,a[1],b[0],y,b[1],c[0],y,c[1],
          b[0],y,b[1],d[0],y,d[1],c[0],y,c[1]);
}
function pushVertical(arr,a,b,top,bottom){
 arr.push(a[0],top,a[1],b[0],top,b[1],a[0],bottom,a[1],
          b[0],top,b[1],b[0],bottom,b[1],a[0],bottom,a[1]);
}
function stripBetween(arr,from,to,y){
 for(let i=1;i<Math.min(from.length,to.length);i++){
  addTriangles(arr,from[i-1],to[i-1],from[i],to[i],y);
 }
}
function polygonQuad(out,center,tx,tz,nx,nz,halfLength,halfWidth,y){
 const a=[center[0]-tx*halfLength-nx*halfWidth,center[1]-tz*halfLength-nz*halfWidth];
 const b=[center[0]-tx*halfLength+nx*halfWidth,center[1]-tz*halfLength+nz*halfWidth];
 const c=[center[0]+tx*halfLength-nx*halfWidth,center[1]+tz*halfLength-nz*halfWidth];
 const d=[center[0]+tx*halfLength+nx*halfWidth,center[1]+tz*halfLength+nz*halfWidth];
 addTriangles(out,a,b,c,d,y);
}
function createMesh(group,positions,material,layer){
 if(!positions.length)return null;
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);
 mesh.frustumCulled=false;
 mesh.name=layer;
 group.add(mesh);
 return mesh;
}
function collectCrosswalkSegments(snapshot,index){
 const result=[];
 const all=snapshot.crossings?.crossings||[];
 for(const node of all){
  const nearest=index.nearest(node.x,node.z,p=>!p.pedestrian&&!p.bridge&&!p.tunnel);
  if(!nearest||nearest.distance>Math.max(7,nearest.profile.width/2+2))continue;
  result.push({...node,
   nearest,
   tangent:[(nearest.b[0]-nearest.a[0])/nearest.length,(nearest.b[1]-nearest.a[1])/nearest.length]});
 }
 return result;
}
function buildRoadSurface(group,index){
 const road=[],foot=[],walk=[],curb=[],center=[];
 let walkCount=0,curbCount=0;
 for(const sec of index.sections){
  const {profile:p,center:points,leftRoad,rightRoad,leftOuter,rightOuter}=sec;
  if(p.pedestrian)stripBetween(foot,leftRoad,rightRoad,.106);
  else stripBetween(road,leftRoad,rightRoad,.062);
  if(p.walk && leftOuter && rightOuter){
   stripBetween(walk,leftRoad,leftOuter,.191);
   stripBetween(walk,rightOuter,rightRoad,.191);
   for(let i=1;i<points.length;i++){
    // Linear curb under sidewalk. Detailed lowered curb ramps at crossings
    // are a separate overlay from real tagged OSM nodes.
    pushVertical(curb,leftRoad[i-1],leftRoad[i],.19,.055);
    pushVertical(curb,rightRoad[i],rightRoad[i-1],.19,.055);
    curbCount+=2;
   }
   walkCount++;
  }
  if(p.lanes>=2&&!p.pedestrian){
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(len<2)continue;
    const tx=(b[0]-a[0])/len,tz=(b[1]-a[1])/len,nx=tz,nz=-tx;
    for(let dist=2;dist<len-1.5;dist+=8){
     const span=Math.min(3.4,len-dist-.2);
     if(span<.5)continue;
     const pos=[a[0]+tx*(dist+span/2),a[1]+tz*(dist+span/2)];
     polygonQuad(center,pos,tx,tz,nx,nz,span/2,.082,.073);
    }
   }
  }
 }
 createMesh(group,road,MATERIAL.road,"OSM road surface");
 createMesh(group,foot,MATERIAL.foot,"OSM pedestrian routes");
 createMesh(group,walk,MATERIAL.sidewalk,"Japanese-style sidewalks (estimated width)");
 createMesh(group,curb,MATERIAL.curb,"curbs along real road axes");
 createMesh(group,center,MATERIAL.center,"illustrative lane markings");
 return {roadCount:index.sections.length,sidewalkCount:walkCount,curbSegments:curbCount};
}
function makeCrossing(group,index,snapshot){
 const nodes=collectCrosswalkSegments(snapshot,index);
 const stripes=[],tactile=[],ramps=[],signalGroups=[];
 const poleGeo=new THREE.CylinderGeometry(.085,.11,4.9,8);
 const headGeo=new THREE.BoxGeometry(.58,1.12,.46);
 const lightGeo=new THREE.SphereGeometry(.145,8,6);
 const signGeo=new THREE.BoxGeometry(.77,.9,.075);
 const lights=[];
 let zebraCount=0,tactileCount=0,signalCount=0;
 function makeSignals(node,nearest){
  const {width,walk}=nearest.profile;
  const tx=(nearest.b[0]-nearest.a[0])/nearest.length;
  const tz=(nearest.b[1]-nearest.a[1])/nearest.length;
  const nx=tz,nz=-tx;
  for(const side of [-1,1]){
   const pole=new THREE.Group();
   pole.position.set(nearest.x+nx*side*(width/2+Math.max(1,walk*.7)),0,
                     nearest.z+nz*side*(width/2+Math.max(1,walk*.7)));
   const stem=new THREE.Mesh(poleGeo,MATERIAL.signal);stem.position.y=2.45;pole.add(stem);
   const head=new THREE.Mesh(headGeo,MATERIAL.housing);head.position.y=4.78;pole.add(head);
   const red=new THREE.Mesh(lightGeo,new THREE.MeshBasicMaterial({color:0x3c1212}));
   red.position.set(0,5.08,.25);
   const green=new THREE.Mesh(lightGeo,new THREE.MeshBasicMaterial({color:0x12382b}));
   green.position.set(0,4.63,.25);
   pole.add(red,green);
   const plaque=new THREE.Mesh(signGeo,new THREE.MeshStandardMaterial({color:0x2c6290,roughness:.8}));
   plaque.position.set(.37,3.75,0);pole.add(plaque);
   group.add(pole);
   signalGroups.push(pole);
   lights.push({red,green,offset:side<0?0:Math.PI});
   signalCount++;
  }
 }
 for(const node of nodes){
  const {nearest}=node,profile=nearest.profile,tx=(nearest.b[0]-nearest.a[0])/nearest.length;
  const tz=(nearest.b[1]-nearest.a[1])/nearest.length,nx=tz,nz=-tx;
  const width=Math.min(19,profile.width);
  // Crosswalk orientation is derived from its NEAREST REAL road segment.
  // Markings are drawn only when OSM tags imply visible paint.
  if(node.painted){
   const stripesN=8;
   for(let i=0;i<stripesN;i++){
    const along=(i-(stripesN-1)/2)*.70;
    const c=[nearest.x+tx*along,nearest.z+tz*along];
    polygonQuad(stripes,c,tx,tz,nx,nz,.245,Math.max(1.3,width/2-.22),.084);
   }
   zebraCount++;
  }
  if(node.tactile){
   for(const side of [-1,1]){
    const c=[nearest.x+nx*side*(width/2+Math.min(.8,profile.walk*.5)),
             nearest.z+nz*side*(width/2+Math.min(.8,profile.walk*.5))];
    polygonQuad(tactile,c,tx,tz,nx,nz,1.2,.37,.202);
   }
   tactileCount++;
  }
  if(node.kerb==="lowered"||node.kerb==="flush"){
   for(const side of [-1,1]){
    const c=[nearest.x+nx*side*(width/2+.38),nearest.z+nz*side*(width/2+.38)];
    polygonQuad(ramps,c,tx,tz,nx,nz,1.2,.57,.11);
   }
  }
  if(node.signal)makeSignals(node,nearest);
 }
 // A real traffic-signal node can exist without an explicitly mapped crossing.
 for(const node of snapshot.crossings?.signals||[]){
  if(nodes.some(n=>n.id===node.id))continue;
  const near=index.nearest(node.x,node.z,p=>p.lanes>0&&!p.bridge&&!p.tunnel);
  if(!near||near.distance>near.profile.width/2+4)continue;
  makeSignals(node,near);
 }
 createMesh(group,stripes,MATERIAL.zebra,"OSM tagged zebra crossings");
 createMesh(group,tactile,MATERIAL.tactile,"OSM tactile paving tags");
 createMesh(group,ramps,MATERIAL.sidewalk,"OSM lowered curb points");
 return {
  crossingCount:nodes.length,zebraCount,tactileCount,signalCount,
  update(time){
   const green=Math.sin(time*.57)>0;
   for(const entry of lights){
    const state=entry.offset? !green:green;
    entry.red.material.color.setHex(state?0x3c1212:0xff4736);
    entry.green.material.color.setHex(state?0x46ffb7:0x12382b);
   }
  },
  dispose(){
   // Unique bulb materials are disposable, common geometry/materials are shared.
   for(const l of lights){l.red.material.dispose();l.green.material.dispose();}
   for(const obj of signalGroups)obj.traverse(child=>{
    if(child.isMesh&&child.geometry===signGeo)child.material.dispose();
   });
   poleGeo.dispose();headGeo.dispose();lightGeo.dispose();signGeo.dispose();
  }
 };
}
export function makeStreetDetails(parent,snapshot){
 const group=new THREE.Group();group.name="B02 · calles, andenes y cruces OSM";parent.add(group);
 const index=makeStreetIndex(snapshot.roads);
 const roads=buildRoadSurface(group,index);
 const crossings=makeCrossing(group,index,snapshot);
 return {
  group,index,
  spawn: index.selectSidewalkSpawn(snapshot.buildings),
  surfaceHeight:index.surfaceHeight,
  update:crossings.update,
  stats:{...roads,crossings:crossings.crossingCount,zebra:crossings.zebraCount,
   tactile:crossings.tactileCount,signals:crossings.signalCount},
  dispose:crossings.dispose
 };
}
