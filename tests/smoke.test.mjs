import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
const modules=["src/config.js","src/globe.js","src/roads.js","src/buildings.js","src/landmarks.js","src/actors.js","src/city.js","src/player.js","src/main.js"];
for(const f of modules){
 assert.ok(existsSync(f),"Falta módulo: "+f);
 execFileSync(process.execPath,["--check",f],{stdio:"pipe"});
}
const config=readFileSync("src/config.js","utf8");
for(const zone of ["shibuya","shinjuku","akihabara","asakusa","minato","sumida","chiyoda"])assert.ok(config.includes(zone),"Falta sector: "+zone);
const html=readFileSync("index.html","utf8");
assert.ok(html.includes("src/main.js"),"Falta entrada principal");
assert.ok(html.includes("enter-btn"),"Falta acción de entrar en Japón");
for(const file of ["src/roads.js","src/buildings.js","src/player.js"])assert.ok(readFileSync(file,"utf8").length>500);
console.log("Pruebas de estructura y sintaxis: correctas ("+modules.length+" módulos).");
