import { rectangle, type Point, type Polygon } from '../navigation';

export const jefaHousePlan = {
 id:'jefa-house',
 texture:'jefa-house-v1',
 anchor:[1750,1184] as Point,
 size:224,
 door:[1750,1158] as Point,
 approach:[1750,1210] as Point,
 /** Separate wall and fence footprints leave a clear, walkable doorway. */
 obstacles:[
  rectangle(1664,1098,172,16),
  rectangle(1664,1114,16,40),
  rectangle(1820,1114,16,40),
  rectangle(1680,1146,52,16),
  rectangle(1768,1146,68,16),
  rectangle(1653,1087,20,18),
  rectangle(1629,1110,8,62),
  rectangle(1863,1110,8,48),
  rectangle(1637,1161,71,8),
  rectangle(1792,1157,71,9),
 ] as Polygon[],
 garden:[
  {name:'BUSH_FLOWER_PINK',x:1604,y:1148,width:34,height:29},
  {name:'BUSH_FLOWER_WHITE',x:1897,y:1150,width:33,height:28},
  {name:'FLOWERS_PURPLE',x:1617,y:1192,width:23,height:20},
  {name:'FLOWERS_WHITE',x:1887,y:1193,width:22,height:19},
  {name:'ROCK_SMALL',x:1605,y:1107,width:17,height:13},
  {name:'ROCK_SMALL',x:1892,y:1105,width:16,height:12},
 ] as const,
} as const;
