/**
 * BLOQUE 1: adaptador GIS compartido entre mapa aéreo y escena caminable.
 * No inventar calles ni huellas: extraer las mismas capas vectoriales
 * OpenStreetMap/OpenFreeMap utilizadas por el mapa.
 *
 * Coordenadas: x = metros hacia el ESTE; z = metros hacia el SUR; y = altura.
 * No hay otra geografía, semillas ni cuadrículas de urbanización.
 */

export const METERS_PER_DEGREE = 111319.49079327357;
export function geoToLocal(coord, origin) {
  const latitude = origin[1] * Math.PI / 180;
  const dx = (coord[0] - origin[0]) * METERS_PER_DEGREE * Math.cos(latitude);
  const dz = -(coord[1] - origin[1]) * METERS_PER_DEGREE;
  return [dx, dz];
}
export function localToGeo(point, origin) {
  return [
    origin[0] + point[0] / (METERS_PER_DEGREE * Math.cos(origin[1] * Math.PI / 180)),
    origin[1] - point[1] / METERS_PER_DEGREE
  ];
}

function pointsForGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates || [];
  return [];
}
function linesForGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates || [];
  return [];
}
function simplifyLine(points) {
  const clean = [];
  for (const p of points) {
    const last = clean[clean.length - 1];
    if (Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]) && (!last || Math.hypot(p[0]-last[0],p[1]-last[1]) > .45)) clean.push(p);
  }
  return clean;
}
export function extentOf(rings) {
  let minX=Infinity, maxX=-Infinity, minZ=Infinity, maxZ=-Infinity;
  for(const ring of rings)for(const [x,z] of ring){
    minX=Math.min(x,minX);maxX=Math.max(x,maxX);
    minZ=Math.min(z,minZ);maxZ=Math.max(z,maxZ);
  }
  return {minX,maxX,minZ,maxZ,x:(minX+maxX)/2,z:(minZ+maxZ)/2,halfX:(maxX-minX)/2,halfZ:(maxZ-minZ)/2};
}
export function insideRing(x,z,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>z)!==(b[1]>z) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export function insidePolygon(x,z,rings){
  if(!rings?.length||!insideRing(x,z,rings[0]))return false;
  for(let i=1;i<rings.length;i++)if(insideRing(x,z,rings[i]))return false;
  return true;
}
export function distanceToSegment(x,z,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz;
  const t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/d)):0;
  const px=a[0]+t*dx,pz=a[1]+t*dz;
  return {distance:Math.hypot(x-px,z-pz),x:px,z:pz};
}
export function distanceToFootprint(x,z,rings) {
  let best=Infinity;
  for(const ring of rings||[])for(let i=1;i<ring.length;i++){
    best=Math.min(best,distanceToSegment(x,z,ring[i-1],ring[i]).distance);
  }
  return best;
}
export function insideFootprint(building,x,z,padding=0){
  const b=building;
  if(x<b.minX-padding||x>b.maxX+padding||z<b.minZ-padding||z>b.maxZ+padding)return false;
  if(insidePolygon(x,z,b.rings))return true;
  return padding>0 && distanceToFootprint(x,z,b.rings)<padding;
}
const LIMIT=760;
function closeRing(ring){
  const out=simplifyLine(ring);
  if(out.length<3)return [];
  if(Math.hypot(out[0][0]-out[out.length-1][0],out[0][1]-out[out.length-1][1])>.2)out.push([...out[0]]);
  return out;
}
function ringsLocal(rings,origin){
  return rings.map(r=>closeRing(r.map(p=>geoToLocal(p,origin)))).filter(r=>r.length>=4);
}
function nearArea(bounds){
  return bounds.minX<LIMIT&&bounds.maxX>-LIMIT&&bounds.minZ<LIMIT&&bounds.maxZ>-LIMIT;
}
function num(value,fallback){
  const v=Number(value);
  return Number.isFinite(v)&&v>=0 ? v:fallback;
}
function approximateHeight(properties){
  const h=num(properties.render_height,0);
  if(h>0)return Math.min(450,Math.max(2.5,h));
  const levels=num(properties["building:levels"],0);
  return levels?Math.min(150,levels*3):5;
}
function signature(type,geometry,properties={}){
  // Dedupe exact repeated tile fragments; keep separately clipped fragments.
  const coords=JSON.stringify(geometry?.coordinates||[]);
  let hash=2166136261;
  const key=type+"|"+String(properties.osm_id??"")+"|"+coords;
  for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
export function normalizeOSM(raw,origin){
  if(!Array.isArray(origin)||!Number.isFinite(origin[0])||!Number.isFinite(origin[1]))throw new Error("Centro geográfico inválido");
  const buildings=[],roads=[],water=[],parks=[],rail=[];
  const seen=new Set();
  for(const f of raw.building||[]){
    if(!f?.geometry)continue;
    const key=signature("building",f.geometry,f.properties);
    if(seen.has(key))continue;seen.add(key);
    for(const poly of pointsForGeometry(f.geometry)){
      const rings=ringsLocal(poly,origin);
      if(!rings.length)continue;
      const bounds=extentOf(rings);
      if(!nearArea(bounds)||bounds.halfX<.7||bounds.halfZ<.7)continue;
      const base=num(f.properties?.render_min_height,0),height=approximateHeight(f.properties||{});
      buildings.push({...bounds,rings,height:Math.max(height,base+2),base,sourceId:f.id??f.properties?.osm_id??null});
    }
  }
  for(const [type,output] of [["transportation",roads],["water",water],["landuse",parks]]){
    for(const f of raw[type]||[]){
      if(!f?.geometry)continue;
      const key=signature(type,f.geometry,f.properties);
      if(seen.has(key))continue;seen.add(key);
      if(type==="transportation"){
        const category=String(f.properties?.class||"");
        const sub=String(f.properties?.subclass||"");
        const isRail=category==="rail"||sub==="rail"||sub==="subway";
        const accepted=isRail||["motorway","trunk","primary","secondary","tertiary","minor","residential","service","street","path","pedestrian","track","living_street"].includes(category);
        if(!accepted)continue;
        for(const line of linesForGeometry(f.geometry)){
          const points=simplifyLine(line.map(p=>geoToLocal(p,origin)));
          if(points.length<2||!nearArea(extentOf([points])))continue;
          const obj={points,kind:category,subclass:sub,sourceId:f.id??null};
          (isRail?rail:output).push(obj);
        }
      }else{
        const kind=String(f.properties?.class||"");
        if(type==="landuse"&&!["park","wood","forest","grass","garden","cemetery","nature_reserve","recreation_ground","pitch"].includes(kind))continue;
        for(const poly of pointsForGeometry(f.geometry)){
          const rings=ringsLocal(poly,origin);
          if(rings.length&&nearArea(extentOf(rings)))output.push({rings,kind});
        }
      }
    }
  }
  return {origin:[...origin],buildings,roads,water,parks,rail,source:"OpenStreetMap/OpenFreeMap"};
}
export function chooseSpawn(snapshot){
  let best=null,score=Infinity;
  for(const road of snapshot.roads){
    if(["motorway","trunk"].includes(road.kind))continue;
    for(let i=1;i<road.points.length;i++){
      const candidate=distanceToSegment(0,0,road.points[i-1],road.points[i]);
      const value=candidate.distance;
      if(value<score){score=value;best={x:candidate.x,z:candidate.z};}
    }
  }
  if(!best)throw new Error("No hay calles OSM suficientes para ubicar al personaje. Acércate a un barrio y reintenta.");
  // Desplazar ligeramente al margen peatonal, sin movernos fuera de esta zona real.
  const nearBuilding=snapshot.buildings.some(b=>insideFootprint(b,best.x,best.z,1));
  return {...best,y:0.15,nearBuilding};
}
