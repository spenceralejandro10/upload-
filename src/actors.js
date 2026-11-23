import * as THREE from "three";
import {BLOCK} from "./roads.js";
function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const shared={
 skin:new THREE.MeshStandardMaterial({color:0xb8896f}),
 dark:new THREE.MeshStandardMaterial({color:0x263344}),
 glass:new THREE.MeshStandardMaterial({color:0x8eb1c5,metalness:.4,roughness:.25}),
 wheel:new THREE.MeshStandardMaterial({color:0x161d25,roughness:.95})
};
const outfits=[0x233f61,0x6e4046,0x436a60,0x776c5b,0xa9afb9].map(c=>new THREE.MeshStandardMaterial({color:c}));
const carsMat=[0x151b23,0xd3e0dd,0x193d51,0x314f40,0x9495a1,0x6e2925].map(c=>new THREE.MeshStandardMaterial({color:c,metalness:.35,roughness:.48}));
function part(g,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;}
function human(r){
 const g=new THREE.Group(),skin=shared.skin,clothes=outfits[Math.floor(r()*outfits.length)];
 part(g,new THREE.SphereGeometry(.16,8,6),skin,0,1.67,0);
 part(g,new THREE.BoxGeometry(.38,.55,.24),clothes,0,1.18,0);
 const armGeo=new THREE.BoxGeometry(.1,.5,.1);
 const left=part(g,armGeo,skin,-.27,1.19,0),right=part(g,armGeo,skin,.27,1.19,0);
 const legGeo=new THREE.BoxGeometry(.14,.74,.15);
 const leg1=part(g,legGeo,shared.dark,-.105,.49,0),leg2=part(g,legGeo,shared.dark,.105,.49,0);
 return {g,left,right,leg1,leg2};
}
function car(r){
 const group=new THREE.Group(),material=carsMat[Math.floor(r()*carsMat.length)];
 part(group,new THREE.BoxGeometry(2.18,.85,4.6),material,0,.65,0);
 part(group,new THREE.BoxGeometry(1.78,.72,2.35),shared.glass,0,1.37,-.15);
 for(const x of [-1.04,1.04])for(const z of [-1.44,1.44]){
  const wheel=part(group,new THREE.CylinderGeometry(.36,.36,.23,10),shared.wheel,x,.37,z);wheel.rotation.z=Math.PI/2;
 }
 part(group,new THREE.BoxGeometry(1.4,.12,.13),new THREE.MeshBasicMaterial({color:0xece6c4}),0,.73,-2.34);
 return group;
}
export function makeActors(group,district){
 const r=rng(district.seed+33),people=[],vehicles=[];
 const peopleN=window.innerWidth<700?38:95,carN=window.innerWidth<700?32:70;
 for(let i=0;i<peopleN;i++){
  const person=human(r),axis=r()<.5?0:1,index=Math.floor(r()*13)-6,dir=r()<.5?-1:1;
  const longitudinal=(r()-.5)*BLOCK*13,offset=13+(r()-.5)*4;
  person.g.position.set(axis===0?index*BLOCK+offset:longitudinal,0,axis===0?longitudinal:index*BLOCK+offset);
  person.g.rotation.y=axis===0?(dir>0?0:Math.PI):(dir>0?-Math.PI/2:Math.PI/2);
  group.add(person.g);
  people.push({...person,axis,index,dir,offset,speed:.85+r()*1.2,phase:r()*7});
 }
 for(let i=0;i<carN;i++){
  const mesh=car(r),axis=r()<.5?0:1,index=Math.floor(r()*15)-7,dir=r()<.5?-1:1;
  const progress=(r()-.5)*BLOCK*16,offset=dir>0?-4.4:4.4;
  mesh.position.set(axis===0?index*BLOCK+offset:progress,.1,axis===0?progress:index*BLOCK+offset);
  mesh.rotation.y=axis===0?(dir>0?Math.PI:0):(dir>0?-Math.PI/2:Math.PI/2);
  group.add(mesh);
  vehicles.push({mesh,axis,index,dir,speed:6+r()*9,progress,offset});
 }
 return {
  update(dt,time){
   for(const p of people){
    const amount=p.speed*dt*p.dir;
    if(p.axis===0){p.g.position.z+=amount;if(Math.abs(p.g.position.z)>880)p.g.position.z=-Math.sign(p.g.position.z)*880;}
    else{p.g.position.x+=amount;if(Math.abs(p.g.position.x)>880)p.g.position.x=-Math.sign(p.g.position.x)*880;}
    const gait=Math.sin(time*8*p.speed+p.phase)*.46;
    p.leg1.rotation.x=gait;p.leg2.rotation.x=-gait;p.left.rotation.x=-gait;p.right.rotation.x=gait;
   }
   for(const v of vehicles){
    const position=v.progress,mod=Math.abs(((position+BLOCK*20)%BLOCK+BLOCK)%BLOCK-BLOCK/2);
    const stop=mod>BLOCK/2-15&&Math.sin(time*.58)*(v.axis===0?1:-1)<-.2;
    v.progress+=dt*v.speed*v.dir*(stop?.04:1);
    if(v.progress>930)v.progress=-930;if(v.progress< -930)v.progress=930;
    if(v.axis===0)v.mesh.position.z=v.progress;else v.mesh.position.x=v.progress;
   }
  }
 };
}