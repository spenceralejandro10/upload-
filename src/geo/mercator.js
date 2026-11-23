/** Conversiones Web Mercator para registrar las mismas fotografías aéreas. */
export function lonLatToTile(lon,lat,zoom) {
 const n=2**zoom,phi=Math.max(-85.05,Math.min(85.05,lat))*Math.PI/180;
 return [(lon+180)/360*n,(1-Math.asinh(Math.tan(phi))/Math.PI)/2*n];
}
export function tileToLonLat(x,y,zoom) {
 const n=2**zoom;
 return [x/n*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI];
}
