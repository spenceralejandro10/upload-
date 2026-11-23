/**
 * Tokio: estructura administrativa real de sus 23 distritos especiales (区, ku).
 * Los barrios son ubicaciones de referencia; su geometría aún es procedural.
 * Un único generador visual compartido construye cualquier área.
 */
export const WARDS = [
  {
    "id": "adachi",
    "name": "Adachi",
    "ja": "足立区",
    "style": "mixed",
    "areas": [
      {
        "id": "kitasenju",
        "name": "Kita-Senju",
        "subtitle": "Zona comercial de Kita-Senju",
        "style": "mixed",
        "seed": 1101
      }
    ]
  },
  {
    "id": "arakawa",
    "name": "Arakawa",
    "ja": "荒川区",
    "style": "traditional",
    "areas": [
      {
        "id": "nippori",
        "name": "Nippori",
        "subtitle": "Calles tradicionales de Nippori",
        "style": "traditional",
        "seed": 1198
      }
    ]
  },
  {
    "id": "bunkyo",
    "name": "Bunkyō",
    "ja": "文京区",
    "style": "mixed",
    "areas": [
      {
        "id": "hongo",
        "name": "Hongō",
        "subtitle": "Zona universitaria de Hongō",
        "style": "mixed",
        "seed": 1295
      }
    ]
  },
  {
    "id": "chiyoda",
    "name": "Chiyoda",
    "ja": "千代田区",
    "style": "commercial",
    "areas": [
      {
        "id": "akihabara",
        "name": "Akihabara",
        "subtitle": "Distrito electrónico Akihabara",
        "style": "neon",
        "seed": 1392
      },
      {
        "id": "marunouchi",
        "name": "Marunouchi",
        "subtitle": "Estación de Tokio y oficinas",
        "style": "highrise",
        "seed": 1423
      },
      {
        "id": "otemachi",
        "name": "Ōtemachi",
        "subtitle": "Centro financiero",
        "style": "highrise",
        "seed": 1454
      }
    ]
  },
  {
    "id": "chuo",
    "name": "Chūō",
    "ja": "中央区",
    "style": "commercial",
    "areas": [
      {
        "id": "ginza",
        "name": "Ginza",
        "subtitle": "Avenidas y tiendas de Ginza",
        "style": "commercial",
        "seed": 1489
      },
      {
        "id": "nihonbashi",
        "name": "Nihonbashi",
        "subtitle": "Centro histórico comercial",
        "style": "commercial",
        "seed": 1520
      }
    ]
  },
  {
    "id": "edogawa",
    "name": "Edogawa",
    "ja": "江戸川区",
    "style": "mixed",
    "areas": [
      {
        "id": "kasai",
        "name": "Kasai",
        "subtitle": "Zona residencial y canales",
        "style": "mixed",
        "seed": 1586
      }
    ]
  },
  {
    "id": "itabashi",
    "name": "Itabashi",
    "ja": "板橋区",
    "style": "mixed",
    "areas": [
      {
        "id": "narimasu",
        "name": "Narimasu",
        "subtitle": "Barrio residencial de Narimasu",
        "style": "mixed",
        "seed": 1683
      }
    ]
  },
  {
    "id": "katsushika",
    "name": "Katsushika",
    "ja": "葛飾区",
    "style": "traditional",
    "areas": [
      {
        "id": "shibamata",
        "name": "Shibamata",
        "subtitle": "Comercios tradicionales de Shibamata",
        "style": "traditional",
        "seed": 1780
      }
    ]
  },
  {
    "id": "kita",
    "name": "Kita",
    "ja": "北区",
    "style": "mixed",
    "areas": [
      {
        "id": "akabane",
        "name": "Akabane",
        "subtitle": "Centro de Akabane",
        "style": "mixed",
        "seed": 1877
      }
    ]
  },
  {
    "id": "koto",
    "name": "Kōtō",
    "ja": "江東区",
    "style": "highrise",
    "areas": [
      {
        "id": "toyosu",
        "name": "Toyosu",
        "subtitle": "Rascacielos y costa de Toyosu",
        "style": "highrise",
        "seed": 1974
      }
    ]
  },
  {
    "id": "meguro",
    "name": "Meguro",
    "ja": "目黒区",
    "style": "mixed",
    "areas": [
      {
        "id": "nakameguro",
        "name": "Naka-Meguro",
        "subtitle": "Calles de Naka-Meguro",
        "style": "mixed",
        "seed": 2071
      }
    ]
  },
  {
    "id": "minato",
    "name": "Minato",
    "ja": "港区",
    "style": "highrise",
    "areas": [
      {
        "id": "minato",
        "name": "Shiba · Torre de Tokio",
        "subtitle": "Torre de Tokio",
        "style": "highrise",
        "seed": 2168
      },
      {
        "id": "roppongi",
        "name": "Roppongi",
        "subtitle": "Centro de Roppongi",
        "style": "highrise",
        "seed": 2199
      }
    ]
  },
  {
    "id": "nakano",
    "name": "Nakano",
    "ja": "中野区",
    "style": "mixed",
    "areas": [
      {
        "id": "nakano",
        "name": "Nakano",
        "subtitle": "Zona comercial de Nakano",
        "style": "mixed",
        "seed": 2265
      }
    ]
  },
  {
    "id": "nerima",
    "name": "Nerima",
    "ja": "練馬区",
    "style": "mixed",
    "areas": [
      {
        "id": "oizumi",
        "name": "Ōizumi",
        "subtitle": "Zona residencial de Ōizumi",
        "style": "mixed",
        "seed": 2362
      }
    ]
  },
  {
    "id": "ota",
    "name": "Ōta",
    "ja": "大田区",
    "style": "mixed",
    "areas": [
      {
        "id": "kamata",
        "name": "Kamata",
        "subtitle": "Zona comercial de Kamata",
        "style": "mixed",
        "seed": 2459
      }
    ]
  },
  {
    "id": "setagaya",
    "name": "Setagaya",
    "ja": "世田谷区",
    "style": "mixed",
    "areas": [
      {
        "id": "shimokitazawa",
        "name": "Shimokitazawa",
        "subtitle": "Calles de Shimokitazawa",
        "style": "mixed",
        "seed": 2556
      }
    ]
  },
  {
    "id": "shibuya",
    "name": "Shibuya",
    "ja": "渋谷区",
    "style": "commercial",
    "areas": [
      {
        "id": "shibuya",
        "name": "Shibuya",
        "subtitle": "Cruce de Shibuya",
        "style": "commercial",
        "seed": 2653
      },
      {
        "id": "harajuku",
        "name": "Harajuku",
        "subtitle": "Omotesando y Harajuku",
        "style": "commercial",
        "seed": 2684
      }
    ]
  },
  {
    "id": "shinagawa",
    "name": "Shinagawa",
    "ja": "品川区",
    "style": "highrise",
    "areas": [
      {
        "id": "gotanda",
        "name": "Gotanda",
        "subtitle": "Edificios de Gotanda",
        "style": "highrise",
        "seed": 2750
      }
    ]
  },
  {
    "id": "shinjuku",
    "name": "Shinjuku",
    "ja": "新宿区",
    "style": "highrise",
    "areas": [
      {
        "id": "shinjuku",
        "name": "Nishi-Shinjuku",
        "subtitle": "Edificio del Gobierno Metropolitano",
        "style": "highrise",
        "seed": 2847
      },
      {
        "id": "kabukicho",
        "name": "Kabukichō",
        "subtitle": "Calles luminosas de Kabukichō",
        "style": "neon",
        "seed": 2878
      }
    ]
  },
  {
    "id": "suginami",
    "name": "Suginami",
    "ja": "杉並区",
    "style": "traditional",
    "areas": [
      {
        "id": "koenji",
        "name": "Kōenji",
        "subtitle": "Calles de Kōenji",
        "style": "traditional",
        "seed": 2944
      }
    ]
  },
  {
    "id": "sumida",
    "name": "Sumida",
    "ja": "墨田区",
    "style": "highrise",
    "areas": [
      {
        "id": "sumida",
        "name": "Oshiage · Skytree",
        "subtitle": "Tokyo Skytree",
        "style": "highrise",
        "seed": 3041
      },
      {
        "id": "ryogoku",
        "name": "Ryōgoku",
        "subtitle": "Distrito de sumo de Ryōgoku",
        "style": "traditional",
        "seed": 3072
      }
    ]
  },
  {
    "id": "taito",
    "name": "Taitō",
    "ja": "台東区",
    "style": "traditional",
    "areas": [
      {
        "id": "asakusa",
        "name": "Asakusa",
        "subtitle": "Templo Sensō-ji",
        "style": "traditional",
        "seed": 3138
      },
      {
        "id": "ueno",
        "name": "Ueno",
        "subtitle": "Parque y comercios de Ueno",
        "style": "traditional",
        "seed": 3169
      }
    ]
  },
  {
    "id": "toshima",
    "name": "Toshima",
    "ja": "豊島区",
    "style": "highrise",
    "areas": [
      {
        "id": "ikebukuro",
        "name": "Ikebukuro",
        "subtitle": "Cruce comercial de Ikebukuro",
        "style": "highrise",
        "seed": 3235
      }
    ]
  }
];
export const DISTRICTS = WARDS.flatMap(ward => ward.areas.map(area => ({...area, wardId:ward.id, wardName:ward.name, wardJa:ward.ja})));
export const findWard = id => WARDS.find(ward=>ward.id===id) || WARDS.find(ward=>ward.id==='shibuya');
export const findDistrict = id => DISTRICTS.find(area=>area.id===id) || DISTRICTS.find(area=>area.id==='shibuya');
