import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import {FACADES,facadeProfile} from "./facadeStyles.js";
import {insideFootprint} from "./sceneData.js";

/**
 * BLOQUE 3 · Fachadas procedurales sobre HUELLAS OSM REALES.
 * No altera puntos, alturas ni colisiones. Los detalles (ventanas,
 * escaparates, colores y equipos de azotea) son aproximaciones visuales
 * y no corresponden necesariamente a materiales reales de cada edificio.
 *
 * Optimización: mallas acumuladas por estilo, UVs en metros, mapas
 * de ventanas Canvas reutilizados; no 1 objeto 3D por ventana.
 */
const LOOKS={
 house:      {wall:"#bdb5a8",trim:"#786f65",glass:"#394c5a",frame:"#e2ddd2"},
 apartment:  {wall:"#c0c3bf",trim:"#717d83",glass:"#445f70",frame:"#cdd3d2"},
 shop:       {wall:"#a6b3b8",trim:"#546a79",glass:"#436581",frame:"#dae3e4"},
 mixed:      {wall:"#a9b5b7",trim:"#516874",glass:"#45677a",frame:"#dce4e6"},
 office:     {wall:"#a8b5bd",trim:"#536c7b",glass:"#426d91",frame:"#dce9eb"},
 tower:      {wall:"#849aab",trim:"#3f617e",glass:"#356b92",frame:"#a5d6e2"},
 hotel:      {wall:"#aeb4b1",trim:"#5a6d78",glass:"#426078",frame:"#c9d3d4"},
 industrial: {wall:"#9aa4a5",trim:"#687880",glass:"#465764",frame:"#b6c2c0"},
 civic:      {wall:"#c4c3ba",trim:"#83877f",glass:"#4a6e86",frame:"#e5e2dc"}
};
const TINTS=[
 [1,1,1],[.93,.96,1],[1,.97,.92],[.92,.94,.96],[1,.95,.96]
];
const ROOF_PALETTE=[0x7b888e,0x656e72,0x9b9690,0x737b78,0x8b8781];
const SIGN_TEXT=[
 ["ラーメン","RAMEN","#e8584a"],["カフェ","CAFE","#52c4df"],["書店","BOOKS","#f1ab43"],
 ["薬局","PHARMACY","#42caa6"],["居酒屋","IZAKAYA","#db6eac"],["食堂","DINING","#f4be51"],
 ["美容室","SALON","#c68eed"],["喫茶店","COFFEE","#e8b07c"],["雑貨","SHOP","#7de4d1"],
 ["レストラン","RESTAURANT","#77b9fa"]
];
function canvasTexture(draw,width=256,height=256){
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d",{alpha:false});
 draw(ctx,width,height);
 const texture=new THREE.CanvasTexture(canvas);
 texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 return texture;
}
function windowTile(style,variant){
 const look=LOOKS[style],styleIndex=variant%3;
 return canvasTexture((c,w,h)=>{
  c.fillStyle=look.wall;c.fillRect(0,0,w,h);
  c.fillStyle=look.trim;c.fillRect(0,0,w,9+styleIndex*2);
  c.fillStyle="#ffffff20";c.fillRect(0,h-12,w,5);
  if(style==="industrial"){
   c.fillStyle="#798388";for(let x=0;x<w;x+=22)c.fillRect(x,0,2,h);
   c.fillStyle=look.glass;c.fillRect(19,55,218,72);
   c.fillStyle="#dee9ee50";for(let x=35;x<225;x+=46)c.fillRect(x,57,2,69);
   c.fillStyle="#384853";c.fillRect(25,145,206,7);
   return;
  }
  if(style==="house"){
   c.fillStyle="#a2a5a3";c.fillRect(5,18,246,224);
   c.fillStyle=look.wall;c.fillRect(13,25,230,217);
  }
  const tall=(style==="tower"||style==="office");
  const x=style==="tower"?12:style==="office"?18:style==="shop"?29:43;
  const y=style==="tower"?13:style==="office"?27:style==="house"?52:40;
  const winW=256-x*2,winH=style==="hotel"?153:style==="house"?128:tall?214:163;
  const grad=c.createLinearGradient(x,y,x+winW,y+winH);
  grad.addColorStop(0,"#152c43");grad.addColorStop(.35,look.glass);
  grad.addColorStop(.55,styleIndex===0?"#8bb5ca":"#7395a7");grad.addColorStop(1,"#1b3a50");
  c.fillStyle=look.trim;c.fillRect(x-7,y-7,winW+14,winH+14);
  c.fillStyle=grad;c.fillRect(x,y,winW,winH);
  // Glass reflections, window frames, balcony railings and shadows.
  c.fillStyle="#e7f5ff25";c.beginPath();c.moveTo(x+11,y);c.lineTo(x+55,y);c.lineTo(x+16,y+winH);c.lineTo(x,y+winH);c.fill();
  c.fillStyle=look.frame;
  const mullions=tall?(style==="tower"?3:2):style==="hotel"?1:2;
  for(let m=1;m<mullions;m++)c.fillRect(x+Math.round(winW*m/mullions)-3,y,5,winH);
  if(style==="apartment"||style==="house"){
   c.fillStyle="#47565b";c.fillRect(0,y+winH-20,256,6);
   for(let q=0;q<=256;q+=23)c.fillRect(q,y+winH-18,3,43);
   c.fillStyle="#dae0dd";c.fillRect(0,y+winH+24,256,6);
   if(style==="apartment"){
    c.fillStyle="#d1d3cd";c.fillRect(193,y+winH+33,52,9);
    c.fillStyle="#6a7070";c.fillRect(211,y+winH+34,20,25);
   }
  }
  if(style==="shop"||style==="mixed"){
   c.fillStyle="#728790";c.fillRect(0,224,256,12);
   c.fillStyle="#c5d2d5";for(let q=0;q<256;q+=64)c.fillRect(q,234,3,22);
  }
  if(style==="office"||style==="tower"){
   c.fillStyle=look.frame;c.fillRect(0,230,256,7);
   c.fillStyle="#d8e6ef30";c.fillRect(x+11,y+12,winW-28,4);
  }
  if(style==="civic"){
   c.fillStyle=look.wall;c.fillRect(110,y,13,winH);
  }
  if(variant%3===1){
   c.fillStyle="#f5ddab35";c.fillRect(x+9,y+10,Math.max(3,winW/3),winH-20);
  }
  c.fillStyle="#0c1b262b";c.fillRect(x,y+winH-6,winW,7);
 },256,256);
}
function storefrontTile(variant){
 return canvasTexture((c,w,h)=>{
  const palette=["#203e58","#344e64","#4b5065"][variant%3];
  c.fillStyle="#aebac0";c.fillRect(0,0,w,h);
  c.fillStyle=palette;c.fillRect(9,27,238,208);
  c.fillStyle="#88aebd";c.fillRect(18,39,220,186);
  c.fillStyle="#274459";c.fillRect(120,38,8,195);
  c.fillRect(16,215,224,10);
  c.fillStyle="#f3f5e8";c.fillRect(0,0,w,27);
  c.fillStyle="#273441";c.fillRect(0,27,256,9);
  c.fillStyle="#dcf5fa40";c.beginPath();c.moveTo(25,40);c.lineTo(76,40);c.lineTo(45,216);c.lineTo(23,216);c.fill();
  c.fillStyle="#ced7d9";c.fillRect(5,232,246,16);
  c.fillStyle=variant%2?"#db7467":"#61b1bb";c.fillRect(7,9,242,10);
 },256,256);
}
function signTexture([word,english,accent]){
 return canvasTexture((c,w,h)=>{
  c.fillStyle="#08182d";c.fillRect(0,0,w,h);
  c.fillStyle=accent;c.fillRect(5,5,w-10,7);c.fillRect(5,h-12,w-10,7);
  c.strokeStyle=accent;c.lineWidth=5;c.strokeRect(7,7,w-14,h-14);
  c.textAlign="center";c.textBaseline="middle";
  c.fillStyle="#f9ffff";c.font="bold 119px 'Noto Sans JP',sans-serif";
  c.fillText(word,w/2,108,w-34);
  c.font="bold 31px sans-serif";c.fillStyle=accent;
  c.fillText(english,w/2,206,w-35);
 },512,256);
}
function emptyBucket(){return {xyz:[],uv:[],colors:[],count:0};}
function appendQuad(bucket,a,b,y0,y1,u0,u1,v1,tint){
 const out=bucket.xyz,uv=bucket.uv,col=bucket.colors;
 const p0=[a[0],y0,a[1]],p1=[b[0],y0,b[1]];
 const p2=[a[0],y1,a[1]],p3=[b[0],y1,b[1]];
 const points=[p0,p1,p2,p1,p3,p2],coords=[[u0,0],[u1,0],[u0,v1],[u1,0],[u1,v1],[u0,v1]];
 for(let i=0;i<6;i++){
  out.push(...points[i]);uv.push(...coords[i]);col.push(...tint);
 }
 bucket.count+=2;
}
function facadeGeometry(bucket){
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(bucket.xyz,3));
 g.setAttribute("uv",new THREE.Float32BufferAttribute(bucket.uv,2));
 g.setAttribute("color",new THREE.Float32BufferAttribute(bucket.colors,3));
 g.computeVertexNormals();return g;
}
function roofShape(rings){
 if(!rings?.length)return null;
 const shapes=rings.map(r=>{
  const points=r.slice(0,-1).map(([x,z])=>new THREE.Vector2(x,-z));
  return points.filter((p,i)=>i===0||p.distanceToSquared(points[i-1])>.09);
 });
 if(shapes[0].length<3)return null;
 const exterior=shapes[0];
 if(!THREE.ShapeUtils.isClockWise(exterior))exterior.reverse();
 const out=new THREE.Shape(exterior);
 for(const points of shapes.slice(1)){
  if(points.length<3)continue;
  if(THREE.ShapeUtils.isClockWise(points))points.reverse();
  out.holes.push(new THREE.Path(points));
 }
 return out;
}
function addRoofGroup(parent,items,material){
 if(!items.length)return;
 const combined=items.length===1?items[0]:mergeGeometries(items,false);
 if(combined){
  const mesh=new THREE.Mesh(combined,material);mesh.name="B03 OSM rooftops";mesh.frustumCulled=false;parent.add(mesh);
 }
 if(items.length>1)for(const geo of items)geo.dispose();
}
function ringArea(ring){
 let sum=0;
 for(let i=1;i<ring.length;i++)sum+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];
 return sum/2;
}
function streetFront(building,streetIndex){
 const ring=building.rings?.[0]||[];
 if(ring.length<2)return null;
 const sign=ringArea(ring)>=0?1:-1;
 let best=null,score=Infinity;
 for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<2.5)continue;
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const nx=sign*dz/len,nz=-sign*dx/len;
  const road=streetIndex?.nearest(mid[0],mid[1],p=>!p.tunnel&&!p.bridge&&p.lanes>0);
  if(!road||road.distance>21)continue;
  const facesRoad=(road.x-mid[0])*nx+(road.z-mid[1])*nz>0;
  const cost=road.distance+(facesRoad?0:50);
  if(cost<score){best={mid,nx,nz,len,road,facesRoad};score=cost;}
 }
 return best?.facesRoad?best:null;
}
function roofUtilities(parent,items){
 if(!items.length)return null;
 const geo=new THREE.BoxGeometry(1,1,1),mat=new THREE.MeshStandardMaterial({color:0x6d7d81,roughness:.8,metalness:.16});
 const instances=new THREE.InstancedMesh(geo,mat,items.length);
 instances.name="B03 illustrative rooftop HVAC";
 const dummy=new THREE.Object3D();let n=0;
 for(const item of items){
  dummy.position.set(item.x,item.y+.48,item.z);
  dummy.rotation.y=(item.seed%16)*Math.PI/8;
  dummy.scale.set(item.width,.96,item.depth);dummy.updateMatrix();
  instances.setMatrixAt(n++,dummy.matrix);
 }
 instances.instanceMatrix.needsUpdate=true;instances.frustumCulled=false;parent.add(instances);
 return {geo,mat};
}
export function makeFacadeBuildings(parent,buildings,options={}){
 const mobile=typeof window!=="undefined"&&window.innerWidth<700;
 const max=options.max??(mobile?1100:2850);
 const sorted=buildings.slice().sort((a,b)=>(a.x*a.x+a.z*a.z)-(b.x*b.x+b.z*b.z));
 const buckets=new Map(),roofGroups=Array.from({length:ROOF_PALETTE.length},()=>[]);
 const hvac=[],signs=Array.from({length:SIGN_TEXT.length},()=>[]);
 const sharedMeshes=[],textures=[],materials=[],roofMaterials=[];
 const styleCounts=Object.fromEntries(Object.keys(FACADES).map(style=>[style,0]));
 let count=0,commercial=0,rooftops=0;
 for(const b of sorted){
  if(count>=max)break;
  const profile=facadeProfile(b),h=Math.max(2.2,b.height-b.base);
  if(!b.rings?.[0]||b.rings[0].length<4||h<2)continue;
  const shape=roofShape(b.rings);if(!shape)continue;
  const baseY=b.base+.09,topY=baseY+h,tint=TINTS[profile.variant];
  const type=profile.style+":"+profile.seed%3;
  if(!buckets.has(type))buckets.set(type,emptyBucket());
  const body=buckets.get(type);
  // Merge geometry into few style buckets, but keep each ORIGINAL GIS edge.
  for(const ring of b.rings){
   let position=0;
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],p=ring[i],dx=p[0]-a[0],dz=p[1]-a[1],len=Math.hypot(dx,dz);
    if(len<.3)continue;
    const u0=position/profile.bay,u1=(position+len)/profile.bay;
    appendQuad(body,a,p,baseY,topY,u0,u1,h/profile.floor,tint);
    if(profile.commercial&&b.base<2&&h>4){
     const shopKey="store:"+profile.seed%3;
     if(!buckets.has(shopKey))buckets.set(shopKey,emptyBucket());
     // Street-level glass / storefront: identical footprint and facade plane.
     appendQuad(buckets.get(shopKey),a,p,baseY-.004,Math.min(baseY+3.2,topY-.15),
       u0,u1,1,[1,1,1]);
    }
    position+=len;
   }
  }
  const roof=new THREE.ShapeGeometry(shape,1);
  roof.rotateX(-Math.PI/2);roof.translate(0,topY+.015,0);
  roofGroups[profile.seed%ROOF_PALETTE.length].push(roof);
  // Lightweight air-handling boxes for a fraction of suitable large roofs.
  if(profile.rooftop&&h>22&&b.halfX>5&&b.halfZ>5&&profile.seed%5===0){
   const x=b.x+(profile.seed%3-1)*1.5,z=b.z+((profile.seed>>3)%3-1)*1.5;
   if(insideFootprint(b,x,z,-0))hvac.push({x,z,y:topY,seed:profile.seed,width:Math.min(3.6,b.halfX/2),depth:Math.min(3.4,b.halfZ/2)});
  }
  if(profile.commercial&&b.base<2&&h>=7&&profile.seed%4===0&&commercial<110&&Math.abs(b.x)<500&&Math.abs(b.z)<500){
   const front=streetFront(b,options.streetIndex);
   if(front){
    const idx=profile.seed%SIGN_TEXT.length;
    signs[idx].push({front,top:Math.min(topY-1,baseY+3.2),seed:profile.seed});
    commercial++;
   }
  }
  styleCounts[profile.style]++;count++;
 }
 for(const [name,bucket] of buckets){
  if(!bucket.xyz.length)continue;
  const [style,suffix]=name.split(":");
  const texture=style==="store"?storefrontTile(+suffix):windowTile(style,+suffix);
  textures.push(texture);
  const material=new THREE.MeshStandardMaterial({
   map:texture,color:0xffffff,vertexColors:true,roughness:style==="tower"?.42:.74,
   metalness:style==="tower"?.37:.13,side:THREE.DoubleSide
  });
  materials.push(material);
  const mesh=new THREE.Mesh(facadeGeometry(bucket),material);
  mesh.name="B03 OSM facade "+name;
  mesh.frustumCulled=false;mesh.receiveShadow=true;parent.add(mesh);sharedMeshes.push(mesh);
 }
 for(let i=0;i<roofGroups.length;i++){
  const mat=new THREE.MeshStandardMaterial({color:ROOF_PALETTE[i],roughness:.85});
  roofMaterials.push(mat);
  addRoofGroup(parent,roofGroups[i],mat);
 }
 const vent=roofUtilities(parent,hvac);rooftops=hvac.length;
 // Generic illustrative signage (not companies or actual storefront records).
 const signGeometry=new THREE.PlaneGeometry(1,1);
 const signMaterials=[];
 const dummy=new THREE.Object3D();
 for(let k=0;k<signs.length;k++){
  const instances=signs[k];if(!instances.length)continue;
  const texture=signTexture(SIGN_TEXT[k]);
  textures.push(texture);
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:false,toneMapped:false});
  signMaterials.push(material);
  const mesh=new THREE.InstancedMesh(signGeometry,material,instances.length);
  mesh.name="B03 illustrative Japanese storefront signage";
  for(let j=0;j<instances.length;j++){
   const item=instances[j],f=item.front;
   dummy.position.set(f.mid[0]+f.nx*.17,item.top,f.mid[1]+f.nz*.17);
   dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(f.nx,0,f.nz));
   dummy.scale.set(Math.min(6.6,f.len*.74),1.45,1);
   dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.frustumCulled=false;
  parent.add(mesh);
 }
 // Materials and textures belong to this zone and are released on change.
 return {
  count,styleCounts,signCount:commercial,rooftopDetails:rooftops,
  dispose(){
   for(const tex of textures)tex.dispose();
   for(const mat of [...materials,...roofMaterials,...signMaterials])mat.dispose();
   signGeometry.dispose();
   if(vent){vent.geo.dispose();vent.mat.dispose();}
  }
 };
}
