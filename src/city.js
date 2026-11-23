import * as THREE from "three";
import {makeGeoWorld} from "./geo/osmScene.js";

/**
 * BLOQUE 1 — misma geometría geográfica que el mapa aéreo.
 * Prohibido generar manzanas, edificios o carreteras al azar desde city.js.
 */
export class TokyoCity{
 constructor(scene,snapshot){
  this.scene=scene;
  this.group=new THREE.Group();
  this.scene.add(this.group);
  this.build(snapshot);
 }
 build(snapshot){
  if(!snapshot?.origin)throw new Error("TokyoCity requiere datos reales normalizados de la vista aérea.");
  this.world?.dispose?.();
  this.group.clear();
  if(this.world?.group){
   this.world.group.traverse(object=>{
    if(object.geometry)object.geometry.dispose();
    if(object.material){
     for(const mat of Array.isArray(object.material)?object.material:[object.material]){
      // Los materiales reutilizados por el módulo se mantienen.
      if(mat?.isSpriteMaterial){mat.map?.dispose();mat.dispose();}
     }
    }
   });
  }
  this.snapshot=snapshot;
  this.world=makeGeoWorld(this.group,snapshot);
  this.spawn=this.world.spawn;
  this.stats=this.world.stats;
  this.sun=new THREE.DirectionalLight(0xfff1d8,2.45);
  this.sun.position.set(270,470,170);
  this.group.add(this.sun);
  this.ambient=new THREE.HemisphereLight(0xdaeafb,0x526775,2.1);
  this.group.add(this.ambient);
  this.show();
 }
 dispose(){
  this.world?.dispose?.();
  if(this.world?.group){
   this.world.group.traverse(obj=>{
    if(obj.geometry)obj.geometry.dispose();
    if(obj.material?.isSpriteMaterial){obj.material.map?.dispose();obj.material.dispose();}
   });
  }
  this.scene.remove(this.group);
  this.group.clear();
 }
 nearby(x,z){return this.world.nearby(x,z);}
 floorHeight(x,z){return this.world?.surfaceHeight?.(x,z)??0;}
 update(dt,time){this.world?.update?.(time);}
 hide(){this.group.visible=false;this.scene.fog=null;this.scene.background.set(0x020713);}
 show(){
  this.group.visible=true;
  this.scene.background=new THREE.Color(0x91b7d1);
  this.scene.fog=new THREE.FogExp2(0x99b6ca,.0012);
 }
}