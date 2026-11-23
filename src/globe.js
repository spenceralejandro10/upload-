import * as THREE from "three";
import {TEXTURES,TOKYO} from "./config.js";
const R = 2.64;
function geo(lat, lon, radius) {
 const a=lat*Math.PI/180, o=lon*Math.PI/180;
 return new THREE.Vector3(radius*Math.cos(a)*Math.cos(o),radius*Math.sin(a),-radius*Math.cos(a)*Math.sin(o));
}
function starfield(){
 const count=3700, positions=new Float32Array(count*3), cols=new Float32Array(count*3);
 const rand=Math.random;
 for(let i=0;i<count;i++){
  let x=rand()*2-1, y=rand()*2-1, z=rand()*2-1, m=Math.hypot(x,y,z)||1, r=36+rand()*70;
  positions.set([x/m*r,y/m*r,z/m*r],i*3);
  let v=.46+rand()*.54; cols.set([v*.73,v*.84,v],i*3);
 }
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(positions,3));g.setAttribute("color",new THREE.BufferAttribute(cols,3));
 return new THREE.Points(g,new THREE.PointsMaterial({size:.09,vertexColors:true,sizeAttenuation:true,transparent:true,opacity:.93}));
}
function halo(){
 return new THREE.Mesh(new THREE.SphereGeometry(R*1.075,80,48),new THREE.ShaderMaterial({
  transparent:true,side:THREE.BackSide,depthWrite:false,
  uniforms:{glowColor:{value:new THREE.Color(0x4cbbff)}},
  vertexShader:"varying vec3 vNormal; varying vec3 vEye; void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
  fragmentShader:"uniform vec3 glowColor; varying vec3 vNormal;varying vec3 vEye; void main(){float intensity=pow(0.78-dot(normalize(vNormal),normalize(vEye)),3.5);gl_FragColor=vec4(glowColor,intensity*.64);}"
 }));
}
export class Globe {
 constructor(scene){
  this.scene=scene;this.group=new THREE.Group();this.spin=new THREE.Group();
  this.group.add(this.spin);this.scene.add(this.group);
  this.stars=starfield();this.scene.add(this.stars);
  const globeMat=new THREE.MeshPhongMaterial({color:0xffffff,shininess:17,specular:0x29475e});
  this.earth=new THREE.Mesh(new THREE.SphereGeometry(R,112,76),globeMat);
  this.spin.add(this.earth);
  this.clouds=new THREE.Mesh(new THREE.SphereGeometry(R*1.012,112,76),new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:.16,depthWrite:false}));
  this.spin.add(this.clouds);
  this.spin.add(halo());
  const loader=new THREE.TextureLoader();
  loader.load(TEXTURES.day,(t)=>{t.colorSpace=THREE.SRGBColorSpace;this.earth.material.map=t;this.earth.material.needsUpdate=true;},undefined,()=>{this.earth.material.color.set(0x25658b);});
  loader.load(TEXTURES.normal,(t)=>{this.earth.material.bumpMap=t;this.earth.material.bumpScale=.055;this.earth.material.needsUpdate=true;},undefined,()=>{});
  loader.load(TEXTURES.specular,(t)=>{this.earth.material.specularMap=t;this.earth.material.needsUpdate=true;},undefined,()=>{});
  loader.load(TEXTURES.clouds,(t)=>{this.clouds.material.alphaMap=t;this.clouds.material.needsUpdate=true;},undefined,()=>{this.clouds.visible=false;});
  this.marker=new THREE.Group();
  this.marker.position.copy(geo(TOKYO.lat,TOKYO.lon,R*1.035));
  this.marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),this.marker.position.clone().normalize());
  const circle=new THREE.Mesh(new THREE.RingGeometry(.035,.052,32),new THREE.MeshBasicMaterial({color:0x7dfbef,side:THREE.DoubleSide,transparent:true,opacity:.95,depthTest:false}));
  circle.rotation.x=-Math.PI/2;this.marker.add(circle);
  const outer=new THREE.Mesh(new THREE.RingGeometry(.09,.097,48),new THREE.MeshBasicMaterial({color:0x73e9e2,side:THREE.DoubleSide,transparent:true,opacity:.75,depthTest:false}));
  outer.rotation.x=-Math.PI/2;this.marker.add(outer);this.ring=outer;
  const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.16,7),new THREE.MeshBasicMaterial({color:0x9bfdf4,depthTest:false}));
  stalk.position.y=.082;this.marker.add(stalk);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.027,12,8),new THREE.MeshBasicMaterial({color:0xd3fff8,depthTest:false}));dot.position.y=.17;this.marker.add(dot);
  this.spin.add(this.marker);
  const source=geo(TOKYO.lat,TOKYO.lon,1);
  this.spin.rotation.y=Math.atan2(-source.x,source.z);
  this.sun=new THREE.DirectionalLight(0xffffff,2.05);this.sun.position.set(5.8,3.6,7);
  this.scene.add(this.sun);this.scene.add(new THREE.AmbientLight(0x64839a,1.06));
  this.raycaster=new THREE.Raycaster();
 }
 hit(pointer,camera){
  this.raycaster.setFromCamera(pointer,camera);
  return this.raycaster.intersectObjects([this.marker.children[0],this.marker.children[1],this.marker.children[3]],false).length>0;
 }
 update(dt,clock){this.ring.scale.setScalar(1+.3*Math.sin(clock*2.8));this.ring.material.opacity=.53+.25*Math.sin(clock*2.8);this.clouds.rotation.y+=dt*.002;}
 hide(){this.group.visible=false;this.stars.visible=false;this.sun.visible=false;}
 show(){this.group.visible=true;this.stars.visible=true;this.sun.visible=true;}
}
export {geo};