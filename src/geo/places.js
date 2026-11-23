/**
 * Lugares reconocibles de Tokio. Coordenadas de referencia para situar
 * marcadores en la cartografía OSM; no son huellas catastrales ni modelos BIM.
 */
export const PLACES = [
 {id:"shibuya-cross",name:"Shibuya Scramble Crossing",ja:"渋谷スクランブル交差点",type:"hito",ward:"shibuya",loc:[139.70055,35.65947],desc:"Cruce diagonal, pantallas y anuncios luminosos"},
 {id:"qfront",name:"QFRONT · SHIBUYA TSUTAYA",ja:"QFRONT",type:"comercio",ward:"shibuya",loc:[139.7007,35.65972],desc:"Fachada con pantallas ante el cruce de Shibuya"},
 {id:"shibuya109",name:"SHIBUYA109",ja:"SHIBUYA109",type:"comercio",ward:"shibuya",loc:[139.6988,35.6595],desc:"Edificio comercial cilíndrico de Shibuya"},
 {id:"shibuya-sky",name:"Shibuya Scramble Square",ja:"渋谷スクランブルスクエア",type:"mirador",ward:"shibuya",loc:[139.7020,35.6584],desc:"Rascacielos con mirador SHIBUYA SKY"},
 {id:"tokyo-station",name:"Estación de Tokio",ja:"東京駅",type:"estacion",ward:"chiyoda",loc:[139.7671,35.68124],desc:"Núcleo ferroviario de Japón"},
 {id:"tokyo-tower",name:"Tokyo Tower",ja:"東京タワー",type:"hito",ward:"minato",loc:[139.74543,35.65858],desc:"Torre de comunicaciones emblemática"},
 {id:"skytree",name:"Tokyo Skytree",ja:"東京スカイツリー",type:"hito",ward:"sumida",loc:[139.8107,35.7101],desc:"Torre de observación de 634 metros"},
 {id:"sensoji",name:"Templo Sensō-ji",ja:"浅草寺",type:"templo",ward:"taito",loc:[139.7966,35.7148],desc:"Complejo histórico de Asakusa"},
 {id:"meiji",name:"Santuario Meiji",ja:"明治神宮",type:"parque",ward:"shibuya",loc:[139.6993,35.6764],desc:"Santuario dentro de una gran zona arbolada"},
 {id:"yoyogi",name:"Parque Yoyogi",ja:"代々木公園",type:"parque",ward:"shibuya",loc:[139.6948,35.6716],desc:"Gran parque urbano de Tokio"},
 {id:"shinjuku-gyoen",name:"Shinjuku Gyoen",ja:"新宿御苑",type:"parque",ward:"shinjuku",loc:[139.7114,35.68518],desc:"Jardines públicos"},
 {id:"imperial",name:"Jardines del Palacio Imperial",ja:"皇居東御苑",type:"parque",ward:"chiyoda",loc:[139.7588,35.6852],desc:"Áreas verdes y fosos imperiales"},
 {id:"ueno",name:"Parque Ueno",ja:"上野公園",type:"parque",ward:"taito",loc:[139.7730,35.7156],desc:"Museos y jardines"},
 {id:"metropolitan",name:"Gobierno Metropolitano",ja:"東京都庁",type:"hito",ward:"shinjuku",loc:[139.6921,35.6896],desc:"Edificio de dos torres en Nishi-Shinjuku"},
 {id:"cross-shinjuku",name:"Cross Shinjuku Vision",ja:"クロス新宿ビジョン",type:"publicidad",ward:"shinjuku",loc:[139.7025,35.6924],desc:"Conocida pantalla urbana 3D"},
 {id:"kabukicho",name:"Kabukichō · Godzilla Road",ja:"歌舞伎町",type:"comercio",ward:"shinjuku",loc:[139.7028,35.6953],desc:"Entretenimiento y anuncios de gran formato"},
 {id:"akihabara",name:"Akihabara Electric Town",ja:"秋葉原電気街",type:"comercio",ward:"chiyoda",loc:[139.7710,35.6983],desc:"Edificios de electrónica, anime y publicidad"},
 {id:"ginza",name:"Ginza 4-chōme",ja:"銀座四丁目",type:"comercio",ward:"chuo",loc:[139.7648,35.6716],desc:"Comercio y fachadas de grandes firmas"},
 {id:"odaiba",name:"Odaiba",ja:"お台場",type:"hito",ward:"minato",loc:[139.7751,35.6279],desc:"Bahía, puentes y distrito costero"},
 {id:"rainbow-bridge",name:"Rainbow Bridge",ja:"レインボーブリッジ",type:"hito",ward:"minato",loc:[139.7631,35.6366],desc:"Puente de la bahía de Tokio"},
 {id:"national-stadium",name:"Estadio Nacional",ja:"国立競技場",type:"hito",ward:"shinjuku",loc:[139.7149,35.6778],desc:"Estadio principal de Tokio"},
 {id:"haneda",name:"Aeropuerto de Haneda",ja:"東京国際空港",type:"aeropuerto",ward:"ota",loc:[139.7798,35.5494],desc:"Aeropuerto principal dentro de Tokio"},
 {id:"narita",name:"Aeropuerto de Narita",ja:"成田国際空港",type:"aeropuerto",ward:"fuera",loc:[140.3874,35.772],desc:"Aeropuerto internacional en la prefectura de Chiba, fuera de Tokio"},
 {id:"todai",name:"Universidad de Tokio",ja:"東京大学",type:"universidad",ward:"bunkyo",loc:[139.7627,35.7126],desc:"Campus Hongō"},
 {id:"stlukes",name:"St. Luke's International Hospital",ja:"聖路加国際病院",type:"hospital",ward:"chuo",loc:[139.7776,35.6675],desc:"Hospital en Tsukiji"},
 {id:"tsukiji",name:"Tsukiji Outer Market",ja:"築地場外市場",type:"comercio",ward:"chuo",loc:[139.7706,35.6655],desc:"Mercado exterior de Tsukiji, restaurantes y comercios"},
 {id:"ikebukuro",name:"Estación Ikebukuro",ja:"池袋駅",type:"estacion",ward:"toshima",loc:[139.7103,35.7289],desc:"Importante estación y centro comercial"},
 {id:"shinagawa",name:"Estación Shinagawa",ja:"品川駅",type:"estacion",ward:"minato",loc:[139.7389,35.6285],desc:"Conexión ferroviaria de alta velocidad"}
];
export const placeById = (id)=>PLACES.find(p=>p.id===id);