import * as THREE from "three";
import {insideFootprint,distanceToFootprint} from "./geo/sceneData.js";
const skin=new THREE.MeshStandardMaterial({color:0xc48e6d}),jacket=new THREE.MeshStandardMaterial({color:0x176585}),pants=new THREE.MeshStandardMaterial({color:0x233447}),shoes=new THREE.MeshStandardMaterial({color:0xe4edf1}),hair=new THREE.MeshStandardMaterial({color:0x202329});
function part(group,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m;}
function arm(root,x){
 const pivot=new THREE.Group();pivot.position.set(x,1.64,0);root.add(pivot);
 part(pivot,new THREE.CapsuleGeometry(.112,.42,5,7),jacket,0,-.33,0);
 const elbow=new THREE.Group();elbow.position.y=-.56;pivot.add(elbow);
 part(elbow,new THREE.CapsuleGeometry(.085,.32,5,7),skin,0,-.26,0);
 return {pivot,elbow};
}
function leg(root,x){
 const pivot=new THREE.Group();pivot.position.set(x,.94,0);root.add(pivot);
 part(pivot,new THREE.CapsuleGeometry(.135,.41,5,7),pants,0,-.33,0);
 const knee=new THREE.Group();knee.position.y=-.58;pivot.add(knee);
 part(knee,new THREE.CapsuleGeometry(.11,.34,5,7),pants,0,-.28,0);
 part(knee,new THREE.BoxGeometry(.23,.15,.42),shoes,0,-.58,-.10);
 return {pivot,knee};
}
function avatar(){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 part(body,new THREE.CapsuleGeometry(.32,.48,8,12),jacket,0,1.42,0);
 part(body,new THREE.SphereGeometry(.245,18,12),skin,0,2.04,0);
 part(body,new THREE.SphereGeometry(.252,18,10,0,Math.PI*2,0,Math.PI*.36),hair,0,2.12,0);
 const aL=arm(body,-.39),aR=arm(body,.39),lL=leg(body,-.17),lR=leg(body,.17);
 return {root,body,aL,aR,lL,lR,animate(t,speed,flying,climbing){
  const intensity=Math.min(speed/10,1.5),gait=Math.sin(t*(speed>9?16:10))*intensity;
  lL.pivot.rotation.x=flying?-.23:climbing?.6:gait*.64;
  lR.pivot.rotation.x=flying?-.23:climbing?-.6:-gait*.64;
  lL.knee.rotation.x=flying?.22:Math.max(0,gait)*.9;
  lR.knee.rotation.x=flying?.22:Math.max(0,-gait)*.9;
  aL.pivot.rotation.x=flying?-1.1:climbing?-gait*.8:-gait*.49;
  aR.pivot.rotation.x=flying?-1.1:climbing?gait*.8:gait*.49;
  aL.pivot.rotation.z=flying?.86:.08;
  aR.pivot.rotation.z=flying?-.86:-.08;
  aL.elbow.rotation.x=climbing?-.7:Math.max(0,gait)*-.21;
  aR.elbow.rotation.x=climbing?-.7:Math.max(0,-gait)*-.21;
  body.rotation.x=flying?.5:climbing?-.08:Math.min(speed/180,.14);
  body.position.y=flying?0:Math.abs(Math.sin(t*speed))*.022;
 }};
}
export class Player{
 constructor(scene,camera,canvas,city){
  this.scene=scene;this.camera=camera;this.canvas=canvas;this.city=city;
  this.avatar=avatar();this.root=this.avatar.root;scene.add(this.root);
  this.keys={};this.enabled=false;this.flying=false;this.firstPerson=false;
  this.yaw=0;this.pitch=.1;this.vx=0;this.vz=0;this.vy=0;
  this.jumpCount=0;this.clock=0;this.walkSpeed=0;this.mouseDown=false;this.grounded=true;
  window.addEventListener("keydown",e=>{
   if(!this.enabled||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
   this.keys[e.code]=true;
   if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
   if(e.repeat)return;
   if(e.code==="KeyF"){this.flying=!this.flying;this.vy=0;}
   if(e.code==="KeyV")this.firstPerson=!this.firstPerson;
   if(e.code==="KeyR")this.respawn();
   if(e.code==="Space"&&!this.flying&&!this.keys.KeyE&&this.jumpCount<2){
    this.vy=this.jumpCount===0?10.8:10;this.jumpCount++;this.grounded=false;
   }
  });
  window.addEventListener("keyup",e=>{this.keys[e.code]=false;});
  window.addEventListener("blur",()=>{this.keys={};});
  canvas.addEventListener("pointerdown",()=>{if(!this.enabled)return;this.mouseDown=true;if(document.pointerLockElement!==canvas&&canvas.requestPointerLock)canvas.requestPointerLock();});
  window.addEventListener("pointerup",()=>{this.mouseDown=false;});
  document.addEventListener("mousemove",e=>{
   if(!this.enabled)return;
   if(document.pointerLockElement===canvas||this.mouseDown){
    this.yaw-=e.movementX*.0025;this.pitch=THREE.MathUtils.clamp(this.pitch-e.movementY*.002,-1.1,1.1);
   }
  });
 }
 respawn(){
  const spawn=this.city?.spawn||{x:0,y:.15,z:0};
  this.root.position.set(spawn.x,spawn.y,spawn.z);this.root.rotation.set(0,0,0);
  this.vx=0;this.vz=0;this.vy=0;this.flying=false;this.jumpCount=0;this.grounded=true;
 }
 blocker(x,z,y){
  for(const b of this.city.nearby(x,z)){
   if(insideFootprint(b,x,z,.46)&&y<b.height+.1&&y+1.65>b.base)return b;
  }
  return null;
 }
 climbTarget(x,z,y){
  for(const b of this.city.nearby(x,z)){
   if(distanceToFootprint(x,z,b.rings)<1.8&&y<b.height+.7&&y+1.7>b.base)return b;
  }
  return null;
 }
 update(dt){
  if(!this.enabled)return;
  this.clock+=dt;
  const k=this.keys,f=Number(!!k.KeyW)-Number(!!k.KeyS),s=Number(!!k.KeyD)-Number(!!k.KeyA),len=Math.hypot(f,s)||1;
  const wx=(-f*Math.sin(this.yaw)+s*Math.cos(this.yaw))/len,wz=(-f*Math.cos(this.yaw)-s*Math.sin(this.yaw))/len;
  const sprint=!!(k.ShiftLeft||k.ShiftRight),turbo=sprint&&(k.AltLeft||k.AltRight);
  let maxSpeed=turbo?34:sprint?17:8;
  if(this.flying)maxSpeed*=1.4;
  const blend=Math.min(1,dt*(this.flying?4:this.grounded?9:4.5));
  this.vx+=(wx*maxSpeed-this.vx)*blend;this.vz+=(wz*maxSpeed-this.vz)*blend;
  const pos=this.root.position,oldY=pos.y;
  const climbing=!this.flying&&!!k.KeyE&&!!this.climbTarget(pos.x,pos.z,pos.y);
  if(this.flying){
   this.vy=0;pos.y+=((k.Space?1:0)-(k.ControlLeft||k.ControlRight?1:0))*dt*(sprint?22:12);
  }else if(climbing){
   this.vy=0;pos.y+=dt*(sprint?11:6.5);
  }else{
   this.vy-=25*dt;pos.y+=this.vy*dt;
  }
  let nx=pos.x+this.vx*dt,nz=pos.z+this.vz*dt;
  if(this.blocker(nx,pos.z,pos.y))nx=pos.x;
  if(this.blocker(nx,nz,pos.y))nz=pos.z;
  pos.x=THREE.MathUtils.clamp(nx,-1250,1250);
  pos.z=THREE.MathUtils.clamp(nz,-1250,1250);
  if(!this.flying&&!climbing){
   let floor=this.city.floorHeight?.(pos.x,pos.z)??0;
   for(const b of this.city.nearby(pos.x,pos.z)){
    if(insideFootprint(b,pos.x,pos.z)&&oldY>=b.height-.4)floor=Math.max(floor,b.height+.16);
   }
   if(pos.y<=floor){pos.y=floor;this.vy=0;this.jumpCount=0;this.grounded=true;}
   else this.grounded=false;
  }
  if(this.flying){pos.y=Math.max(1,pos.y);this.grounded=false;}
  if(climbing){this.grounded=false;this.jumpCount=1;}
  if((f||s)&&Math.hypot(this.vx,this.vz)>1){
   const wanted=Math.atan2(-this.vx,-this.vz);
   const delta=Math.atan2(Math.sin(wanted-this.root.rotation.y),Math.cos(wanted-this.root.rotation.y));
   this.root.rotation.y+=delta*Math.min(1,dt*13);
  }
  this.walkSpeed=Math.hypot(this.vx,this.vz);
  this.avatar.animate(this.clock,this.walkSpeed,this.flying,climbing);
  this.avatar.root.visible=!this.firstPerson;
  const cp=this.camera.position,look=new THREE.Vector3(pos.x,pos.y+1.72,pos.z);
  const dist=this.firstPerson?0.02:6.8,height=this.firstPerson?0:2.75;
  const target=new THREE.Vector3(pos.x+Math.sin(this.yaw)*dist,pos.y+1.72+height+Math.sin(this.pitch)*3,pos.z+Math.cos(this.yaw)*dist);
  cp.lerp(target,Math.min(1,dt*14));
  look.add(new THREE.Vector3(-Math.sin(this.yaw)*8,Math.sin(this.pitch)*7,-Math.cos(this.yaw)*8));
  this.camera.lookAt(look);
  return {speed:Math.round(this.walkSpeed*3.6),mode:this.flying?"VOLANDO":climbing?"ESCALANDO":turbo?"TURBO":sprint?"CORRIENDO":"CAMINANDO"};
 }
}