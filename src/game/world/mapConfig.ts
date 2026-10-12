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
export function curve(vertices: Polygon): Polygon {
 const result:Point[]=[];
 for(let i=0;i<vertices.length-1;i++){
  const a=vertices[Math.max(0,i-1)],b=vertices[i],c=vertices[i+1],d=vertices[Math.min(vertices.length-1,i+2)];
  for(let s=0;s<6;s++){const t=s/6;result.push(point(...([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)) as [number,number])));}
 }
 result.push(point(...vertices[vertices.length-1]));return result;
}
export const coast = polygon([[0,755],[85,772],[170,790],[245,788],[300,827],[390,830],[490,865],[575,890],[645,935],[700,936],[750,895],[780,828],[835,817],[875,800],[940,810],[985,778],[1055,783],[1120,806],[1210,783],[1290,800],[1370,790],[1450,800],[1536,815]]);
export const mainland:Polygon = [point(0,0),point(1536,0),...coast.slice().reverse()];
export const islands = [
 {id:'south-beach',shape:polygon([[0,755],[85,772],[170,790],[245,788],[300,827],[390,830],[490,865],[575,890],[645,935],[700,936],[710,960],[671,1009],[600,977],[514,939],[421,915],[324,898],[232,870],[133,854],[56,825],[0,813]])},
 {id:'duck-bank',shape:oval(140,598,102,67,1)},
 {id:'lake-island',shape:oval(425,715,76,46,2)},
 {id:'lake-rock',shape:oval(400,623,26,18,3)},
 {id:'sea-island-east',shape:oval(1120,888,55,36,4)},
 {id:'sea-island-small',shape:oval(1260,950,53,28,5)},
];
export const lake = polygon([[235,559],[289,552],[347,566],[410,555],[480,589],[516,638],[577,669],[573,711],[527,750],[503,786],[459,806],[396,800],[352,821],[307,804],[268,795],[239,768],[231,728],[250,682],[235,644],[218,617]]);
export const rivers = [
 {id:'north-river',line:curve([[575,0],[565,105],[597,154],[680,192],[750,219],[786,282],[775,359],[738,391]]),width:17},
 {id:'west-stream',line:curve([[575,142],[482,172],[400,204],[307,257],[232,284],[174,333],[157,393],[163,469],[230,516],[300,558]]),width:13},
 {id:'lake-outlet',line:curve([[515,688],[609,722],[716,748],[797,778],[874,802],[900,865],[871,924],[880,1024]]),width:15},
 {id:'east-stream',line:curve([[1220,260],[1258,308],[1305,336],[1401,356],[1460,412],[1474,490],[1438,558],[1429,637],[1474,742],[1488,818]]),width:12},
];
export const sea:Polygon = [...coast,point(1536,1024),point(0,1024)];
export function ribbon(line:Polygon,width:number):Polygon {
 const side=(sign:number)=>line.map((p,i)=>{const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],length=Math.hypot(b[0]-a[0],b[1]-a[1]);return [p[0]+sign*(b[1]-a[1])/length*width,p[1]-sign*(b[0]-a[0])/length*width] as Point;});
 return [...side(1),...side(-1).reverse()];
}
export const rawWater = [sea,lake,...rivers.map(r=>ribbon(r.line,r.width*2))];
export interface Crossing {id:string; shape:Polygon; from:Point; to:Point; kind:'bridge'|'ramp'|'pier'}
const crossing=(id:string,a:Point,b:Point,width:number,kind:Crossing['kind']='bridge'):Crossing=>{
 const from=point(...a),to=point(...b),length=Math.hypot(to[0]-from[0],to[1]-from[1]),dx=(to[0]-from[0])/length*12,dy=(to[1]-from[1])/length*12;
 return {id,shape:corridor([[from[0]-dx,from[1]-dy],[to[0]+dx,to[1]+dy]],width*2)[0],from,to,kind};
};
export const bridges = [
 crossing('north-bridge',[665,170],[700,213],13),
 crossing('plaza-bridge',[750,329],[805,350],14),
 crossing('panda-bridge',[273,243],[294,292],12),
 crossing('duck-bridge',[137,445],[182,454],14),
 crossing('duck-east-bridge',[220,595],[261,626],14),
 crossing('lake-island-bridge',[466,692],[550,725],14),
 crossing('beach-island-bridge',[363,817],[425,753],14),
 crossing('south-bridge',[594,680],[573,751],15),
 crossing('east-bridge',[1451,453],[1507,466],13),
 crossing('fishing-pier',[1400,775],[1361,846],17,'pier'),
];
export const cliffs = [
 {id:'north-west-ridge',line:polygon([[0,118],[65,119],[124,104],[204,102],[296,87],[376,93],[466,120],[533,102]]),height:25},
 {id:'north-east-ridge',line:polygon([[623,99],[691,113],[745,138],[826,143],[907,120],[973,95],[1051,83],[1131,99],[1197,89]]),height:24},
 {id:'chicken-terrace',line:polygon([[249,477],[302,499],[381,512],[447,505],[493,489]]),height:22},
 {id:'house-terrace',line:polygon([[769,640],[823,674],[897,684],[957,661],[979,629]]),height:21},
 {id:'south-coast',line:coast,height:30},
];
export const cliffFaces = cliffs.map(c=>[...c.line,...c.line.slice().reverse().map(([x,y])=>[x,y+c.height*2] as Point)]);
export const ramps = [crossing('forest-pass',[986,73],[991,131],20,'ramp'),crossing('west-pass',[390,73],[405,132],18,'ramp'),crossing('coop-steps',[466,478],[484,527],15,'ramp'),crossing('home-steps',[964,623],[983,678],15,'ramp'),crossing('beach-west-steps',[350,838],[350,883],16,'ramp'),crossing('beach-east-steps',[505,845],[506,915],17,'ramp'),crossing('pier-steps',[1400,775],[1370,830],17,'ramp')];
export const waterfalls = [
 {id:'north-falls',position:point(565,43),width:38,height:103},
 {id:'west-falls',position:point(155,363),width:23,height:60},
 {id:'east-falls',position:point(1459,487),width:25,height:65},
 {id:'south-falls',position:point(889,799),width:23,height:52},
];
export interface Road {id:string; line:Polygon; width:number; secondary?:boolean}
const road=(id:string,p:Polygon,width=18,secondary=false):Road=>({id,line:curve(p),width:width*2,secondary});
export const roads:Road[] = [
 road('plaza-coop',[[704,482],[596,477],[515,460],[446,426],[370,431]]),
 road('plaza-mixed',[[699,465],[649,417],[602,376],[611,315]]),
 road('plaza-cows',[[739,472],[818,430],[863,401],[978,399],[989,337]]),
 road('plaza-crops',[[759,493],[848,534],[935,545],[1041,492]]),
 road('crops-greenhouse',[[1050,493],[1155,546],[1230,542],[1325,485]]),
 road('plaza-home',[[704,526],[683,594],[709,649],[774,622],[868,610]]),
 road('home-redil',[[870,610],[994,573],[1085,562],[1169,634]]),
 road('redil-rabbits',[[1169,634],[1253,586],[1312,610],[1399,675]]),
 road('coop-pandas',[[370,431],[265,415],[263,347],[294,292],[273,243],[247,198]],15),
 road('mixed-north',[[611,315],[611,229],[650,212],[700,213],[665,170],[728,157],[777,99]],15),
 road('cows-woodland',[[989,337],[1118,373],[1173,270],[1144,169]],16),
 road('forest-woodland',[[777,99],[915,57],[986,73],[991,131],[1062,153],[1144,169]],12,true),
 road('panda-forest',[[247,198],[358,151],[405,132],[390,73],[491,52]],11,true),
 road('coop-ducks',[[370,431],[275,495],[219,475],[182,454],[137,445],[101,490],[83,547],[140,598]],16),
 road('ducks-lake',[[140,598],[187,576],[220,595],[261,626],[252,681],[279,730]],12,true),
 road('plaza-beach',[[683,594],[607,620],[594,680],[573,751],[555,804],[505,845],[506,915]],18),
 road('lake-island',[[607,620],[579,672],[550,725],[466,692],[425,715]],11,true),
 road('island-beach',[[425,715],[425,753],[363,817],[350,838],[350,883],[321,888]],11,true),
 road('east-shore',[[1325,485],[1390,512],[1430,486],[1451,453],[1507,466],[1510,575],[1492,680],[1507,779]],12,true),
 road('fishing',[[1399,675],[1370,721],[1400,775],[1361,846]],13,true),
 road('west-coast',[[140,598],[82,664],[73,710],[123,746],[173,793]],11,true),
];
