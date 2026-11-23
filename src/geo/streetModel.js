/**
 * BLOQUE 2 · Topología vial compartida.
 * Las líneas se originan en OSM y conservan curvas reales.
 * Anchuras de calzadas y aceras: perfiles visuales aproximados
 * (OSM/OpenMapTiles no ofrece siempre anchura ni bordillos detallados).
 */
import {distanceToSegment,insideFootprint,geoToLocal} from "./sceneData.js";

const PROFILES={
 motorway:{width:18,walk:0,lanes:4},trunk:{width:14,walk:0,lanes:3},
 primary:{width:12,walk:2.1,lanes:2},secondary:{width:10,walk:1.8,lanes:2},
 tertiary:{width:8,walk:1.6,lanes:2},minor:{width:6.2,walk:1.25,lanes:2},
 street:{width:6.5,walk:1.45,lanes:2},
 residential:{width:5.7,walk:1.15,lanes:2},
 service:{width:4.0,walk:.9,lanes:1},living_street:{width:4.5,walk:1.4,lanes:1},
 path:{width:2.25,walk:0,lanes:0},pedestrian:{width:4.5,walk:0,lanes:0},
 track:{width:3,walk:0,lanes:0}
};
const FOOTWAYS=new Set(["footway","pedestrian","steps","platform","corridor","bridleway","cycleway"]);
const MAX_WIDTH=30;
export function roadProfile(road){
 const base=PROFILES[road.kind]||PROFILES.minor;
 const pedestrian=road.kind==="pedestrian"||road.kind==="path"||FOOTWAYS.has(road.subclass);
 const bridge=road.brunnel==="bridge",tunnel=road.brunnel==="tunnel";
 let width=base.width,walk=base.walk;
 if(pedestrian){width=road.subclass==="steps"?1.75:road.subclass==="platform"?3:road.kind==="pedestrian"?4.5:2.25;walk=0;}
 const declared=Number(road.width);
 if(Number.isFinite(declared)&&declared>=1&&declared<=MAX_WIDTH)width=declared;
 if(bridge||tunnel)walk=0;
 return {width,walk,lanes:pedestrian?0:base.lanes,pedestrian,bridge,tunnel,
   type:pedestrian?"footway":road.kind,draw:!tunnel,source:"OSM centerline; width estimated unless tagged"};
}
export function normalsForLine(points){
 const result=[];
 for(let i=0;i<points.length;i++){
  const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
  const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz);
  result.push(len>.0001?[dz/len,-dx/len]:[0,1]);
 }
 return result;
}
function outwardNormal(a,b){
 const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);
 return d>.0001?[dz/d,-dx/d]:[0,1];
}
/**
 * Offset at each vertex with a limited miter, avoiding sidewalks collapsing
 * around sharp bends while preserving every centerline vertex.
 */
export function offsetPolyline(points,distance){
 if(points.length<2)return [];
 const edges=[];
 for(let i=1;i<points.length;i++)edges.push(outwardNormal(points[i-1],points[i]));
 return points.map((p,i)=>{
  const left=edges[Math.max(0,i-1)],right=edges[Math.min(edges.length-1,i)];
  const sum=[left[0]+right[0],left[1]+right[1]],len=Math.hypot(...sum);
  if(len<.01)return [p[0]+right[0]*distance,p[1]+right[1]*distance];
  const n=[sum[0]/len,sum[1]/len];
  const divisor=Math.max(.56,Math.abs(n[0]*right[0]+n[1]*right[1]));
  return [p[0]+n[0]*distance/divisor,p[1]+n[1]*distance/divisor];
 });
}
export function streetSections(roads){
 const sections=[];
 for(const road of roads||[]){
  if(!road.points||road.points.length<2)continue;
  const profile=roadProfile(road);
  if(!profile.draw)continue;
  const p=road.points;
  // Preserve all bends. No artificial rectangular grid.
  sections.push({road,profile,
    center:p,
    leftRoad:offsetPolyline(p,profile.width/2),
    rightRoad:offsetPolyline(p,-profile.width/2),
    leftOuter:profile.walk?offsetPolyline(p,profile.width/2+profile.walk):null,
    rightOuter:profile.walk?offsetPolyline(p,-profile.width/2-profile.walk):null});
 }
 return sections;
}
function sectionSegments(sections){
 const out=[];
 for(const sec of sections){
  for(let i=1;i<sec.center.length;i++){
   const a=sec.center[i-1],b=sec.center[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(length<.2)continue;
   out.push({a,b,length,profile:sec.profile,sec});
  }
 }
 return out;
}
function spatialSegments(segments,cell=64){
 const map=new Map();
 for(const segment of segments){
  const margin=segment.profile.width/2+segment.profile.walk+3;
  const [a,b]=[segment.a,segment.b];
  const minX=Math.floor((Math.min(a[0],b[0])-margin)/cell);
  const maxX=Math.floor((Math.max(a[0],b[0])+margin)/cell);
  const minZ=Math.floor((Math.min(a[1],b[1])-margin)/cell);
  const maxZ=Math.floor((Math.max(a[1],b[1])+margin)/cell);
  // Tiles are clipped to a local area; avoid unbounded global segments.
  if((maxX-minX+1)*(maxZ-minZ+1)>1600)continue;
  for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
   const k=x+","+z;if(!map.has(k))map.set(k,[]);
   map.get(k).push(segment);
  }
 }
 return (x,z)=>{
  const list=map.get(Math.floor(x/cell)+","+Math.floor(z/cell))||[];
  return list;
 };
}
export function makeStreetIndex(roads){
 const sections=streetSections(roads),segments=sectionSegments(sections),near=spatialSegments(segments);
 function nearest(x,z,predicate=()=>true){
  let best=null;
  for(const s of near(x,z)){
   if(!predicate(s.profile,s))continue;
   const projected=distanceToSegment(x,z,s.a,s.b);
   if(!best||projected.distance<best.distance)best={...projected,...s};
  }
  return best;
 }
 function surfaceHeight(x,z){
  let floor=0;
  for(const s of near(x,z)){
   const {distance}=distanceToSegment(x,z,s.a,s.b),p=s.profile,half=p.width/2;
   if(p.pedestrian && distance<=half+.25)floor=Math.max(floor,.09);
   else if(p.walk&&distance>=half-.25&&distance<=half+p.walk+.17)floor=Math.max(floor,.19);
   else if(distance<=half+.35)floor=Math.max(floor,.055);
  }
  return floor;
 }
 function selectSidewalkSpawn(buildings,origin=[0,0]){
  const sorted=segments.filter(s=>s.profile.walk>.8&&!s.profile.bridge)
    .map(s=>({s,d:distanceToSegment(0,0,s.a,s.b).distance}))
    .sort((a,b)=>a.d-b.d);
  for(const {s} of sorted.slice(0,350)){
   const center=distanceToSegment(0,0,s.a,s.b);
   const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],len=Math.hypot(dx,dz);
   if(len<.5)continue;
   const nx=dz/len,nz=-dx/len;
   for(const side of [-1,1]){
    const offset=side*(s.profile.width/2+s.profile.walk*.55);
    const x=center.x+nx*offset,z=center.z+nz*offset;
    if(Math.abs(x)>650||Math.abs(z)>650)continue;
    if(buildings.some(b=>insideFootprint(b,x,z,.65)))continue;
    return {x,z,y:.25,source:"OSM street-side sidewalk (width estimated)"};
   }
  }
  return null;
 }
 return {sections,segments,nearest,surfaceHeight,selectSidewalkSpawn};
}
export function normalizeCrossingNodes(elements,origin){
 const crossings=[],signals=[],seen=new Set();
 for(const item of elements||[]){
  if(item.type!=="node"||!Number.isFinite(item.lon)||!Number.isFinite(item.lat)||seen.has(item.id))continue;
  seen.add(item.id);
  const tags=item.tags||{},[x,z]=geoToLocal([item.lon,item.lat],origin);
  if(Math.abs(x)>650||Math.abs(z)>650)continue;
  const isCross=tags.highway==="crossing"||!!tags.crossing;
  const isSignal=tags.highway==="traffic_signals"||tags.crossing==="traffic_signals"||tags["crossing:signals"]==="yes";
  const noPaint=tags.crossing==="unmarked"||tags["crossing:markings"]==="no"||tags["crossing:markings"]==="none";
  const markings=String(tags["crossing:markings"]||tags.crossing_ref||tags.crossing||"").toLowerCase();
  const painted=!noPaint&&(markings.includes("zebra")||markings==="yes"||markings==="traffic_signals"||markings==="uncontrolled");
  const info={id:item.id,x,z,crossing:tags.crossing||null,painted,signal:isSignal,
    tactile:tags.tactile_paving==="yes",kerb:tags.kerb||null,source:"OSM node"};
  if(isCross)crossings.push(info);
  if(isSignal)signals.push(info);
 }
 return {crossings,signals};
}
