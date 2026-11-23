/**
 * B04 — Ubicación de publicidad escénica sobre las huellas OSM reales.
 * Este módulo no importa Three.js y puede validarse independientemente.
 *
 * No usa marcas reales sin autorización ni atribuye campañas actuales.
 * Las coordenadas de SIGNS son puntos de referencia y no certifican
 * qué fachada comercial tiene una pantalla actualmente.
 */
import {geoToLocal,insidePolygon} from "./sceneData.js";
import {facadeProfile,buildingSeed} from "./facadeStyles.js";
import {SIGNS} from "./billboards.js";

export const AD_DISTRICTS = Object.freeze([
 {id:"shibuya",loc:[139.70055,35.65947],radius:390,weight:1},
 {id:"kabukicho",loc:[139.7028,35.6953],radius:420,weight:.93},
 {id:"akihabara",loc:[139.7710,35.6983],radius:390,weight:.89},
 {id:"ginza",loc:[139.7648,35.6716],radius:320,weight:.68},
 {id:"ikebukuro",loc:[139.7103,35.7289],radius:280,weight:.65},
 {id:"roppongi",loc:[139.731,35.663],radius:230,weight:.4}
]);
const BRANDLESS = Object.freeze([
 ["東京","TOKYO CITY","#44e9f5"],["未来","FUTURE","#ff4db8"],
 ["音楽","MUSIC","#e6aaff"],["日本","NIPPON","#55caff"],
 ["新しい","NEW WORLD","#f6bc55"],["街","CITY LIGHTS","#71ffe1"],
 ["ゲーム","GAME ZONE","#7db1ff"],["アート","CREATIVE","#fe84b7"],
 ["ショッピング","SHOPPING","#fff293"],["カフェ","CAFE","#8af5c9"],
 ["映画","CINEMA","#f278ff"],["光","LIGHT","#92e7ff"]
]);
export const AD_COLORS=BRANDLESS.map(x=>x[2]);

export function districtActivity(origin){
 let intensity=0,zone="other";
 for(const item of AD_DISTRICTS){
  const [x,z]=geoToLocal(item.loc,origin),meters=Math.hypot(x,z);
  const strength=item.weight*Math.max(0,1-meters/item.radius);
  if(strength>intensity){intensity=strength;zone=item.id;}
 }
 return {intensity,zone};
}
export function realFacades(building,streetIndex){
 const ring=building.rings?.[0]||[];
 const sides=[];
 for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<3.3)continue;
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  // Choose exterior normal by testing a point against the real footprint.
  const left=[-dz/len,dx/len];
  const leftOutside=!insidePolygon(mid[0]+left[0]*.65,mid[1]+left[1]*.65,building.rings);
  const nx=leftOutside?left[0]:-left[0],nz=leftOutside?left[1]:-left[1];
  const road=streetIndex?.nearest(mid[0],mid[1],profile=>!profile.bridge&&!profile.tunnel&&profile.lanes>0);
  if(!road||road.distance>44)continue;
  const facesRoad=(road.x-mid[0])*nx+(road.z-mid[1])*nz>0;
  if(!facesRoad)continue;
  sides.push({a,b,mid,nx,nz,len,roadDistance:road.distance,
   streetAngle:Math.atan2(nz,nx)});
 }
 return sides.sort((a,b)=>a.roadDistance-b.roadDistance||b.len-a.len);
}
function pickSize(building,facade,kind,hash){
 const available=Math.max(2.4,building.height-building.base);
 const maxWidth=Math.max(1.5,facade.len*.82);
 if(kind==="screen"){
  if(available<10||facade.len<7)return null;
  const width=Math.min(maxWidth,Math.max(5,Math.min(18,available*.33)));
  const height=Math.min(available*.56,Math.max(4.2,width*.58));
  const y=building.base+Math.min(available-height-1,available*.52);
  return {width,height,y,depth:.24};
 }
 if(kind==="vertical"){
  if(available<9||facade.len<4.1)return null;
  const width=Math.min(maxWidth,1.5+(hash%6)*.29);
  const height=Math.min(available*.75,5+(hash%9)*1.45);
  const y=building.base+Math.max(1.4,available*.15);
  return {width,height,y,depth:.21};
 }
 if(available<5)return null;
 const width=Math.min(maxWidth,3+(hash%9)*.4);
 const height=Math.min(available*.21,1.6+(hash%3)*.2);
 return {width,height,y:building.base+Math.max(2.5,Math.min(3.9,available*.27)),depth:.14};
}
function planOne(building,facade,kind,label,seed,origin,reference=null){
 const spec=pickSize(building,facade,kind,seed);
 if(!spec)return null;
 const y=Math.min(building.height-spec.height/2-.45,spec.y+spec.height/2);
 if(y-spec.height/2<building.base+.3)return null;
 return {
  x:facade.mid[0]+facade.nx*(spec.depth+.065),
  z:facade.mid[1]+facade.nz*(spec.depth+.065),
  y,
  nx:facade.nx,nz:facade.nz,angle:facade.streetAngle,
  width:spec.width,height:spec.height,depth:spec.depth,
  label:label[0],sub:label[1],color:label[2],kind,
  sourceBuilding:building.sourceId??null,
  reference:reference?.title??null,
  illustrative:true,
  seed
 };
}
function nearestAnchorBuilding(anchor,buildings,used,streetIndex){
 let best=null,bestDistance=Infinity;
 for(const building of buildings){
  if(used.has(building))continue;
  const h=building.height-building.base;
  if(h<9)continue;
  const length=Math.hypot(building.x-anchor.x,building.z-anchor.z);
  if(length>69||length>bestDistance+14)continue;
  const facade=realFacades(building,streetIndex).find(f=>f.len>6.5);
  if(!facade)continue;
  const d=Math.hypot(facade.mid[0]-anchor.x,facade.mid[1]-anchor.z);
  if(d<bestDistance){best={building,facade};bestDistance=d;}
 }
 return bestDistance<77?best:null;
}
/**
 * Pure deterministic plan; all placements depend on actual edges and
 * OSM street orientation. No floating ad sprites above fake city blocks.
 */
export function planAdvertising(snapshot,streetIndex,{limit=170}={}){
 if(!snapshot?.origin||!Array.isArray(snapshot.buildings))throw new Error("Datos GIS necesarios");
 const used=new Set(),planned=[],center=geoToLocal([139.70055,35.65947],snapshot.origin);
 const activity=districtActivity(snapshot.origin);
 // Anchors known from real geographical reference points. The displayed
 // content is illustrative; only the anchor's approximate location is real.
 for(const ad of SIGNS){
  if(planned.length>=limit)break;
  const [x,z]=geoToLocal(ad.loc,snapshot.origin);
  if(Math.abs(x)>700||Math.abs(z)>700)continue;
  const found=nearestAnchorBuilding({x,z},snapshot.buildings,used,streetIndex);
  if(!found)continue;
  const entry=planOne(found.building,found.facade,"screen",
   [ad.title,ad.subtitle,ad.accent],buildingSeed(found.building),snapshot.origin,ad);
  if(entry){planned.push(entry);used.add(found.building);}
 }
 if(activity.intensity<.06)return {entries:planned,zone:activity.zone,intensity:activity.intensity,anchorCount:planned.length};
 const anchorCount=planned.length;
 const sorted=snapshot.buildings
  .filter(b=>b.height-b.base>=6&&Math.abs(b.x)<610&&Math.abs(b.z)<610)
  .sort((a,b)=>buildingSeed(a)-buildingSeed(b));
 for(const b of sorted){
  if(planned.length>=limit)break;
  if(used.has(b))continue;
  const profile=facadeProfile(b),seed=buildingSeed(b);
  if(["industrial","civic","house"].includes(profile.style))continue;
  const facades=realFacades(b,streetIndex);
  if(!facades.length)continue;
  const localStrength=AD_DISTRICTS.reduce((strength,district)=>{
   const [dx,dz]=geoToLocal(district.loc,snapshot.origin);
   const distance=Math.hypot(b.x-dx,b.z-dz);
   return Math.max(strength,district.weight*Math.max(0,1-distance/district.radius));
  },0);
  if(localStrength<.11)continue;
  const commercial=profile.commercial||["tower","office","hotel"].includes(profile.style);
  if(!commercial&&seed%7!==0)continue;
  const threshold=Math.floor((commercial?.55:.16)*localStrength*100);
  if(seed%100>=threshold)continue;
  const kind=b.height-b.base>22&&seed%4===0?"screen":b.height-b.base>12&&seed%3===0?"vertical":"shop";
  const label=BRANDLESS[seed%BRANDLESS.length];
  const entry=planOne(b,facades[0],kind,label,seed,snapshot.origin);
  if(entry){planned.push(entry);used.add(b);}
 }
 return {entries:planned,zone:activity.zone,intensity:activity.intensity,anchorCount};
}
