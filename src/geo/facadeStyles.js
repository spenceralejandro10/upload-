/**
 * BLOQUE 3 · Perfiles arquitectónicos visuales deterministas.
 *
 * La huella, posición y altura proceden siempre de OSM. Las ventanas,
 * marquesinas, colores y tejados son una reconstrucción artística cuando
 * OSM no registra esos detalles; NO son datos verificados del edificio.
 * Este módulo no usa Three.js y puede probarse sin WebGL.
 */
export const FACADES = Object.freeze({
  house:    {bay:2.65,floor:3.0,window:"home",glass:0.23},
  apartment:{bay:3.25,floor:3.05,window:"balcony",glass:0.35},
  shop:     {bay:3.1,floor:3.3,window:"retail",glass:0.50},
  mixed:    {bay:3.05,floor:3.25,window:"mixed",glass:0.49},
  office:   {bay:3.0,floor:3.45,window:"office",glass:0.7},
  tower:    {bay:2.85,floor:3.75,window:"curtain",glass:0.86},
  hotel:    {bay:3.0,floor:3.25,window:"hotel",glass:0.45},
  industrial:{bay:4.3,floor:4.1,window:"warehouse",glass:0.15},
  civic:    {bay:3.8,floor:3.8,window:"civic",glass:0.38}
});
export const STYLE_NAMES=Object.keys(FACADES);
const COMMERCIAL_TYPES=new Set(["commercial","retail","supermarket","kiosk","shop","mall","office"]);
const INDUSTRIAL_TYPES=new Set(["industrial","warehouse","factory","storage_tank","shed","garages","hangar"]);
const CIVIC_TYPES=new Set(["school","hospital","university","public","civic","government","train_station","transportation"]);
const HOME_TYPES=new Set(["house","detached","semidetached_house","terrace","residential","bungalow","hut","cabin"]);
const APARTMENT_TYPES=new Set(["apartments","dormitory"]);
const HOTEL_TYPES=new Set(["hotel","motel","hostel"]);
const ROOF_GABLED=new Set(["gabled","hipped","half-hipped","pyramidal","skillion"]);
export function stableHash(value){
 const input=String(value),len=input.length;let h=2166136261;
 for(let i=0;i<len;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}
export function buildingSeed(b){
 const id=b.sourceId==null?"":String(b.sourceId);
 // Tile fragment IDs are sometimes unstable. Also depend on real location.
 return stableHash(id+"|"+Math.round((b.x||0)*2)+"|"+Math.round((b.z||0)*2));
}
export function facadeProfile(building){
 const t=building.tags||{},h=Math.max(2,Number(building.height||5)-Number(building.base||0));
 const type=String(t.building||t.class||"").toLowerCase();
 const amenity=String(t.amenity||"").toLowerCase();
 const hash=buildingSeed(building),v=hash%100;
 let style,evidence="visual-estimate";
 if(INDUSTRIAL_TYPES.has(type))style="industrial";
 else if(CIVIC_TYPES.has(type)||CIVIC_TYPES.has(amenity))style="civic";
 else if(HOTEL_TYPES.has(type)||t.tourism==="hotel")style="hotel";
 else if(APARTMENT_TYPES.has(type))style="apartment";
 else if(HOME_TYPES.has(type))style="house";
 else if(COMMERCIAL_TYPES.has(type)||!!t.shop||!!t.office)style=h>65?"office":"shop";
 else if(type==="yes"||!type){
  if(h>85)style="tower";
  else if(h>35)style=v<42?"office":v<72?"tower":"apartment";
  else if(h>17)style=v<33?"apartment":v<70?"mixed":"office";
  else if(h>8)style=v<35?"apartment":v<80?"mixed":"house";
  else style=v<48?"house":v<73?"apartment":"shop";
 }else{
  style=h>90?"tower":h>40?"office":h>12?"mixed":"house";
 }
 if(type&&!["yes",""].includes(type))evidence="OSM-building-tag";
 if(t.shop||t.office)evidence="OSM-commercial-tag";
 // High towers cannot sensibly use a tiny shop window on every storey.
 if(h>100&&["house","shop","mixed"].includes(style))style="tower";
 const spec=FACADES[style],variant=hash%5;
 const floor=Math.min(spec.floor,Math.max(2.8,h/Math.max(1,Math.round(h/spec.floor))));
 const storeys=Math.max(1,Math.round(h/floor));
 const isRetail=style==="shop"||style==="mixed";
 const roof=String(t["roof:shape"]||"").toLowerCase();
 return {
  style,variant,evidence,
  bay:spec.bay*(.92+(hash%13)/100),floor,
  storeys,glass:spec.glass,
  height:h,base:building.base||0,
  rooftop:style==="office"||style==="tower"||style==="hotel",
  commercial:isRetail,
  roof:ROOF_GABLED.has(roof)?roof:"flat-or-unrecorded",
  roofEvidence:ROOF_GABLED.has(roof)?"OSM-roof-tag":"not-recorded",
  seed:hash
 };
}
export function facadeSummary(buildings){
 const stats=Object.fromEntries(STYLE_NAMES.map(style=>[style,0]));
 for(const b of buildings)stats[facadeProfile(b).style]++;
 return stats;
}
