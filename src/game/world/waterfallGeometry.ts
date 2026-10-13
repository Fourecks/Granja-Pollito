import { inside, type Point, type Polygon } from '../navigation';
interface River {id:string;line:Polygon;width:number}
interface Cliff {id:string;line:Polygon;height:number}
export interface WaterfallPlacement {id:string;riverId:string;cliffId:string;cliffIndex:number;position:Point;foot:Point;flow:Polygon;width:number;height:number;kind:'small'|'medium';historical?:boolean}
function intersection(a:Point,b:Point,c:Point,d:Point){
 const dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)return;
 const cx=c[0]-a[0],cy=c[1]-a[1],t=(cx*ey-cy*ex)/den,u=(cx*dy-cy*dx)/den;
 if(t>=0&&t<=1&&u>=0&&u<=1)return {t,p:[a[0]+dx*t,a[1]+dy*t] as Point};
}
/** Derive drops from the historical river/upper-edge/lower-face geometry, never invent a wall. */
export function placeWaterfalls(rivers:readonly River[],cliffs:readonly Cliff[],faces:readonly Polygon[]):WaterfallPlacement[]{
 const result:WaterfallPlacement[]=[];
 for(const river of rivers)for(const [ci,cliff] of cliffs.entries()){
  for(let i=0;i<river.line.length-1;i++){
   const a=river.line[i],b=river.line[i+1];
   for(let j=0;j<cliff.line.length-1;j++){
    const hit=intersection(a,b,cliff.line[j],cliff.line[j+1]);if(!hit)continue;
    const flow:Point[]=[hit.p];let foot:Point|undefined;
    for(let k=i;k<river.line.length-1&&!foot;k++){
     const start=k===i?hit.p:river.line[k],end=river.line[k+1],cuts=[];
     for(let n=0;n<faces[ci].length;n++){const cut=intersection(start,end,faces[ci][n],faces[ci][(n+1)%faces[ci].length]);if(cut&&cut.t>1e-6)cuts.push(cut);}
     cuts.sort((x,y)=>x.t-y.t);
     for(const cut of cuts){const t=Math.min(1,cut.t+.0001),after:Point=[start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t];if(!inside(after,faces[ci])){foot=cut.p;break;}}
     flow.push(foot??end);
    }
    // A historical stream may end inside the coastal face: its mouth continues into
    // the existing sea. Extend only the visual descent tangent, never the river geometry.
    if(!foot&&flow.length>1){const end=flow[flow.length-1],prev=flow[flow.length-2],dx=end[0]-prev[0],dy=end[1]-prev[1],length=Math.hypot(dx,dy);
     if(dy>0&&length>0){const tail:Point=[end[0]+dx/length*cliff.height*4,end[1]+dy/length*cliff.height*4],cuts=[];
      for(let n=0;n<faces[ci].length;n++){const cut=intersection(end,tail,faces[ci][n],faces[ci][(n+1)%faces[ci].length]);if(cut&&cut.t>1e-6)cuts.push(cut);}cuts.sort((x,y)=>x.t-y.t);
      if(cuts.length){foot=cuts[0].p;flow.push(foot);}
     }
    }
    if(!foot||foot[1]-hit.p[1]<8)continue;
    if(result.some(f=>f.riverId===river.id&&f.cliffId===cliff.id&&Math.hypot(f.position[0]-hit.p[0],f.position[1]-hit.p[1])<2))continue;
    const id=cliff.id==='west-falls-bank'?'west-falls':cliff.id==='east-falls-bank'?'east-falls':river.id==='lake-outlet'?'south-falls':'east-mouth-falls';
    result.push({id,riverId:river.id,cliffId:cliff.id,cliffIndex:ci,position:hit.p,foot,flow,width:river.width*2,height:(foot[1]-hit.p[1])/2,kind:cliff.height>30?'medium':'small'});
   }
  }
 }
 // Git anchor: point(565,43); user-approved local historical visual drop only.
 result.unshift({id:'north-falls',riverId:'north-river',cliffId:'historical-north-drop',cliffIndex:-1,position:[1130,86],foot:[1130,146],flow:[[1130,86],[1130,146]],width:34,height:30,kind:'medium',historical:true});
 return result;
}
