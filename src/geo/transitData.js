/**
 * BLOQUE 5: datos ferroviarios reales de OpenStreetMap.
 * Los accesos railway=subway_entrance y estaciones se consultan en OSM.
 * Nunca se reemplazan por posiciones simuladas cuando falla Overpass.
 */
import {geoToLocal} from "./sceneData.js";

const ENDPOINTS=[
 "https://overpass.private.coffee/api/interpreter",
 "https://overpass.osm.lat/api/interpreter"
];
const CACHE=new Map();
const RANGE=690;
export function transitQuery(origin){
 const [lon,lat]=origin;
 const dy=.0065,dx=dy/Math.max(.2,Math.cos(lat*Math.PI/180));
 const bbox=[lat-dy,lon-dx,lat+dy,lon+dx].map(v=>v.toFixed(6)).join(",");
 return '[out:json][timeout:12];('+
 'nwr["railway"="subway_entrance"]('+bbox+');'+
 'nwr["railway"="train_station_entrance"]('+bbox+');'+
 'nwr["railway"="station"]('+bbox+');'+
 'nwr["public_transport"="station"]["subway"="yes"]('+bbox+');'+
 ');out center tags;';
}
function location(el){
 if(el.type==="node")return [el.lon,el.lat];
 if(el.center)return [el.center.lon,el.center.lat];
 return null;
}
export function normalizeTransitElements(elements,origin){
 const entrances=[],stations=[],ids=new Set();
 for(const element of elements||[]){
  if(!element||!["node","way","relation"].includes(element.type))continue;
  const tags=element.tags||{},railway=tags.railway||"";
  const isEntrance=["subway_entrance","train_station_entrance"].includes(railway);
  const isStation=railway==="station"||tags.public_transport==="station"&&tags.subway==="yes";
  if(!isEntrance&&!isStation)continue;
  const id=element.type+":"+element.id;if(ids.has(id))continue;ids.add(id);
  const loc=location(element);
  if(!loc||!loc.every(Number.isFinite))continue;
  const [x,z]=geoToLocal(loc,origin);
  if(Math.abs(x)>RANGE||Math.abs(z)>RANGE)continue;
  const code=String(tags.ref||tags["ref:station"]||"").trim().slice(0,16);
  const name=String(tags["name:en"]||tags.name||tags["name:ja"]||"").trim().slice(0,90);
  const ja=String(tags["name:ja"]||"").trim().slice(0,90);
  const output={id,x,z,loc,name,ja,code,railway,
   underground:tags.layer&&Number(tags.layer)<0||tags.tunnel==="yes"||tags.level&&Number(tags.level)<0,
   operator:String(tags.operator||"").slice(0,90),source:"OSM",
   accessible:tags.wheelchair||null,entrance:String(tags.entrance||"").slice(0,20)};
  (isEntrance?entrances:stations).push(output);
 }
 return {entrances,stations,status:"ok",source:"OpenStreetMap/Overpass"};
}
export function nearTransitElements(data,{x=0,z=0,radius=500}={}){
 if(!data)return {entrances:[],stations:[],status:"unavailable"};
 const keep=e=>Math.hypot(e.x-x,e.z-z)<=radius;
 return {...data,entrances:(data.entrances||[]).filter(keep),stations:(data.stations||[]).filter(keep)};
}
async function download(url,query,signal){
 const control=new AbortController(),cancel=()=>control.abort();
 const stop=setTimeout(()=>control.abort(),6500);
 signal?.addEventListener("abort",cancel,{once:true});
 try{
  const res=await fetch(url,{method:"POST",mode:"cors",body:new URLSearchParams({data:query}),
   headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},signal:control.signal});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const json=await res.json();
  if(!Array.isArray(json.elements))throw new Error("Respuesta de metro incompleta");
  return json.elements;
 }finally{clearTimeout(stop);signal?.removeEventListener("abort",cancel);}
}
export async function fetchTransitFeatures(origin,{signal}={}){
 const key=origin.map(v=>v.toFixed(4)).join(",");
 if(CACHE.has(key))return CACHE.get(key);
 const q=transitQuery(origin);
 for(const endpoint of ENDPOINTS){
  if(signal?.aborted)break;
  try{
   const elems=await download(endpoint,q,signal);
   const data=normalizeTransitElements(elems,origin);
   CACHE.set(key,data);
   return data;
  }catch(e){console.warn("Red de metro OSM no disponible:",e.message);}
 }
 // No inventar accesos si falla el proveedor.
 return {entrances:[],stations:[],status:"unavailable",source:"OpenStreetMap/Overpass"};
}
