import * as THREE from "three";
function material(color,metalness=0){return new THREE.MeshStandardMaterial({color,roughness:.67,metalness});}
const red=material(0xc84e39),ivory=material(0xe0e2d8),steel=material(0x737f89,.5),wood=material(0x654137),dark=material(0x273544);
function box(group,w,h,d,x,y,z,mat){
 const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 a.position.set(x,y,z);group.add(a);return a;
}
function rod(group,start,end,r,mat){
 const len=start.distanceTo(end),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,7),mat);
 mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());group.add(mesh);return mesh;
}
function sign(text,width=18,height=6,bg="#162a52",fg="#ffffff"){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=160;
 const ctx=canvas.getContext("2d");ctx.fillStyle=bg;ctx.fillRect(0,0,512,160);
 ctx.strokeStyle="#ffffff40";ctx.lineWidth=8;ctx.strokeRect(5,5,502,150);
 ctx.fillStyle=fg;ctx.font="bold 72px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,256,85,485);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
}
function tower(group){
 const base=new THREE.Group();base.position.set(63,.2,-161);group.add(base);
 const tops=[[0,0,30],[0,32,18],[0,90,11],[0,165,5]];
 for(let level=0;level<3;level++){
  const [x1,y1,w1]=tops[level],[x2,y2,w2]=tops[level+1],mat=level%2?ivory:red;
  for(const x of [-1,1])for(const z of [-1,1]){
   const a=new THREE.Vector3(x*w1/2,y1,z*w1/2),b=new THREE.Vector3(x*w2/2,y2,z*w2/2);
   rod(base,a,b,level===0?.95:.6,mat);
  }
  const y=(y1+y2)/2,w=(w1+w2)/2;
  for(const side of [-1,1]){rod(base,new THREE.Vector3(-w/2,y,side*w/2),new THREE.Vector3(w/2,y,side*w/2),.35,mat);rod(base,new THREE.Vector3(side*w/2,y,-w/2),new THREE.Vector3(side*w/2,y,w/2),.35,mat);}
  box(base,w2,2,w2,0,y2,0,mat);
 }
 box(base,21,7,21,0,110,0,steel);box(base,15,6,15,0,120,0,ivory);
 rod(base,new THREE.Vector3(0,165,0),new THREE.Vector3(0,233,0),1.1,red);
 rod(base,new THREE.Vector3(0,233,0),new THREE.Vector3(0,261,0),.32,ivory);
 return base;
}
function skytree(group){
 const base=new THREE.Group();base.position.set(80,.2,-210);group.add(base);
 const white=material(0xb9d7e5,.35),sky=material(0x589bb0,.3);
 function cylinder(r1,r2,height,y,mat){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,height,12),mat);mesh.position.y=y;base.add(mesh);
 }
 cylinder(8,16,150,75,white);cylinder(6,8,110,205,white);cylinder(11,11,10,160,sky);
 cylinder(12,10,10,265,sky);cylinder(2,3,72,307,white);
 for(let y=35;y<285;y+=32){const ring=new THREE.Mesh(new THREE.TorusGeometry(y<150?14-y*.041:7.8,.4,6,16),sky);ring.rotation.x=Math.PI/2;ring.position.y=y;base.add(ring);}
 return base;
}
function temple(group){
 const g=new THREE.Group();g.position.set(76,.2,-140);group.add(g);
 box(g,35,2,23,0,.5,0,material(0x9d9180));
 for(let x of [-14,14])for(let z of [-9,9])box(g,1.8,12,1.8,x,7,z,red);
 box(g,34,4,22,0,13,0,wood);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(25,11,4),dark);roof.rotation.y=Math.PI/4;roof.scale.z=.8;roof.position.y=20;g.add(roof);
 const roof2=new THREE.Mesh(new THREE.ConeGeometry(21,7,4),dark);roof2.rotation.y=Math.PI/4;roof2.position.y=27;roof2.scale.z=.8;g.add(roof2);
 const gate=new THREE.Group();gate.position.z=35;g.add(gate);
 for(let x of [-9,9])box(gate,2.5,17,2.5,x,8,0,red);
 box(gate,23,3,4,0,16,0,red);box(gate,24,3,5,0,19.5,0,dark);
 const lantern=new THREE.Mesh(new THREE.SphereGeometry(4.5,12,10),red);lantern.scale.y=1.8;lantern.position.y=9;gate.add(lantern);
 return g;
}
function metropolitan(group){
 const g=new THREE.Group();g.position.set(68,.1,-177);group.add(g);
 const glass=material(0x7897b1,.55),concrete=material(0x9babb7);
 box(g,75,80,35,0,40,0,concrete);
 box(g,29,130,33,-21,145,0,glass);
 box(g,29,130,33,21,145,0,glass);
 for(let x of [-21,21]){box(g,27,8,33,x,211,0,concrete);box(g,2,25,2,x,227,0,steel);}
 return g;
}
export function makeLandmark(group,district){
 let model;
 if(district.id==="minato")model=tower(group);
 else if(district.id==="sumida")model=skytree(group);
 else if(district.id==="asakusa")model=temple(group);
 else if(district.id==="shinjuku")model=metropolitan(group);
 else {
  model=new THREE.Group();group.add(model);
  model.position.set(70,.2,-130);
  if(district.id==="chiyoda"){
   box(model,70,8,48,0,4,0,wood);
   const roof=new THREE.Mesh(new THREE.ConeGeometry(44,12,4),dark);roof.rotation.y=Math.PI/4;roof.position.y=14;model.add(roof);
  }else{
   box(model,45,45,33,0,22,0,material(district.id==="akihabara"?0x445a71:0x768998));
   for(let i=0;i<5;i++){
    const s=sign(district.id==="akihabara"?(i%2?"アニメ":"秋葉原"):(i%2?"TOKYO":"渋谷"),14,5,i%2?"#a91b80":"#1637ab");
    s.position.set(-16+i*8,8+i*6,17);model.add(s);
   }
  }
 }
 const title=sign(district.subtitle.toUpperCase(),32,5,"#12364c","#e6ffff");
 title.position.set(0,25,22);model.add(title);
 return model;
}