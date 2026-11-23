import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {Globe} from "./globe.js";
import {TokyoCity} from "./city.js";
import {Player} from "./player.js";
import {WARDS,findDistrict} from "./config.js";
import {TokyoAerial,coordinatesFor} from "./geo/mapView.js";

const $=id=>document.getElementById(id);
const canvas=$("experience"),scene=new THREE.Scene();
scene.background=new THREE.Color(0x020713);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.4;
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.07,14000);
camera.position.set(0,0,9.7);
const orbit=new OrbitControls(camera,canvas);
orbit.enableDamping=true;orbit.dampingFactor=.052;orbit.enablePan=false;
orbit.minDistance=3.3;orbit.maxDistance=17;
const globe=new Globe(scene),aerial=new TokyoAerial($("aerial-map"));
let city=null,player=null,mode="globe",transition=0,last=performance.now(),elapsed=0,toastTimer;

document.body.dataset.mode="globe";
const wardSelect=$("ward-select"),areaSelect=$("area-select"),legacySelect=$("district");
function toast(message){
 const el=$("toast");el.textContent=message;el.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3000);
}
for(const ward of WARDS){
 const o=document.createElement("option");o.value=ward.id;o.textContent=ward.name+" · "+ward.ja;wardSelect.appendChild(o);
}
function fillAreas(wardId,selected=null){
 const ward=WARDS.find(w=>w.id===wardId)||WARDS.find(w=>w.id==="shibuya");
 areaSelect.replaceChildren();legacySelect.replaceChildren();
 for(const area of ward.areas){
  for(const select of [areaSelect,legacySelect]){
   const opt=document.createElement("option");opt.value=area.id;opt.textContent=area.name+" · "+area.subtitle;
   select.appendChild(opt);
  }
 }
 const current=ward.areas.some(a=>a.id===selected)?selected:ward.areas[0].id;
 areaSelect.value=current;legacySelect.value=current;
 return findDistrict(current);
}
wardSelect.value="shibuya";
fillAreas("shibuya","shibuya");
wardSelect.addEventListener("change",()=>{
 const area=fillAreas(wardSelect.value);
 if(mode==="aerial")aerial.flyToWard(wardSelect.value);
 toast("Distrito especial "+area.wardName+" · "+area.wardJa);
});
areaSelect.addEventListener("change",()=>{
 legacySelect.value=areaSelect.value;
 if(mode==="aerial")aerial.flyToArea(findDistrict(areaSelect.value));
});
legacySelect.addEventListener("change",()=>{
 const area=findDistrict(legacySelect.value);
 if(wardSelect.value!==area.wardId){wardSelect.value=area.wardId;fillAreas(area.wardId,area.id);}
 else areaSelect.value=area.id;
 if(mode==="walk"&&city){
  aerial.show();
  aerial.map?.jumpTo({center:coordinatesFor(area),zoom:16.6,pitch:62,bearing:-25});
  void walkInCity();
 }
});
$("satellite-toggle").addEventListener("change",e=>aerial.setSatellite(e.target.checked));
$("advertising-toggle").addEventListener("change",e=>aerial.setBillboards(e.target.checked));
$("places-toggle").addEventListener("change",e=>aerial.setPlaces(e.target.checked));
$("metro-toggle").addEventListener("change",e=>{
 aerial.setMetro(e.target.checked);
 if(e.target.checked)toast("Metro: líneas de referencia superpuestas; las vías superficiales del mapa son OSM.");
});
$("panorama-btn").addEventListener("click",()=>aerial.panorama());
$("shibuya-btn").addEventListener("click",()=>aerial.shibuya());

async function viewAerial(){
 transition=0;mode="aerial";document.body.dataset.mode="aerial";
 orbit.enabled=false;globe.hide();
 if(city)city.hide();
 if(player){player.enabled=false;player.root.visible=false;player.keys={};}
 if(document.pointerLockElement)document.exitPointerLock();
 $("country-panel").classList.add("hidden");$("city-panel").classList.add("hidden");
 $("aerial-panel").classList.remove("hidden");
 $("crosshair").classList.add("hidden");$("hud").classList.add("hidden");
 $("hint").classList.add("hidden");
 $("subtitle").textContent="TOKIO · CARTOGRAFÍA 3D REAL";
 $("aerial-loading").classList.remove("hidden");
 $("aerial-map").style.display="block";
 try{
  await aerial.open();
  aerial.show();
  $("aerial-loading").classList.add("hidden");
  toast("Vista aérea real: gira, acerca y explora los 23 distritos de Tokio.");
 }catch(err){
  console.error("Fallo al cargar cartografía:",err);
  $("aerial-loading").classList.add("hidden");
  $("aerial-map").innerHTML="";
  $("aerial-map").style.background="#172b42";
  toast("No cargaron los mapas externos. Revisa la conexión y recarga la página.");
  $("error").classList.remove("hidden");
  $("error").textContent="No fue posible descargar el mapa cartográfico de Tokio: "+err.message;
 }
}
function enterJapan(){
 if(mode!=="globe"||transition)return;
 transition=.001;orbit.enabled=false;
 $("enter-btn").disabled=true;
 $("enter-btn").textContent="DESCENDIENDO A TOKIO…";
}
let buildingWalk=false;
async function walkInCity(){
 if(buildingWalk)return;
 if(!aerial.map){toast("Primero carga la cartografía aérea de Tokio.");return;}
 buildingWalk=true;
 const button=$("walk-btn");
 const oldText=button.innerHTML;
 button.disabled=true;button.textContent="GENERANDO CALLES Y EDIFICIOS REALES…";
 $("aerial-loading").classList.remove("hidden");
 $("aerial-loading").querySelector("b").textContent="PREPARANDO TOKIO REAL";
 $("aerial-loading").querySelector("small").textContent="Sincronizando calles, curvas y huellas de los edificios con la vista aérea…";
 // No se oculta la vista aérea hasta comprobar que los datos GIS se cargaron.
 aerial.show();
 try{
  const snapshot=await aerial.captureWalkData();
  const nextCity=new TokyoCity(scene,snapshot);
  if(city){city.dispose();}
  city=nextCity;
  if(!player)player=new Player(scene,camera,canvas,city);
  player.city=city;
  player.enabled=true;
  player.root.visible=true;
  player.respawn();
  player.yaw=0;player.pitch=.1;
  camera.position.set(city.spawn.x,city.spawn.y+9,city.spawn.z+18);
  mode="walk";document.body.dataset.mode="walk";transition=0;
  aerial.hide();globe.hide();orbit.enabled=false;
  $("aerial-panel").classList.add("hidden");$("country-panel").classList.add("hidden");
  $("city-panel").classList.remove("hidden");
  $("crosshair").classList.remove("hidden");$("hud").classList.remove("hidden");
  $("hint").classList.remove("hidden");$("hint").classList.add("city");
  $("hint").textContent="GEOMETRÍA GIS DE TOKIO · CALLES Y EDIFICIOS DERIVADOS DEL MISMO MAPA AÉREO";
  $("subtitle").textContent="TOKIO · LA MISMA CIUDAD EN VISTA AÉREA Y A PIE";
  const [lng,lat]=snapshot.origin;
  $("hud-zone").textContent="TOKIO · "+lat.toFixed(4)+"° N · "+lng.toFixed(4)+"° E";
  const stats=city.stats;
  toast("Datos reales: "+stats.buildings+" edificios y "+stats.roads+" trazos de calles de la misma vista aérea.");
 }catch(error){
  console.error("Error al convertir Tokio en escena caminable:",error);
  if(mode==="walk"){
   // Mantener el anterior barrio si falla un cambio de zona.
   aerial.hide();if(city)city.show();
   if(player)player.enabled=true;
  }else{aerial.show();}
  toast("No se pudo sincronizar esta zona: "+error.message);
 }finally{
  buildingWalk=false;
  $("aerial-loading").classList.add("hidden");
  button.disabled=false;button.innerHTML=oldText;
 }
}
function returnEarth(){
 if(document.pointerLockElement)document.exitPointerLock();
 mode="globe";transition=0;document.body.dataset.mode="globe";
 aerial.hide();
 if(city)city.hide();
 if(player){player.enabled=false;player.root.visible=false;player.keys={};}
 globe.show();scene.fog=null;scene.background.set(0x020713);
 camera.position.set(0,0,9.7);camera.up.set(0,1,0);camera.lookAt(0,0,0);
 orbit.target.set(0,0,0);orbit.enabled=true;orbit.update();
 $("aerial-panel").classList.add("hidden");
 $("country-panel").classList.remove("hidden");$("city-panel").classList.add("hidden");
 $("hint").classList.remove("hidden");$("hint").classList.remove("city");
 $("hint").textContent="LA TIERRA ES EXPLORABLE · JAPÓN ES EL ÚNICO DESTINO ACTIVO";
 $("crosshair").classList.add("hidden");$("hud").classList.add("hidden");
 $("subtitle").textContent="EXPLORACIÓN PLANETARIA · CAPÍTULO 01";
 $("enter-btn").disabled=false;$("enter-btn").innerHTML="ENTRAR A JAPÓN <span>↗</span>";
}
$("enter-btn").addEventListener("click",enterJapan);
$("walk-btn").addEventListener("click",walkInCity);
$("aerial-back-btn").addEventListener("click",returnEarth);
$("back-btn").addEventListener("click",returnEarth);
$("back-aerial-btn").addEventListener("click",viewAerial);
canvas.addEventListener("click",e=>{
 if(mode!=="globe"||transition)return;
 const pointer=new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
 if(globe.hit(pointer,camera))enterJapan();
 else toast("Puedes observar toda la Tierra, pero únicamente entrar a Japón.");
});
window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
 renderer.setSize(innerWidth,innerHeight,false);
 aerial.map?.resize();
});
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min((now-last)/1000,.045);last=now;elapsed+=dt;
 if(mode==="aerial")return; // MapLibre gestiona su propio render WebGL.
 if(mode==="globe"){
  if(transition){
   transition+=dt;
   const k=Math.min(transition/1.5,1);
   camera.position.lerp(new THREE.Vector3(0,0,3.75),Math.min(1,dt*(2+k*9)));
   camera.lookAt(0,0,0);
   if(k>=1){void viewAerial();return;}
  }else orbit.update();
  globe.update(dt,elapsed);
 }else if(mode==="walk"&&city){
  city.update(dt,elapsed);
  const info=player.update(dt);
  if(info){$("hud-speed").textContent=info.speed+" km/h";$("hud-mode").textContent=info.mode;}
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(loop);
setTimeout(()=>{
 const loader=$("loading");if(!loader)return;
 loader.style.opacity="0";setTimeout(()=>loader.remove(),650);
},650);
