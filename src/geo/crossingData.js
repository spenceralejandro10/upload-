/**
 * OSM crossing nodes (not inferred from arbitrary road intersections).
 * Independent, optional layer: if Overpass is unavailable, the rest of
 * Tokyo still opens; no fictitious crosswalks are placed.
 */
import {normalizeCrossingNodes} from "./streetModel.js";
const CACHE=new Map();
const URLS=[
 "https://overpass.private.coffee/api/interpreter",
 "https://overpass.osm.lat/api/interpreter"
];
function queryFor(origin){
 const [lng,lat]=origin;
 const dy=.0049,dx=.0049/Math.cos(lat*Math.PI/180);
 const bbox=[lat-dy,lng-dx,lat+dy,lng+dx].map(n=>n.toFixed(6)).join(",");
 return '[out:json][timeout:12];(node["highway"="crossing"]('+bbox+');node["highway"="traffic_signals"]('+bbox+'););out body;';
}
async function request(url,query,abortSignal){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),5400);
 const onAbort=()=>controller.abort();
 abortSignal?.addEventListener("abort",onAbort,{once:true});
 try{
  const response=await fetch(url,{
   method:"POST",mode:"cors",
   body:new URLSearchParams({data:query}),
   headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
   signal:controller.signal
  });
  if(!response.ok)throw new Error("Overpass HTTP "+response.status);
  const data=await response.json();
  if(!Array.isArray(data.elements))throw new Error("Respuesta OSM incompleta");
  return data.elements;
 }finally{
  clearTimeout(timeout);
  abortSignal?.removeEventListener("abort",onAbort);
 }
}
export async function fetchCrossingDetails(origin,{signal}={}){
 const key=origin.map(v=>v.toFixed(4)).join(",");
 if(CACHE.has(key))return CACHE.get(key);
 const q=queryFor(origin);
 for(const url of URLS){
  if(signal?.aborted)break;
  try{
   const elements=await request(url,q,signal);
   const result=normalizeCrossingNodes(elements,origin);
   CACHE.set(key,result);
   return result;
  }catch(error){
   console.info("OSM cruces: proveedor opcional no disponible",error?.message||error);
  }
 }
 return {crossings:[],signals:[],status:"unavailable"};
}
