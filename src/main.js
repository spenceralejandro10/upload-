import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {Globe} from "./globe.js";
import {TokyoCity} from "./city.js";
import {Player} from "./player.js";
import {DISTRICTS} from "./config.js";

const $=id=>document.getElementById(id);
const canvas=$("experience"),scene=new THREE.Scene();
scene.background=new THREE.Color(0x020713);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.07,14000);
camera.position.set(0,0,9.7);
const orbit=new OrbitControls(camera,canvas);
orbit.enableDamping=true;orbit.dampingFactor=.052;orbit.enablePan=false;
orbit.minDistance=3.3;orbit.maxDistance=17;orbit.maxPolarAngle=Math.PI-.14;orbit.minPolarAngle=.14;
const globe=new Globe(scene);
let city=null,player=null,mode="globe",transition=0,last=performance.now(),worldTime=0,toastTimer=0;

const selector=$("district");
for(const d of DISTRICTS){
 const option=document.createElement("option");option.value=d.id;option.textContent=d.name+" · "+d.subtitle;selector.appendChild(option);
}
function toast(message){
 const el=$("toast");el.textContent=message;el.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}
function viewCity(){
 mode="city";transition=0;globe.hide();orbit.enabled=false;
 if(!city)city=new TokyoCity(scene,selector.value);
 else{city.show();city.build(selector.value);}
 if(!player)player=new Player(scene,camera,canvas,city);
 player.city=city;player.enabled=true;player.root.visible=true;player.respawn();
 camera.position.set(0,6,45);player.yaw=0;
 $("country-panel").classList.add("hidden");$("city-panel").classList.remove("hidden");
 $("hint").classList.add("city");$("hint").textContent="HAZ CLIC EN LA CIUDAD PARA CONTROLAR LA CÁMARA · ESC PARA LIBERAR EL CURSOR";
 $("crosshair").classList.remove("hidden");$("hud").classList.remove("hidden");
 $("subtitle").textContent="TOKIO 3D · EXPLORACIÓN TERRESTRE";
 $("hud-zone").textContent=city.district.name.toUpperCase()+" · TOKIO";
 toast("Bienvenido a "+city.district.name+" · Usa W A S D para caminar");
}
function enterJapan(){
 if(mode!=="globe"||transition)return;
 transition=.001;orbit.enabled=false;
 $("enter-btn").disabled=true;$("enter-btn").textContent="DESCENDIENDO A TOKIO…";
}
function backToEarth(){
 if(document.pointerLockElement)document.exitPointerLock();
 mode="globe";transition=0;
 if(city)city.hide();
 if(player){player.enabled=false;player.root.visible=false;player.keys={};}
 globe.show();scene.fog=null;scene.background.set(0x020713);
 camera.position.set(0,0,9.7);camera.up.set(0,1,0);camera.lookAt(0,0,0);
 orbit.target.set(0,0,0);orbit.enabled=true;orbit.update();
 $("country-panel").classList.remove("hidden");$("city-panel").classList.add("hidden");
 $("hint").classList.remove("city");$("hint").textContent="LA TIERRA ES EXPLORABLE · JAPÓN ES EL ÚNICO DESTINO ACTIVO";
 $("crosshair").classList.add("hidden");$("hud").classList.add("hidden");
 $("subtitle").textContent="EXPLORACIÓN PLANETARIA · CAPÍTULO 01";
 $("enter-btn").disabled=false;$("enter-btn").innerHTML="ENTRAR A JAPÓN <span>↗</span>";
}
$("enter-btn").addEventListener("click",enterJapan);
$("back-btn").addEventListener("click",backToEarth);
selector.addEventListener("change",()=>{
 if(!city||mode!=="city")return;
 city.build(selector.value);player.respawn();
 $("hud-zone").textContent=city.district.name.toUpperCase()+" · TOKIO";
 toast("Zona cargada: "+city.district.name);
});
canvas.addEventListener("click",e=>{
 if(mode!=="globe"||transition)return;
 const pointer=new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
 if(globe.hit(pointer,camera))enterJapan();
 else toast("Solo Japón está habilitado para explorar a nivel de calle");
});
window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setSize(innerWidth,innerHeight,false);
});
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min((now-last)/1000,.045);last=now;worldTime+=dt;
 if(mode==="globe"){
  if(transition){
   transition+=dt;
   const k=Math.min(transition/1.65,1);
   const eased=k*k*(3-2*k);
   camera.position.lerp(new THREE.Vector3(0,0,3.72),Math.min(1,dt*(2+eased*9)));
   camera.lookAt(0,0,0);
   if(k>=1)viewCity();
  }else orbit.update();
  globe.update(dt,worldTime);
 }else if(city){
  city.update(dt,worldTime);
  const info=player.update(dt);
  if(info){$("hud-speed").textContent=info.speed+" km/h";$("hud-mode").textContent=info.mode;}
 }
 renderer.render(scene,camera);
}
try{
 requestAnimationFrame(loop);
 setTimeout(()=>{const load=$("loading");load.style.opacity="0";setTimeout(()=>load.remove(),650);},650);
}catch(err){
 $("loading").classList.add("hidden");
 $("error").classList.remove("hidden");$("error").textContent="No fue posible iniciar WebGL: "+err.message;
 throw err;
}