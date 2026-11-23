import * as THREE from "three";
import {geoToLocal} from "./sceneData.js";
import {lonLatToTile,tileToLonLat} from "./mercator.js";

/**
 * Satélite Esri World Imagery proyectado sobre el mismo marco geográfico
 * del mapa aéreo. Comparte exactamente coordenadas con los polígonos GIS.
 * La imagen se carga por teselas; si una falla queda el terreno de respaldo.
 */
const ENDPOINT="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/";
export function satelliteGround(group,origin,options={}){
 const isSmall=typeof window!=="undefined"&&window.innerWidth<700;
 const zoom=options.zoom??(isSmall?16:17);
 const center=lonLatToTile(origin[0],origin[1],zoom);
 const radius=isSmall?3:5;
 const loader=new THREE.TextureLoader();
 loader.setCrossOrigin("anonymous");
 let count=0;
 const geometries=new THREE.PlaneGeometry(1,1);
 const tiles=[];
 for(let y=Math.floor(center[1])-radius;y<=Math.floor(center[1])+radius;y++){
  for(let x=Math.floor(center[0])-radius;x<=Math.floor(center[0])+radius;x++){
   const nw=geoToLocal(tileToLonLat(x,y,zoom),origin);
   const se=geoToLocal(tileToLonLat(x+1,y+1,zoom),origin);
   if(se[0]<-850||nw[0]>850||se[1]<-850||nw[1]>850)continue;
   const w=se[0]-nw[0],h=se[1]-nw[1];
   const material=new THREE.MeshBasicMaterial({color:0xffffff,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1,toneMapped:false});
   const mesh=new THREE.Mesh(geometries,material);
   mesh.position.set((nw[0]+se[0])/2,-.10,(nw[1]+se[1])/2);
   mesh.scale.set(w,h,1);mesh.rotation.x=-Math.PI/2;
   mesh.visible=false;group.add(mesh);tiles.push(mesh);
   loader.load(ENDPOINT+zoom+"/"+y+"/"+x,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    material.map=texture;material.needsUpdate=true;
    mesh.visible=true;
   },undefined,()=>{
    material.dispose();mesh.visible=false;
   });
   count++;
  }
 }
 // El consumidor libera los materiales/texturas al abandonar el barrio.
 return {tileCount:count,dispose(){
  for(const mesh of tiles){
   mesh.material.map?.dispose();
   mesh.material.dispose();
  }
  geometries.dispose();
 }};
}
