import * as THREE from "three";
import {BLOCK,ROAD,HALF} from "./roads.js";
function rng(seed){let n=seed>>>0;return ()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};}
function facadeTexture(seed){
 const rand=rng(seed),c=document.createElement("canvas");c.width=256;c.height=512;
 const ctx=c.getContext("2d");ctx.fillStyle="#9ba4b3";ctx.fillRect(0,0,256,512);
 for(let floor=0;floor<24;floor++)for(let col=0;col<9;col++){
  const x=col*28+4,y=floor*21+3,on=rand()>.84;
  ctx.fillStyle=on?"#dfd7a2":"#283d50";ctx.fillRect(x,y,19,15);
  ctx.fillStyle=on?"#8d9eaf":"#7891a4";ctx.fillRect(x+9,y,1,15);
  ctx.fillStyle="#6b8094";ctx.fillRect(x,y+15,19,2);
 }
 for(let x=0;x<256;x+=28){ctx.fillStyle="#cad2d6";ctx.fillRect(x,0,2,512);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const facadeMats=[
 new THREE.MeshStandardMaterial({map:facadeTexture(45),roughness:.78,metalness:.14}),
 new THREE.MeshStandardMaterial({map:facadeTexture(57),roughness:.62,metalness:.27}),
 new THREE.MeshStandardMaterial({map:facadeTexture(81),roughness:.88,metalness:.08})
];
const roofMat=new THREE.MeshStandardMaterial({color:0x626b73,roughness:1});
const geometry=new THREE.BoxGeometry(1,1,1);
const buildingMaterials=(m)=>[m,m,roofMat,roofMat,m,m];
const palettes=[
 [0xb0b6bf,0x8b9ca8,0xd9c5b1,0x87909e,0xb1b9b2],
 [0x788d9f,0xa4bbc5,0xb6b4c2,0x7997a6,0xbacbd5],
 [0xa3a69c,0xb4aca0,0xd3b7a1,0x788a8f,0x9297a6]
];
function heightFor(style,random,x,z){
 const downtown=Math.exp(-(x*x+z*z)/650000),f=random();
 if(style==="highrise")return 24+(downtown*125+33)*Math.pow(f,.7);
 if(style==="traditional")return 9+36*Math.pow(f,2);
 if(style==="neon")return 14+(downtown*95+18)*Math.pow(f,1.2);
 if(style==="commercial")return 16+(downtown*100+20)*Math.pow(f,1.1);
 return 12+(downtown*70+35)*Math.pow(f,1.6);
}
export function makeBuildings(parent,district){
 const rand=rng(district.seed),dummy=new THREE.Object3D();
 const meshes=[],bounds=[],spatial=new Map(),buckets=[[],[],[]];
 for(let i=-HALF;i<HALF;i++)for(let j=-HALF;j<HALF;j++){
  const edge=BLOCK-ROAD-6,div=rand()<.58?2:3,lot=edge/div;
  for(let x=0;x<div;x++)for(let z=0;z<div;z++){
   if(rand()<.075)continue;
   const w=lot*(.75+rand()*.17),d=lot*(.75+rand()*.17);
   const px=(i+.5)*BLOCK-edge/2+(x+.5)*lot,pz=(j+.5)*BLOCK-edge/2+(z+.5)*lot;
   const h=heightFor(district.style,rand,px,pz)*(rand()>.97?1.7:1);
   const colorId=Math.floor(rand()*3),palette=palettes[colorId];
   buckets[colorId].push({px,pz,w,d,h,color:palette[Math.floor(rand()*palette.length)]});
   const b={x:px,z:pz,halfX:w/2,halfZ:d/2,height:h};
   bounds.push(b);
   const key=i+","+j;if(!spatial.has(key))spatial.set(key,[]);spatial.get(key).push(b);
  }
 }
 for(let type=0;type<3;type++){
  const batch=buckets[type];
  const mesh=new THREE.InstancedMesh(geometry,buildingMaterials(facadeMats[type]),batch.length);
  mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
  const tint=new THREE.Color();
  for(let i=0;i<batch.length;i++){
   const b=batch[i];dummy.position.set(b.px,b.h/2+.17,b.pz);dummy.rotation.set(0,0,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);tint.setHex(b.color);mesh.setColorAt(i,tint);
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  parent.add(mesh);meshes.push(mesh);
 }
 return {
  count:bounds.length,
  nearby(x,z){
   const out=[],i=Math.floor(x/BLOCK),j=Math.floor(z/BLOCK);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const a=spatial.get((i+dx)+","+(j+dz));if(a)out.push(...a);
   }
   return out;
  },
  dispose(){for(const mesh of meshes)mesh.dispose();}
 };
}