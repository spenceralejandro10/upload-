/**
 * Red visual de referencia — NO es un trazado topográfico de las vías ni
 * incluye todo el sistema. Los segmentos se unen esquemáticamente entre
 * estaciones conocidas. Las vías visibles en OSM tienen prioridad visual.
 */
export const METRO_LINES=[
 {name:"Ginza Line (G)",color:"#e2a31a",stations:[
  ["Shibuya",[139.701,35.658]],["Omotesandō",[139.712,35.665]],["Akasaka-mitsuke",[139.737,35.677]],["Ginza",[139.765,35.671]],["Kanda",[139.771,35.692]],["Ueno",[139.777,35.714]],["Asakusa",[139.797,35.712]]
 ]},
 {name:"Marunouchi Line (M)",color:"#e24645",stations:[
  ["Ikebukuro",[139.711,35.729]],["Kōrakuen",[139.752,35.708]],["Otemachi",[139.765,35.685]],["Tokyo",[139.767,35.681]],["Ginza",[139.765,35.671]],["Akasaka-mitsuke",[139.737,35.677]],["Yotsuya",[139.730,35.686]],["Shinjuku",[139.700,35.691]]
 ]},
 {name:"Hanzōmon Line (Z)",color:"#ad87c8",stations:[
  ["Shibuya",[139.701,35.658]],["Omotesandō",[139.712,35.665]],["Hanzōmon",[139.742,35.686]],["Ōtemachi",[139.765,35.685]],["Kiyosumi-shirakawa",[139.799,35.682]],["Oshiage",[139.813,35.710]]
 ]},
 {name:"Tozai Line (T)",color:"#31a9cf",stations:[
  ["Nakano",[139.665,35.705]],["Takadanobaba",[139.704,35.713]],["Iidabashi",[139.745,35.702]],["Otemachi",[139.765,35.685]],["Monzen-nakachō",[139.796,35.672]],["Kasai",[139.873,35.663]]
 ]}
];
export function metroGeoJSON(){
 return {type:"FeatureCollection",features:METRO_LINES.map(l=>({type:"Feature",properties:{name:l.name,color:l.color,schematic:true},geometry:{type:"LineString",coordinates:l.stations.map(s=>s[1])}}))};
}
export function metroStationGeoJSON(){
 const unique=new Map();
 for(const line of METRO_LINES)for(const [name,coord] of line.stations){
  const key=name.toLowerCase().replaceAll("ō","o");
  if(!unique.has(key))unique.set(key,{type:"Feature",properties:{name,line:line.name},geometry:{type:"Point",coordinates:coord}});
 }
 return {type:"FeatureCollection",features:[...unique.values()]};
}