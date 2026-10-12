import { rectangle, type Point } from '../game/navigation';
import type { WorldEntity } from '../game/entities';
// One switch removes event objects, guests, collisions and the launcher together.
export const CELEBRATION_MODE = true;
export const celebrationMessages = [
 {id:'celebration-sign',text:'¡La granja está muy feliz por ti!',position:[694,355] as Point,size:[100,82] as Point,style:'wood',flowers:true,interaction:true},
];
const prop=(id:string,position:Point,frame:number,size:Point,footprint:Point):WorldEntity=>({id,position,sprite:{key:'celebration-props',frame,size,origin:[.5,.9]},collision:rectangle(-footprint[0]/2,-footprint[1]/2,...footprint),depthAnchor:0,interaction:{kind:'detail',text:'Un detalle preparado con cariño para este día bonito.'}});
export const celebrationEntities:WorldEntity[]=[
 ...celebrationMessages.map(m=>({...prop(m.id,m.position,0,m.size,[52,12]),interaction:{kind:'message' as const,text:m.text}})),
 prop('cake-table',[908,360],1,[96,80],[68,22]),
 {...prop('photo-backdrop',[841,332],2,[105,94],[0,0]),collision:undefined,interaction:{kind:'detail',text:'Nuestro rincón para guardar un día bonito.'}},
 {id:'photo-post-left',position:[801,327],collision:rectangle(-4,-4,8,8),depthAnchor:0},
 {id:'photo-post-right',position:[878,327],collision:rectangle(-4,-4,8,8),depthAnchor:0},
 prop('flowers-west',[666,459],3,[38,38],[18,10]),
 prop('flowers-east',[954,445],3,[38,38],[18,10]),
 prop('balloons-west',[655,374],4,[43,68],[12,10]),
 prop('balloons-east',[966,372],4,[43,68],[12,10]),
 prop('celebration-lamp-west',[675,405],5,[35,63],[8,8]),
 prop('celebration-lamp-east',[945,406],5,[35,63],[8,8]),
 prop('ldc-tools',[912,477],6,[55,43],[35,17]),
 prop('gifts',[725,477],7,[48,39],[30,15]),
 {id:'bunting-post-left',position:[658,342],collision:rectangle(-3,-3,6,6),depthAnchor:0},
 {id:'bunting-post-right',position:[958,342],collision:rectangle(-3,-3,6,6),depthAnchor:0},
 {id:'surprise-launcher',position:[869,462],collision:rectangle(-9,-5,18,10),depthAnchor:0,interaction:{kind:'launcher',text:'🎆 Iniciar sorpresa'}},
];
export const gatheringPoints:Point[]=[[710,420],[744,442],[794,450],[839,436],[892,415],[880,389],[840,354],[749,351],[711,387],[920,430],[875,444],[760,439],[820,455],[860,423],[710,370],[906,395],[708,444],[930,389],[765,354],[904,449],[720,423],[850,449]];
export const globalDestinations:Point[]=[[255,349],[455,479],[690,445],[975,625],[1285,312],[1535,508],[205,810],[730,303],[970,470],[1240,547],[600,610],[278,623]];
