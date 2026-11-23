import * as THREE from "three";
import {DISTRICTS} from "./config.js";
import {makeRoads} from "./roads.js";
import {makeBuildings} from "./buildings.js";
import {makeActors} from "./actors.js";
import {makeLandmark} from "./landmarks.js";
export class TokyoCity{
 constructor(scene,id="shibuya"){
  this.scene=scene;this.group=new THREE.Group();scene.add(this.group);
  this.scene.fog=new THREE.FogExp2(0xa7b7c4,.00165);
  this.build(id);
 }
 build(id){
  if(this.group.children.length){
   this.group.traverse(obj=>{if(obj.isMesh&&obj.geometry)obj.geometry.dispose();if(obj.isInstancedMesh)obj.dispose();});
   this.group.clear();
  }
  this.district=DISTRICTS.find(d=>d.id===id)||DISTRICTS[0];
  this.road=makeRoads(this.group,this.district);
  this.buildings=makeBuildings(this.group,this.district);
  makeLandmark(this.group,this.district);
  this.actors=makeActors(this.group,this.district);
  const sun=new THREE.DirectionalLight(0xffefdb,2.15);sun.position.set(-210,490,170);this.group.add(sun);
  const amb=new THREE.HemisphereLight(0xd8ecff,0x475c6b,2.4);this.group.add(amb);
  this.scene.background=new THREE.Color(0x9abbd4);
 }
 nearby(x,z){return this.buildings.nearby(x,z);}
 update(dt,time){this.road.update(time);this.actors.update(dt,time);}
 show(){this.group.visible=true;this.scene.fog=new THREE.FogExp2(0xa7b7c4,.00165);this.scene.background=new THREE.Color(0x9abbd4);}
 hide(){this.group.visible=false;this.scene.fog=null;this.scene.background=new THREE.Color(0x020713);}
}