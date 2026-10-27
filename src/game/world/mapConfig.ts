import { placeWaterfalls } from './waterfallGeometry';
import { corridor, type Point, type Polygon } from '../navigation';
// Author coordinates follow the 1536 × 1024 master plan; one art pixel = two world units.
export const MAP = { width: 3072, height: 2048, pixel: 2, chunk: 256, navigationCell: 16 };
export const SCALE = { human: 1, humanHeight: 46, doorHeight: 64, chick: .30, cow: 1.35, horse: 1.4, pig: .7, panda: .9, sheep: .7, goat: .7, rabbit: .25 };
export const point = (x: number, y: number): Point => [x * 2, y * 2];
export const polygon = (p: Polygon): Polygon => p.map(([x,y]) => point(x,y));
export function oval(x: number,y: number,rx: number,ry: number,seed=0): Polygon {
 return Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,r=1+.035*Math.sin(i*2.7+seed);return point(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r);});
}
// Catmull-Rom curves are sampled once; drawing and collision use these same vertices.
export function curve(vertices: Polygon,samples=6): Polygon {
 const result:Point[]=[];
 for(let i=0;i<vertices.length-1;i++){
  const a=vertices[Math.max(0,i-1)],b=vertices[i],c=vertices[i+1],d=vertices[Math.min(vertices.length-1,i+2)];
  for(let s=0;s<samples;s++){const t=s/samples;result.push(point(...([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)) as [number,number])));}
 }
 result.push(point(...vertices[vertices.length-1]));return result;
}
// Closed shore/parcel outlines share the same sampler without a seam at the first vertex.
export function closedCurve(vertices:Polygon):Polygon {
 const extended=[vertices[vertices.length-1],...vertices,vertices[0],vertices[1]];
 return curve(extended).slice(6,-6);
}
export function parcel(x:number,y:number,rx:number,ry:number):Polygon {
 const r=Math.min(18,ry*.35);
 const outline=closedCurve([[x-rx+r,y-ry],[x+rx-r,y-ry],[x+rx,y-ry+r],[x+rx,y+ry-r],[x+rx-r,y+ry],[x-rx+r,y+ry],[x-rx,y+ry-r],[x-rx,y-ry+r]]);
 const ax=Math.max(...outline.map(p=>Math.abs(p[0]-x*2))),ay=Math.max(...outline.map(p=>Math.abs(p[1]-y*2)));
 return outline.map(([px,py])=>[x*2+(px-x*2)*rx*2/ax,y*2+(py-y*2)*ry*2/ay] as Point);
}
export const coast = curve([[0,755],[85,772],[170,790],[245,788],[300,827],[390,830],[490,865],[575,890],[645,935],[700,936],[750,895],[780,828],[835,817],[875,800],[940,810],[985,778],[1055,783],[1120,806],[1210,783],[1290,800],[1370,790],[1450,800],[1536,815]]);
export const mainland:Polygon = [point(0,0),point(1536,0),...coast.slice().reverse()];
export const islands = [
 {id:'south-beach',shape:[...coast.filter(([x])=>x<=1400),...curve([[700,936],[710,960],[671,1009],[600,977],[514,939],[421,915],[324,898],[232,870],[133,854],[56,825],[0,813]]).slice(1)]},
 {id:'duck-bank',shape:oval(140,598,102,67,1)},
 {id:'lake-island',shape:oval(425,715,76,46,2)},
 {id:'lake-rock',shape:oval(400,623,26,18,3)},
 {id:'sea-island-east',shape:oval(1120,888,55,36,4)},
 {id:'sea-island-small',shape:oval(1260,950,53,28,5)},
];
export const lake = closedCurve([[235,559],[289,552],[347,566],[410,555],[480,589],[516,638],[577,669],[573,711],[527,750],[503,786],[459,806],[396,800],[352,821],[307,804],[268,795],[239,768],[231,728],[241,683],[223,657],[205,619]]);
export const rivers = [
 {id:'north-river',line:curve([[575,0],[565,105],[597,154],[680,192],[750,219],[786,282],[775,359],[738,391]]),width:17},
 {id:'west-stream',line:curve([[575,142],[482,172],[400,204],[307,257],[232,284],[174,333],[157,361],[157,427],[163,469],[230,516],[300,558]]),width:13},
 {id:'lake-outlet',line:curve([[515,688],[609,722],[716,748],[797,778],[874,802],[900,865],[871,924],[880,1024]]),width:15},
 {id:'east-stream',line:curve([[1220,260],[1258,308],[1305,336],[1401,356],[1460,412],[1474,478],[1474,544],[1438,590],[1429,637],[1474,742],[1488,818]]),width:12},
];
export const sea:Polygon = [...coast,point(1536,1024),point(0,1024)];
export function ribbon(line:Polygon,width:number,variation=false):Polygon {
 const side=(sign:number)=>line.map((p,i)=>{const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],length=Math.hypot(b[0]-a[0],b[1]-a[1]),w=width*(variation?1+.035*Math.sin(i*.41)+.025*Math.sin(i*.13):1);return [p[0]+sign*(b[1]-a[1])/length*w,p[1]-sign*(b[0]-a[0])/length*w] as Point;});
 return [...side(1),...side(-1).reverse()];
}
// Springs and terminal pools soften the two inland cut-offs; river joins stay overlapping.
export const waterPools=[oval(738,391,20,15,7),oval(1220,260,21,16,9)];
export const rawWater = [sea,lake,...rivers.map(r=>ribbon(r.line,r.width*2)),...waterPools];
export interface Crossing {id:string; shape:Polygon; from:Point; to:Point; kind:'bridge'|'ramp'|'pier'}
const crossing=(id:string,a:Point,b:Point,width:number,kind:Crossing['kind']='bridge'):Crossing=>{
 const from=point(...a),to=point(...b),length=Math.hypot(to[0]-from[0],to[1]-from[1]),dx=(to[0]-from[0])/length*12,dy=(to[1]-from[1])/length*12;
 return {id,shape:corridor([[from[0]-dx,from[1]-dy],[to[0]+dx,to[1]+dy]],kind==='ramp'?width*2:width)[0],from,to,kind};
};
export const bridges = [
 crossing('north-bridge',[653,155],[707,231],15),
 crossing('plaza-bridge',[750,329],[805,350],13),
 crossing('panda-bridge',[273,243],[294,292],15),
 crossing('duck-bridge',[137,445],[182,454],16),
 crossing('duck-east-bridge',[224,624],[219,678],12),
 crossing('lake-island-bridge',[466,692],[600,688],11),
 crossing('beach-island-bridge',[365,822],[425,753],11),
 crossing('south-bridge',[594,680],[573,751],14),
 crossing('east-bridge',[1451,453],[1507,466],12),
 crossing('fishing-pier',[1400,775],[1361,846],13,'pier'),
];
export const cliffs = [
 {id:'north-west-ridge',line:curve([[0,118],[65,119],[124,104],[204,102],[296,87],[376,93],[466,120],[533,102]]),height:25},
 {id:'north-east-ridge',line:curve([[623,99],[691,113],[745,138],[826,143],[907,120],[973,95],[1051,83],[1131,99],[1197,89]]),height:24},
 {id:'chicken-terrace',line:curve([[249,477],[302,499],[381,512],[447,505],[493,489]]),height:22},
 {id:'house-terrace',line:curve([[769,640],[823,674],[897,684],[957,661],[979,629]]),height:21},
 {id:'west-falls-bank',line:curve([[131,365],[147,368],[169,368],[192,363]]),height:45},
 {id:'east-falls-bank',line:curve([[1445,486],[1463,488],[1486,488],[1505,486]]),height:45},
 {id:'south-coast',line:coast,height:30},
];
// Rock walls feather into the hillside at free ends instead of ending as rectangular cuts.
export const cliffFaces = cliffs.map(c=>{
 const distance=[0];for(let i=1;i<c.line.length;i++)distance.push(distance[i-1]+Math.hypot(c.line[i][0]-c.line[i-1][0],c.line[i][1]-c.line[i-1][1]));
 const total=distance[distance.length-1],atBorder=(p:Point)=>p[0]<=0||p[0]>=MAP.width;
 const lower=c.line.map(([x,y],i)=>{const edge=Math.min(atBorder(c.line[0])?Infinity:distance[i],atBorder(c.line[c.line.length-1])?Infinity:total-distance[i]);const t=Math.min(1,edge/70);return [x,y+c.height*2*t*t*(3-2*t)] as Point;});
 return [...c.line,...lower.reverse()];
});
export const ramps = [crossing('north-steps',[737,184],[740,123],16,'ramp'),crossing('forest-pass',[986,73],[991,131],20,'ramp'),crossing('west-pass',[390,73],[405,132],18,'ramp'),crossing('coop-steps',[466,478],[484,527],15,'ramp'),crossing('home-steps',[964,623],[983,678],15,'ramp'),crossing('beach-west-steps',[365,822],[350,883],16,'ramp'),crossing('beach-east-steps',[505,845],[506,915],17,'ramp'),crossing('pier-steps',[1400,775],[1370,830],17,'ramp')];
export const waterfalls = placeWaterfalls(rivers,cliffs,cliffFaces);
export interface Road {id:string; line:Polygon; surface:Polygon[]; width:number; secondary?:boolean}
// Author crossings as straight deck segments with aligned bank approaches. Curves start on dry land.
function roadLine(vertices:Polygon):Polygon {
 const result:Point[]=[];let start=0;
 const matches=(a:Point,b:Point)=>Math.hypot(a[0]*2-b[0],a[1]*2-b[1])<.1;
 const section=(points:Polygon)=>{if(points.length>1)result.push(...curve(points,12));else if(points.length)result.push(point(...points[0]));};
 for(let i=0;i<vertices.length-1;i++){
  const a=vertices[i],b=vertices[i+1],crossing=[...bridges,...ramps].find(c=>(matches(a,c.from)&&matches(b,c.to))||(matches(a,c.to)&&matches(b,c.from)));
  if(!crossing)continue;
  section(vertices.slice(start,i+1));
  for(let step=1;step<=6;step++)result.push(point(a[0]+(b[0]-a[0])*step/6,a[1]+(b[1]-a[1])*step/6));
  start=i+1;
 }
 section(vertices.slice(start));return result.filter((p,i)=>!i||Math.hypot(p[0]-result[i-1][0],p[1]-result[i-1][1])>.01);
}
const road=(id:string,p:Polygon,width=18,secondary=false):Road=>{
 const line=roadLine(p),first=line[0],last=line[line.length-1];
 return {id,line,width:width*2,secondary,surface:[ribbon(line,width,true),oval(first[0]/2,first[1]/2,width/2,width/2),oval(last[0]/2,last[1]/2,width/2,width/2)]};
};
export const roads:Road[] = [
 road('plaza-coop',[[704,482],[596,477],[515,460],[446,426],[370,431]]),
 road('plaza-mixed',[[699,465],[649,417],[602,376],[611,315]]),
 road('mixed-cows',[[611,315],[667,360],[719,369],[750,329],[805,350],[853,367],[920,350],[987,365]],13,true),
 road('plaza-cows',[[739,472],[818,430],[883,404],[956,397],[987,365]]),
 road('plaza-crops',[[759,493],[848,534],[935,545],[1015,552],[1090,543]]),
 road('crops-entry',[[1090,543],[1090,531]],10,true),
 road('crops-greenhouse',[[1090,543],[1164,558],[1230,542],[1323,485]]),
 road('plaza-home',[[704,526],[683,594],[709,649],[774,622],[868,610]]),
 road('home-redil',[[870,610],[994,573],[1085,562],[1169,634]]),
 road('redil-rabbits',[[1169,634],[1253,586],[1312,610],[1399,675]]),
 road('coop-pandas',[[370,431],[265,415],[263,347],[294,292],[273,243],[247,198]],15),
 road('mixed-north',[[611,315],[611,229],[649,245],[707,231],[653,155],[683,155],[737,184],[740,123],[777,75]],15),
 road('cows-woodland',[[987,365],[1118,393],[1173,270],[1144,169]],16),
 road('forest-woodland',[[777,75],[915,57],[986,73],[991,131],[1062,153],[1144,169]],12,true),
 road('panda-forest',[[247,198],[358,151],[405,132],[390,73],[491,52]],11,true),
 road('coop-ducks',[[370,431],[280,437],[224,451],[219,475],[182,454],[137,445],[101,490],[83,547],[140,598]],16),
 road('ducks-lake',[[140,598],[189,615],[224,624],[219,678],[218,695],[203,721]],12,true),
 road('plaza-beach',[[683,594],[607,620],[594,680],[573,751],[555,804],[505,845],[506,915]],18),
 road('lake-island',[[607,620],[614,665],[600,688],[466,692],[425,715]],11,true),
 road('island-beach',[[425,715],[425,753],[365,822],[350,883],[321,888]],11,true),
 road('east-shore',[[1325,485],[1390,512],[1430,486],[1451,453],[1507,466],[1520,480],[1524,563],[1510,628],[1492,680],[1507,779]],12,true),
 road('fishing',[[1399,675],[1370,721],[1400,775],[1361,846]],13,true),
 road('coop-south',[[446,426],[453,456],[466,478],[484,527],[538,568],[607,620]],12,true),
 road('home-south',[[875,609],[939,611],[964,623],[983,678],[1039,712],[1168,637]],12,true),
 road('west-coast',[[140,598],[82,664],[73,710],[123,746],[192,753]],11,true),
];
