/**
 * Mapa 3D geográfico real de Tokio. NO genera cuadrículas inventadas.
 *
 * Base: OpenFreeMap / OpenStreetMap (vías, barrios, parques, agua y huellas
 * de edificios). Fotografía aérea: ArcGIS World Imagery con atribución.
 * Alturas de los edificios: campos OSM render_height / render_min_height.
 *
 * Los anuncios son objetos escénicos superpuestos, no fotos actuales.
 * Las líneas de metro de metro.js son esquemáticas.
 */
import {PLACES,placeById} from "./places.js";
import {SIGNS} from "./billboards.js";
import {metroGeoJSON,metroStationGeoJSON} from "./metro.js";
import {WARD_CENTERS} from "./wardCenters.js";

const MAPLIBRE_URL="https://cdn.jsdelivr.net/npm/maplibre-gl@6.16.0/dist/maplibre-gl.mjs";
const BASE_STYLE="https://tiles.openfreemap.org/styles/liberty";
const RASTER_TILES="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const center=[139.7512,35.6814];
const CATEGORIES={
 aeropuerto:"✈",estacion:"Ⓜ",parque:"♣",comercio:"◆",hospital:"+",
 universidad:"U",mirador:"◆",hito:"★",templo:"⛩",publicidad:"◇"
};
const COLORS={
 aeropuerto:"#f2cb87",estacion:"#8bd7fd",parque:"#78cba0",comercio:"#f6a6e2",
 hospital:"#ee8fa0",universidad:"#96c4fd",mirador:"#e9c792",hito:"#8fefef",
 templo:"#f0a66e",publicidad:"#ffa4ee"
};
function escapeHTML(t){return String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export function coordinatesFor(area){
 const lookup={
  shibuya:"shibuya-cross",shinjuku:"metropolitan",akihabara:"akihabara",
  asakusa:"sensoji",minato:"tokyo-tower",sumida:"skytree",
  ginza:"ginza",marunouchi:"tokyo-station",chiyoda:"imperial",
  kabukicho:"kabukicho",ueno:"ueno",harajuku:"meiji",ikebukuro:"ikebukuro"
 };
 return placeById(lookup[area?.id])?.loc||WARD_CENTERS[area?.wardId]||center;
}
export class TokyoAerial {
 constructor(element){
  this.element=element;this.map=null;this.lib=null;this.ready=null;
  this.satellite=true;this.advertising=true;this.metro=false;this.landmarks=true;
  this.markers=[];this.adMarkers=[];this.isVisible=false;
 }
 async open(){
  if(this.map){this.show();this.map.resize();return this.ready;}
  this.element.style.display="block";
  this.isVisible=true;
  this.lib=await import(MAPLIBRE_URL);
  const L=this.lib;
  const map=new L.Map({
   container:this.element,style:BASE_STYLE,center,
   zoom:11.3,pitch:58,bearing:-26,
   minZoom:7,maxZoom:20,maxPitch:82,antialias:true,
   attributionControl:false
  });
  this.map=map;
  map.addControl(new L.NavigationControl({showCompass:true,showZoom:true,visualizePitch:true}),"bottom-right");
  map.addControl(new L.AttributionControl({compact:true,customAttribution:"© OpenStreetMap contributors · OpenFreeMap · Imagery © Esri, Earthstar Geographics and providers"}),"bottom-left");
  map.on("error",e=>{console.warn("Capa de Tokio:",e?.error?.message||e);});
  this.ready=new Promise((resolve,reject)=>{
   let settled=false;
   const fail=setTimeout(()=>{if(!settled){settled=true;reject(new Error("No fue posible cargar las teselas de Tokio. Comprueba Internet."));}},19000);
   map.once("load",()=>{if(!settled){clearTimeout(fail);settled=true;resolve(this);}});
  });
  map.on("style.load",()=>this.installLayers());
  map.on("zoom",()=>this.applyMarkerVisibility());
  await this.ready;
  this.installLayers();
  map.easeTo({center:[139.735,35.686],zoom:12.3,pitch:62,bearing:-23,duration:4100});
  return this;
 }
 installLayers(){
  const map=this.map;
  if(!map||!map.isStyleLoaded())return;
  const style=map.getStyle(),sourceId=Object.keys(style.sources||{}).find(key=>{
   const v=style.sources[key];return v.type==="vector"&&((v.url||"").includes("openfreemap")||key==="openmaptiles");
  })||"tokyo-vector";
  if(!map.getSource(sourceId))map.addSource(sourceId,{type:"vector",url:"https://tiles.openfreemap.org/planet"});
  if(!map.getSource("tokyo-satellite"))map.addSource("tokyo-satellite",{type:"raster",tiles:[RASTER_TILES],tileSize:256,maxzoom:19,attribution:"© Esri, Maxar, Earthstar Geographics and the GIS User Community"});
  if(!map.getLayer("tokyo-satellite-photo"))map.addLayer({
    id:"tokyo-satellite-photo",type:"raster",source:"tokyo-satellite",
    layout:{visibility:this.satellite?"visible":"none"},
    paint:{"raster-opacity":1,"raster-fade-duration":250}
  });
  // Crear edificios sobre el satélite, sin alterar sus huellas reales.
  if(!map.getLayer("tokyo-osm-3d"))map.addLayer({
   id:"tokyo-osm-3d",type:"fill-extrusion",source:sourceId,
   "source-layer":"building",minzoom:13.3,
   filter:["all",["!=",["get","hide_3d"],true]],
   paint:{
    "fill-extrusion-color":["interpolate",["linear"],["coalesce",["get","render_height"],6],
      0,"#b3b3b1",12,"#b8bfc0",40,"#a9b2bc",100,"#879cad",250,"#8094ac"],
    "fill-extrusion-base":["coalesce",["get","render_min_height"],0],
    "fill-extrusion-height":["interpolate",["linear"],["zoom"],13.3,0,14.4,["coalesce",["get","render_height"],5]],
    "fill-extrusion-opacity":["interpolate",["linear"],["zoom"],13.3,.8,16,.94],
    "fill-extrusion-vertical-gradient":true
   }
  });
  // Agua, parques y calles reproducen trazos reales, no una cuadrícula sintética.
  if(!map.getLayer("tokyo-osm-water"))map.addLayer({
   id:"tokyo-osm-water",type:"fill",source:sourceId,"source-layer":"water",
   minzoom:10,paint:{"fill-color":"#418eb0","fill-opacity":.23}
  });
  if(!map.getLayer("tokyo-osm-parks"))map.addLayer({
   id:"tokyo-osm-parks",type:"fill",source:sourceId,"source-layer":"landuse",
   minzoom:10,
   filter:["in",["get","class"],["literal",["park","forest","wood","grass","garden","cemetery"]]],
   paint:{"fill-color":"#72b68a","fill-opacity":.18}
  });
  if(!map.getLayer("tokyo-osm-roads"))map.addLayer({
   id:"tokyo-osm-roads",type:"line",source:sourceId,"source-layer":"transportation",minzoom:13,
   filter:["in",["get","class"],["literal",["primary","secondary","tertiary","minor","service","residential","motorway","trunk"]]],
   layout:{"line-join":"round","line-cap":"round"},
   paint:{"line-color":"#f4f2e8","line-opacity":["interpolate",["linear"],["zoom"],13,.18,17,.65],
     "line-width":["interpolate",["linear"],["zoom"],13,.4,15,1.6,18,4]}
  });
  // Ferrocarril visto desde arriba: datos reales del mapa.
  if(!map.getLayer("tokyo-osm-rail"))map.addLayer({
   id:"tokyo-osm-rail",type:"line",source:sourceId,"source-layer":"transportation",
   minzoom:10,filter:["any",["==",["get","class"],"rail"],["==",["get","subclass"],"rail"]],
   layout:{"line-cap":"round","line-join":"round"},
   paint:{"line-color":"#e8f5f9","line-width":["interpolate",["linear"],["zoom"],10,.5,16,3.3],"line-opacity":.87}
  });
  if(!map.getSource("tokyo-metro-schematic"))map.addSource("tokyo-metro-schematic",{type:"geojson",data:metroGeoJSON()});
  if(!map.getLayer("tokyo-metro-schematic-line"))map.addLayer({
   id:"tokyo-metro-schematic-line",type:"line",source:"tokyo-metro-schematic",
   layout:{visibility:this.metro?"visible":"none","line-cap":"round","line-join":"round"},
   paint:{"line-color":["get","color"],"line-opacity":.94,"line-width":["interpolate",["linear"],["zoom"],10,2,16,5],"line-dasharray":[2,1]}
  });
  if(!map.getSource("tokyo-stations-schematic"))map.addSource("tokyo-stations-schematic",{type:"geojson",data:metroStationGeoJSON()});
  if(!map.getLayer("tokyo-metro-stops"))map.addLayer({
   id:"tokyo-metro-stops",type:"circle",source:"tokyo-stations-schematic",
   layout:{visibility:this.metro?"visible":"none"},
   paint:{"circle-radius":["interpolate",["linear"],["zoom"],10,3,15,6],"circle-color":"#fff","circle-stroke-width":2,"circle-stroke-color":"#334c76"}
  });
  if(!this.markers.length)this.addPOIMarkers();
  if(!this.adMarkers.length)this.addBillboards();
  this.applyMarkerVisibility();
 }
 addPOIMarkers(){
  const L=this.lib;
  for(const p of PLACES){
   const element=document.createElement("button");
   element.type="button";element.className="tokyo-pin";
   element.textContent=CATEGORIES[p.type]||"•";
   element.style.setProperty("--pin",COLORS[p.type]||"#82e3e9");
   element.setAttribute("aria-label",p.name);
   const popup=new L.Popup({offset:15,maxWidth:"265px",closeButton:true})
    .setHTML('<div class="poi-popup"><b>'+escapeHTML(p.name)+'</b><small>'+escapeHTML(p.ja)+'</small><p>'+escapeHTML(p.desc)+'</p><em>Ubicación geográfica de referencia</em></div>');
   const marker=new L.Marker({element,anchor:"bottom"}).setLngLat(p.loc).setPopup(popup).addTo(this.map);
   this.markers.push({element,marker,p});
  }
 }
 addBillboards(){
  const L=this.lib;
  for(const s of SIGNS){
   const element=document.createElement("div");
   element.className="tokyo-billboard "+s.style;
   element.style.setProperty("--accent",s.accent);
   element.innerHTML='<b>'+escapeHTML(s.title)+'</b><small>'+escapeHTML(s.subtitle)+'</small>';
   element.title="Cartel de demostración de la zona de "+s.subtitle;
   const marker=new L.Marker({element,anchor:"bottom",offset:[0,-13]})
    .setLngLat(s.loc).addTo(this.map);
   this.adMarkers.push({element,marker});
  }
 }
 applyMarkerVisibility(){
  if(!this.map)return;
  const zoom=this.map.getZoom();
  for(const p of this.markers){
   p.element.style.display=this.landmarks&&(zoom>=11||p.p.type==="aeropuerto"&&zoom>=9.5)?"block":"none";
  }
  for(const s of this.adMarkers)s.element.style.display=this.advertising&&zoom>=13.3?"flex":"none";
 }
 setSatellite(on){
  this.satellite=!!on;
  if(this.map?.getLayer("tokyo-satellite-photo"))this.map.setLayoutProperty("tokyo-satellite-photo","visibility",on?"visible":"none");
 }
 setBillboards(on){this.advertising=!!on;this.applyMarkerVisibility();}
 setPlaces(on){this.landmarks=!!on;this.applyMarkerVisibility();}
 setMetro(on){
  this.metro=!!on;
  for(const id of ["tokyo-metro-schematic-line","tokyo-metro-stops"]){
   if(this.map?.getLayer(id))this.map.setLayoutProperty(id,"visibility",on?"visible":"none");
  }
 }
 flyToWard(ward){
  const coords=WARD_CENTERS[ward]||center;
  this.map?.flyTo({center:coords,zoom:12.7,pitch:57,bearing:-16,speed:.72,essential:true});
 }
 flyToArea(area){
  this.map?.flyTo({center:coordinatesFor(area),zoom:16.4,pitch:64,bearing:-26,speed:.7,essential:true});
 }
 panorama(){
  this.map?.flyTo({center:[139.741,35.692],zoom:10.4,pitch:50,bearing:-20,speed:.55,essential:true});
 }
 shibuya(){
  this.map?.flyTo({center:[139.70055,35.65947],zoom:17.0,pitch:69,bearing:-28,speed:.68,essential:true});
 }
 show(){this.isVisible=true;this.element.style.display="block";setTimeout(()=>this.map?.resize(),25);}
 hide(){this.isVisible=false;this.element.style.display="none";}
}
