import { corridor, rectangle, type Polygon } from '../game/navigation';
export const MAP = { width: 1672, height: 940 };
export const coopPen: Polygon = [[98,312],[245,291],[354,282],[516,326],[458,388],[292,406],[105,367]];
export const cowPen: Polygon = [[1170,292],[1270,268],[1380,291],[1328,334],[1220,335],[1160,308]];
export const waterZones: Polygon[] = [
 [[1580,220],[1645,218],[1672,286],[1672,461],[1572,492],[1460,443],[1450,379],[1510,326],[1562,311]],
 [[1460,497],[1535,540],[1478,590],[1490,650],[1400,723],[1300,736],[1200,710],[1185,654],[1230,580],[1300,563],[1350,535]],
];
export const bridge: Polygon = [[1380,465],[1410,450],[1560,497],[1537,526]];
export const walkableZones: Polygon[] = [
 coopPen, cowPen, rectangle(646,337,332,153), rectangle(420,470,95,25),
 ...corridor([[455,366],[550,392],[640,410],[680,385]],27),
 ...corridor([[718,357],[730,303],[738,267]],22),
 ...corridor([[940,414],[1020,378],[1115,385],[1250,396],[1340,352],[1300,323]],24),
 ...corridor([[1100,390],[1275,432],[1390,480],[1535,510],[1580,544]],25),
 ...corridor([[690,447],[625,470],[550,474],[460,483],[435,505]],22),
 ...corridor([[585,471],[750,528],[830,580],[960,622],[1140,584],[1240,547]],25),
 ...corridor([[710,480],[600,610],[390,646],[278,623],[260,724],[205,810]],30),
 rectangle(1060,472,250,81), rectangle(1550,495,88,70), bridge,
];
export const solidZones: Polygon[] = [
 rectangle(140,99,283,181), rectangle(650,55,289,199), rectangle(1010,115,287,168),
 rectangle(1025,394,120,110), rectangle(730,369,95,59),
 rectangle(407,497,300,93), rectangle(848,525,144,70),
 rectangle(280,460,70,88), rectangle(1195,435,73,57),
 // Fence rails: only the authored gate gaps are passable.
 ...corridor([[99,365],[292,411],[455,389]],5),
 ...corridor([[1160,310],[1220,343],[1300,354]],5),
 ...waterZones,
];
export interface WorldObjectData { id: string; x: number; y: number; hitWidth: number; hitHeight: number; enter?: InteriorId; }
export type InteriorId = 'home' | 'coop' | 'barn' | 'shed';
export const worldBuildings = [
 { id:'coop', x:290,y:225,width:280,height:140,door:[345,276] as const },
 { id:'home', x:782,y:158,width:220,height:178,door:[745,264] as const },
 { id:'barn', x:1150,y:218,width:260,height:150,door:[1186,291] as const },
 { id:'shed', x:1075,y:449,width:140,height:105,door:[1080,497] as const },
];
export const worldObjects: WorldObjectData[] = [
 ...worldBuildings.map(b=>({id:b.id,x:b.x,y:b.y,hitWidth:b.width,hitHeight:b.height})),
 ...worldBuildings.map(b=>({id:`door-${b.id}`,x:b.door[0],y:b.door[1],hitWidth:40,hitHeight:42,enter:b.id as InteriorId})),
 {id:'garden',x:560,y:540,hitWidth:300,hitHeight:120},
 {id:'sign',x:282,y:586,hitWidth:177,hitHeight:70},
 {id:'pond',x:1320,y:653,hitWidth:190,hitHeight:120},
 {id:'bench',x:800,y:321,hitWidth:96,hitHeight:42},
 {id:'secret-flower',x:959,y:574,hitWidth:65,hitHeight:45},
 {id:'well',x:789,y:393,hitWidth:80,hitHeight:54},
];
export const mapDecorations = [
 {id:'coop-front', depth:414, polygon:[[85,340],[293,393],[470,355],[477,396],[292,432],[90,378]] as Polygon},
 {id:'garden-tree',depth:554,polygon:[[268,429],[331,419],[378,465],[373,510],[333,546],[284,519],[264,478]] as Polygon},
 {id:'barn-front',depth:361,polygon:[[1121,305],[1290,340],[1370,302],[1378,330],[1290,368],[1114,329]] as Polygon},
 {id:'greenhouse-bush',depth:501,polygon:[[1147,416],[1220,410],[1262,445],[1255,495],[1194,514],[1145,481]] as Polygon},
];
export const navigation = { ...MAP, walkable: walkableZones, obstacles: solidZones, bridges: [bridge] };
