import * as THREE from "three";
import {distanceToSegment} from "./sceneData.js";

/**
 * BLOQUE 5 · Entradas de metro y estaciones 3D donde OSM las registra.
 * No son modelos exactos de la estación, ni incluyen un túnel accesible.
 * Las vías visibles respetan los tramos ferroviarios de OpenStreetMap.
 */
function makeLabel(text,secondary="地下鉄 METRO"){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=192;
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#093b76";ctx.fillRect(0,0,512,192);
 ctx.fillStyle="#ffffff";ctx.fillRect(8,8,496,5);ctx.fillRect(8,178,496,5);
 ctx.fillStyle="#e5f3ff";ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.font="bold 67px 'Noto Sans JP','Yu Gothic',sans-serif";
 ctx.fillText(text||"地下鉄",256,79,478);
 ctx.font="bold 27px system-ui,sans-serif";ctx.fillText(secondary,256,150,468);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}
function mat(color,additional={}){
 return new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.12,...additional});
}
function railGeometry(lines){
 const positions=[];
 for(const line of lines){
  const points=line.points||[];
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   const vx=b[0]-a[0],vz=b[1]-a[1],length=Math.hypot(vx,vz);
   if(length<.4)continue;
   const nx=vz/length*.65,nz=-vx/length*.65;
   const y=.16;
   positions.push(
    a[0]+nx,y,a[1]+nz,a[0]-nx,y,a[1]-nz,b[0]+nx,y,b[1]+nz,
    a[0]-nx,y,a[1]-nz,b[0]-nx,y,b[1]-nz,b[0]+nx,y,b[1]+nz
   );
  }
 }
 if(!positions.length)return null;
 const geo=new THREE.BufferGeometry();
 geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 geo.computeVertexNormals();
 return geo;
}
export function visibleRailSections(rails){
 // OSM tunnel or layer below ground is not drawn above the surface.
 return (rails||[]).filter(line=>{
  const below=line.brunnel==="tunnel"||Number(line.layer)<0;
  return !below&&line.points?.length>=2;
 });
}
export function nearestRail(x,z,rails){
 let best=null;
 for(const line of rails||[]){
  const points=line.points||[];
  for(let i=1;i<points.length;i++){
   const p=distanceToSegment(x,z,points[i-1],points[i]);
   if(!best||p.distance<best.distance)best={...p,line};
  }
 }
 return best;
}
function makeEntrance(group,item,streetIndex,resources){
 const location=new THREE.Group();
 location.position.set(item.x,.21,item.z);
 // Orient the decorative entry toward the closest real OSM street.
 const road=streetIndex?.nearest(item.x,item.z,p=>p.lanes>0&&!p.bridge&&!p.tunnel);
 if(road){
  const tx=(road.b[0]-road.a[0])/road.length,tz=(road.b[1]-road.a[1])/road.length;
  const angle=Math.atan2(tx,tz);
  location.rotation.y=angle;
 }
 const dark=resources.dark,metal=resources.metal,cyan=resources.cyan;
 const plate=new THREE.Mesh(new THREE.BoxGeometry(3.8,.07,3.1),dark);
 plate.position.set(0,.03,-.4);location.add(plate);
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(3.9,.20,2.7),metal);
 canopy.position.set(0,3.1,-.45);location.add(canopy);
 for(const x of [-1.75,1.75]){
  const post=new THREE.Mesh(new THREE.BoxGeometry(.16,3,.16),metal);
  post.position.set(x,1.55,.3);location.add(post);
 }
 // Model a fenced, dark staircase mouth, not a working subway interior.
 const mouth=new THREE.Mesh(new THREE.BoxGeometry(2.75,.055,2.25),dark);
 mouth.position.set(0,.09,-.5);location.add(mouth);
 for(let k=0;k<5;k++){
  const stair=new THREE.Mesh(new THREE.BoxGeometry(2.6,.045,.26),metal);
  stair.position.set(0,.15+k*.025,.33-k*.36);location.add(stair);
 }
 const label=item.name||"地下鉄";
 const sub=item.code?"ENTRADA "+item.code:"ACCESO · METRO";
 const tex=makeLabel(label,sub);resources.textures.push(tex);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(3.35,1.23),
  new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false}));
 resources.billboardMaterials.push(face.material);
 face.position.set(0,2.47,1.0);location.add(face);
 const top=new THREE.Mesh(new THREE.BoxGeometry(.6,.07,3.6),cyan);
 top.position.set(-1.94,3.06,-.4);location.add(top);
 location.name="OSM "+item.railway+" "+(item.name||item.id);
 group.add(location);
 return location;
}
function makeStationMarkers(parent,stations,resources){
 const geo=new THREE.CylinderGeometry(.14,.14,5.4,9);
 resources.geometries.push(geo);
 const white=mat(0xeaf5fa),dark=resources.metal;
 resources.materials.push(white);
 for(const station of stations.slice(0,28)){
  const group=new THREE.Group();
  group.position.set(station.x,.1,station.z);
  // Map point only: not a duplicate arbitrary building model.
  const shaft=new THREE.Mesh(geo,dark);shaft.position.y=2.7;group.add(shaft);
  const labelTexture=makeLabel(station.name||"駅","STATION · OSM");
  resources.textures.push(labelTexture);
  const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,depthTest:true}));
  resources.materials.push(sign.material);
  sign.position.set(0,6.5,0);sign.scale.set(8.8,3.3,1);group.add(sign);
  parent.add(group);
 }
}
export function makeMetroWorld(parent,snapshot,streetIndex,options={}){
 const group=new THREE.Group();group.name="B05 · estaciones y metro OSM";parent.add(group);
 const resources={
  textures:[],materials:[],geometries:[],billboardMaterials:[],
  metal:mat(0xbfcbd2,{metalness:.48,roughness:.42}),
  dark:mat(0x142330),
  cyan:new THREE.MeshBasicMaterial({color:0x66dcf5})
 };
 resources.materials.push(resources.metal,resources.dark,resources.cyan);
 const visible=visibleRailSections(snapshot.rail);
 const railsGeo=railGeometry(visible);
 if(railsGeo){
  const railsMat=mat(0xd1d7d7,{metalness:.38});
  const mesh=new THREE.Mesh(railsGeo,railsMat);
  mesh.name="OSM visible railway segments";mesh.frustumCulled=false;
  group.add(mesh);resources.materials.push(railsMat);
 }
 const enabled=options.enabled!==false;
 const transit=snapshot.transit||{entrances:[],stations:[],status:"unavailable"};
 const entrances=enabled?(transit.entrances||[]).filter(e=>Math.abs(e.x)<600&&Math.abs(e.z)<600).slice(0,65):[];
 const stations=enabled?(transit.stations||[]).filter(e=>Math.abs(e.x)<620&&Math.abs(e.z)<620).slice(0,28):[];
 for(const entrance of entrances)makeEntrance(group,entrance,streetIndex,resources);
 if(enabled)makeStationMarkers(group,stations,resources);
 return {
  count:entrances.length,stations:stations.length,rails:visible.length,sourceStatus:transit.status,
  // Each load owns only its materials, and Three city disposal owns geometry.
  dispose(){
   for(const t of resources.textures)t.dispose();
   for(const m of [...resources.materials,...resources.billboardMaterials])m.dispose();
  }
 };
}
