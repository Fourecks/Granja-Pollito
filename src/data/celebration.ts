import { zoneById, zones } from '../game/world/zones';
import { rectangle, type Point } from '../game/navigation';
import type { WorldEntity } from '../game/entities';
// Existing surprise stays available on request; no props or animal guests populate phase 1.
export const CELEBRATION_MODE = true;
export const celebrationMessages = [
 {id:'celebration-sign',text:'¡La granja\nestá muy\nfeliz por ti!',position:[690,355] as Point,size:[103,84] as Point,frame:0,offset:[0,-35] as Point,fontSize:9,width:68},
 {id:'spiritual-sign',text:'La granja también\nse alegra por tu\nprogreso espiritual ♥',position:[635,404] as Point,size:[104,67] as Point,frame:9,offset:[0,-25] as Point,fontSize:6.5,width:82},
 {id:'progress-banner',text:'Sigue\nhaciendo\nprogresos\n\nProv. 24:16',position:[987,374] as Point,size:[48,90] as Point,frame:10,offset:[0,-43] as Point,fontSize:7,width:32},
];
const prop=(id:string,position:Point,frame:number,size:Point,footprint:Point):WorldEntity=>({id,position,sprite:{key:'plaza-props',frame,size,origin:[.5,.96]},collision:rectangle(-footprint[0]/2,-footprint[1]/2,...footprint),depthAnchor:0,interaction:{kind:'detail',text:'Los pollitos prepararon este rincón con flores y mucho cariño.'}});
const post=(id:string,position:Point,w=9):WorldEntity=>({id,position,collision:rectangle(-w/2,-5,w,10),depthAnchor:0});
const openStructure=(id:string,position:Point,frame:number,size:Point):WorldEntity=>({...prop(id,position,frame,size,[0,0]),collision:undefined});
export const celebrationEntities:WorldEntity[]=[
 ...celebrationMessages.map(m=>({...prop(m.id,m.position,m.frame,m.size,m.id==='progress-banner'?[12,10]:[m.size[0]*.7,12]),interaction:{kind:'message' as const,text:m.text}})),
 prop('cake-table',[908,360],1,[102,90],[76,24]),
 openStructure('photo-backdrop',[817,333],2,[120,108]),
 post('photo-post-left',[768,331],14),post('photo-post-right',[866,331],14),
 prop('jw-publications',[624,456],8,[50,68],[29,15]),
 prop('publication-table',[667,477],15,[50,46],[34,17]),
 prop('celebration-bench',[980,437],11,[69,43],[49,17]),
 prop('ldc-tools',[913,486],6,[63,48],[44,19]),
 prop('gifts',[948,388],7,[48,44],[28,16]),
 prop('gifts-entry',[728,487],7,[43,39],[26,15]),
 ...([[640,354],[965,344],[978,403],[695,492],[595,425],[948,493]] as Point[]).map((p,i)=>prop(`balloons-${i}`,p,4,[36,60],[12,10])),
 ...([[675,405],[945,406],[679,512],[1008,473]] as Point[]).map((p,i)=>prop(`celebration-lamp-${i}`,p,5,[26,58],[8,8])),
 ...([[648,377],[736,342],[894,337],[962,363],[653,460],[992,451],[893,500],[748,494],[678,346],[935,351]] as Point[]).map((p,i)=>prop(`flower-pot-${i}`,p,3,[27,30],[14,10])),
 ...([[693,471],[780,492],[851,488],[927,509]] as Point[]).map((p,i)=>prop(`flower-border-${i}`,p,13,[45,19],[35,8])),
 openStructure('bunting-west',[691,318],12,[128,72]),post('bunting-west-left',[635,315]),post('bunting-west-right',[747,315]),
 openStructure('bunting-east',[933,302],12,[116,65]),post('bunting-east-left',[882,299]),post('bunting-east-right',[984,299]),
 {...prop('surprise-launcher',[869,462],14,[30,35],[18,10]),interaction:{kind:'launcher',text:'🎆 Iniciar sorpresa'}},
];
// Preserve clear approaches around the fountain and between all solid props.
const originalGathering:Point[]=[[710,420],[744,442],[794,450],[839,436],[892,415],[880,389],[840,354],[851,373],[711,387],[920,430],[875,444],[760,439],[820,455],[860,423],[710,370],[906,395],[708,444],[930,418],[822,344],[904,449],[720,423],[850,449],[706,405],[852,386],[844,410],[905,423],[737,454],[802,444],[857,455],[919,458]];
const anchor=zoneById.centralPlaza.center;
const atPlaza=([x,y]:Point):Point=>[x-805+anchor[0],y-415+anchor[1]];
export const gatheringPoints=originalGathering.map(atPlaza);
export const celebrationHumans:Record<string,Point>={kiara:atPlaza([748,359]),pollito:atPlaza([798,359]),minnie:atPlaza([842,359])};
export const globalDestinations:Point[]=zones.filter(z=>!['horsePaddock','pigPaddock'].includes(z.id)).map(z=>z.center);
