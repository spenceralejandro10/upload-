import * as THREE from "three";
export const BLOCK=110, ROAD=18, HALF=12;
const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:1});
const asphalt=mat(0x293039), walk=mat(0x778089), stripe=mat(0xf1efdd),yellow=mat(0xbd9e52),signalOff=mat(0x24292d);
function plane(w,d,color,x,y,z,parent){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),color);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
export function makeRoads(parent,district){
 const extent=HALF*BLOCK*2+120;
 plane(extent,extent,mat(0x4a574c),0,-.03,0,parent);
 const sideGeo=new THREE.BoxGeometry(BLOCK-ROAD-2,.27,BLOCK-ROAD-2);
 const sidewalks=new THREE.InstancedMesh(sideGeo,walk,(HALF*2)*(HALF*2)),dummy=new THREE.Object3D();let count=0;
 for(let i=-HALF;i<HALF;i++)for(let j=-HALF;j<HALF;j++){
  dummy.position.set((i+.5)*BLOCK,.045,(j+.5)*BLOCK);dummy.updateMatrix();sidewalks.setMatrixAt(count++,dummy.matrix);
 }
 sidewalks.count=count;sidewalks.instanceMatrix.needsUpdate=true;parent.add(sidewalks);
 for(let i=-HALF;i<=HALF;i++){
  plane(ROAD,extent,asphalt,i*BLOCK,.115,0,parent);
  plane(extent,ROAD,asphalt,0,.119,i*BLOCK,parent);
 }
 // Instanced central dashed road markings.
 const lineGeo=new THREE.PlaneGeometry(.17,5);
 const lineMesh=new THREE.InstancedMesh(lineGeo,yellow,HALF*HALF*4*18);
 let l=0;
 for(let i=-HALF;i<=HALF;i++)for(let j=-HALF;j<HALF;j++){
  for(let k=0;k<8;k++){let z=(j+.08+k*.117)*BLOCK;dummy.position.set(i*BLOCK,.13,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.updateMatrix();lineMesh.setMatrixAt(l++,dummy.matrix);}
 }
 lineMesh.count=l;parent.add(lineMesh);
 const crossings=new THREE.Group();parent.add(crossings);
 function cross(x,z,direction){
  for(let i=-5;i<=5;i++){
   const w=direction===0?1.18:12.4, d=direction===0?12.4:1.18;
   plane(w,d,stripe,x+(direction===0?i*1.48:0),.141,z+(direction===0?0:i*1.48),crossings);
  }
 }
 for(let i=-6;i<=6;i+=3)for(let j=-6;j<=6;j+=3){
  cross(i*BLOCK,j*BLOCK+18,0);cross(i*BLOCK+18,j*BLOCK,1);
 }
 if(district.id==="shibuya"){
  // Shibuya's famous large diagonal scramble crossing.
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(a!==0||b!==0){
   const mesh=plane(1.38,18,stripe,a*4.2,.15,b*4.2,crossings);
   mesh.rotation.z=Math.atan2(b,a);
  }
  for(let i=-7;i<=7;i++){plane(1.35,17,stripe,i*1.78,.15,0,crossings);plane(17,1.35,stripe,0,.15,i*1.78,crossings);}
 }
 const lightBulbs=[];
 const postMat=mat(0x25343f),dark=mat(0x141e25),redOn=new THREE.MeshBasicMaterial({color:0xfb4648}),greenOn=new THREE.MeshBasicMaterial({color:0x37f6b1});
 for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)if((i+j)%2===0){
  const x=i*BLOCK+12,z=j*BLOCK+12;
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,5.9,6),postMat);post.position.y=3;group.add(post);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.8,2,.75),dark);head.position.set(0,5.7,0);group.add(head);
  const bulbs=[];
  for(let q=0;q<3;q++){const b=new THREE.Mesh(new THREE.SphereGeometry(.21,9,7),signalOff.clone());b.position.set(0,6.32-q*.59,.39);head.add(b);bulbs.push(b);}
  lightBulbs.push({bulbs,redOn,greenOn,off:signalOff});
 }
 // Sidewalk lamps highlight pedestrian areas.
 const lampMetal=mat(0x3b4651),lampGlow=new THREE.MeshBasicMaterial({color:0xe7f7dc});
 for(let i=-5;i<=5;i+=2)for(let j=-5;j<=5;j+=2){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,6.3,6),lampMetal);
  pole.position.set(i*BLOCK+16,3.15,j*BLOCK+16);parent.add(pole);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),lampGlow);
  cap.position.set(i*BLOCK+16,6.32,j*BLOCK+16);parent.add(cap);
 }
 return {
  update(t){const green=Math.sin(t*.58)>0;for(let i=0;i<lightBulbs.length;i++){const obj=lightBulbs[i],isGreen=(i%2===0)?green:!green;obj.bulbs[0].material=isGreen?signalOff:obj.redOn;obj.bulbs[1].material=signalOff;obj.bulbs[2].material=isGreen?obj.greenOn:signalOff;}}
 };
}