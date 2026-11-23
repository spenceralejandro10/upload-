import * as THREE from "three";
import {planAdvertising} from "./adPlacement.js";

/**
 * BLOQUE 4 — Publicidad montada sobre las paredes reales de OSM.
 * Rótulos originales de demostración. NO transmite vídeos, ni reproduce
 * marcas ni anuncios actuales: la posición exacta de la pantalla no ha
 * sido comprobada individualmente mediante fotogrametría.
 *
 * Pantallas agrupadas por textura con InstancedMesh. Perfiles y bordes
 * instanciados para evitar cientos de draw calls por cartel.
 */

function signCanvas(entry){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=320;
 const ctx=canvas.getContext("2d",{alpha:false}),w=512,h=320;
 const accent=entry.color||"#69deef",style=entry.kind;
 const gradient=ctx.createLinearGradient(0,0,w,h);
 gradient.addColorStop(0,"#071023");gradient.addColorStop(.56,"#112947");gradient.addColorStop(1,"#20102b");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 // LED scan line texture and graphical framing
 for(let y=5;y<h;y+=5){
  ctx.fillStyle=y%10===5?"#ffffff0a":"#00000013";
  ctx.fillRect(0,y,w,1);
 }
 ctx.fillStyle=accent;ctx.fillRect(8,8,496,9);ctx.fillRect(8,302,496,10);
 ctx.fillStyle="#ffffff18";
 for(let i=0;i<6;i++){
  const px=(entry.seed+i*101)%w,py=(entry.seed+i*47)%h;
  ctx.beginPath();ctx.arc(px,py,18+i*11,0,Math.PI*2);ctx.fill();
 }
 ctx.save();
 ctx.strokeStyle=accent;ctx.lineWidth=5;
 ctx.shadowColor=accent;ctx.shadowBlur=20;
 ctx.strokeRect(8,8,496,304);
 ctx.restore();
 ctx.textBaseline="middle";ctx.textAlign="center";
 const vertical=style==="vertical";
 const primarySize=vertical?109:entry.label.length>8?67:entry.label.length>5?80:103;
 ctx.shadowColor=accent;ctx.shadowBlur=18;ctx.fillStyle="#f5fcff";
 ctx.font="900 "+primarySize+"px 'Noto Sans JP','Yu Gothic','Meiryo',sans-serif";
 ctx.fillText(entry.label,256,148,476);
 ctx.shadowBlur=8;ctx.fillStyle=accent;ctx.font="bold 36px system-ui,sans-serif";
 ctx.fillText(entry.sub,256,260,472);
 ctx.shadowBlur=0;
 ctx.fillStyle="#ffffff25";
 ctx.fillRect(27,285,458,2);
 return canvas;
}
function createBillboardMaterial(entry){
 const texture=new THREE.CanvasTexture(signCanvas(entry));
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 const material=new THREE.MeshStandardMaterial({
  map:texture,emissiveMap:texture,emissive:new THREE.Color(entry.color),
  emissiveIntensity:.53,roughness:.27,metalness:.12,
  toneMapped:false,side:THREE.DoubleSide
 });
 return {texture,material};
}
function writeInstance(mesh,i,entry,scale,y,depth){
 const normal=new THREE.Vector3(entry.nx,0,entry.nz).normalize();
 const position=new THREE.Vector3(entry.x+normal.x*depth,entry.y+y,entry.z+normal.z*depth);
 const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
 const dummy=new THREE.Object3D();dummy.position.copy(position);dummy.quaternion.copy(quaternion);
 dummy.scale.set(...scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
}
function addHardware(parent,entries,unitBox){
 const housingMat=new THREE.MeshStandardMaterial({color:0x192535,metalness:.7,roughness:.39});
 const housing=new THREE.InstancedMesh(unitBox,housingMat,entries.length);
 housing.name="B04 mural frames on real buildings";
 const edges=new THREE.InstancedMesh(unitBox,new THREE.MeshBasicMaterial({
  color:0xffffff,vertexColors:true,toneMapped:false
 }),entries.length*4);
 edges.name="B04 illuminated framing";
 const colors=new THREE.Color();
 let n=0;
 for(let i=0;i<entries.length;i++){
  const item=entries[i],w=item.width,h=item.height;
  writeInstance(housing,i,item,[w+.30,h+.30,item.depth],0,-.095);
  colors.set(item.color);
  // The 4 strips form a clean neon frame, not floating sprites.
  for(const [scale,dy,dx] of [
   [[w+.18,.09,.035],h/2+.10,0],
   [[w+.18,.09,.035],-h/2-.10,0],
   [[.08,h+.17,.035],0,-w/2-.08],
   [[.08,h+.17,.035],0,w/2+.08]
  ]){
   if(dx!==0){
    const normal=new THREE.Vector3(item.nx,0,item.nz).normalize();
    const tangent=new THREE.Vector3(normal.z,0,-normal.x);
    const projected={...item,x:item.x+tangent.x*dx,z:item.z+tangent.z*dx};
    writeInstance(edges,n,projected,scale,dy,.06);
   }else writeInstance(edges,n,item,scale,dy,.06);
   edges.setColorAt(n++,colors);
  }
 }
 housing.instanceMatrix.needsUpdate=true;
 edges.instanceMatrix.needsUpdate=true;
 if(edges.instanceColor)edges.instanceColor.needsUpdate=true;
 housing.frustumCulled=false;edges.frustumCulled=false;
 parent.add(housing,edges);
 return {housingMat,edgeMat:edges.material};
}
export function makeAdvertising3D(parent,snapshot,streetIndex,options={}){
 const mobile=typeof window!=="undefined"&&window.innerWidth<700;
 const limit=options.max??(mobile?70:170);
 const plan=planAdvertising(snapshot,streetIndex,{limit});
 const group=new THREE.Group();group.name="B04 · publicidad arquitectónica";parent.add(group);
 const entries=plan.entries;
 if(!entries.length)return {count:0,zone:plan.zone,
  update(){},dispose(){},breakdown:{anchors:0,local:0}};
 const groups=new Map(),materials=[],textures=[];
 const unitBox=new THREE.BoxGeometry(1,1,1),unitPlane=new THREE.PlaneGeometry(1,1);
 for(let i=0;i<entries.length;i++){
  const entry=entries[i];
  const key=[entry.label,entry.sub,entry.color,entry.kind].join("|");
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(entry);
 }
 for(const list of groups.values()){
  const {texture,material}=createBillboardMaterial(list[0]);
  textures.push(texture);materials.push(material);
  const mesh=new THREE.InstancedMesh(unitPlane,material,list.length);
  mesh.name="B04 building-attached LED billboards";
  mesh.frustumCulled=false;
  for(let i=0;i<list.length;i++){
   writeInstance(mesh,i,list[i],[list[i].width,list[i].height,1],0,.12);
  }
  mesh.instanceMatrix.needsUpdate=true;
  group.add(mesh);
 }
 const hardware=addHardware(group,entries,unitBox);
 let lastCycle=-1;
 return {
  count:entries.length,zone:plan.zone,
  breakdown:{anchors:plan.anchorCount,local:entries.length-plan.anchorCount},
  update(time){
   const cycle=Math.floor(time*20);
   if(lastCycle===cycle)return;
   lastCycle=cycle;
   for(let i=0;i<materials.length;i++){
    const pulse=Math.sin(time*(.7+i%4*.13)+i*.87);
    materials[i].emissiveIntensity=.45+Math.max(0,pulse)*.31;
   }
  },
  dispose(){
   for(const texture of textures)texture.dispose();
   for(const material of materials)material.dispose();
   hardware.housingMat.dispose();
   hardware.edgeMat.dispose();
   // Zone-local geometries are released by TokyoCity.dispose().
  }
 };
}
