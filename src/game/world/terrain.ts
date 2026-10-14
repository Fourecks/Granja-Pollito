import Phaser from 'phaser';
import { MAP, mainland, islands, rawWater, cliffFaces, roads, ramps } from './mapConfig';
import { zones } from './zones';
import { naturalRockColor } from './rockMaterial';
import { visualRoadMask } from './roadAppearance';
import type { Polygon } from '../navigation';
const W=MAP.width/MAP.pixel,H=MAP.height/MAP.pixel;
export interface WorldMasks { land:Uint8ClampedArray; water:Uint8ClampedArray; surfaces:Uint8ClampedArray; paths:Uint8ClampedArray; cliffs:Uint8ClampedArray; cliffWalls?:Uint8ClampedArray }
function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function fill(ctx:CanvasRenderingContext2D,shape:Polygon,color:string){ctx.fillStyle=color;ctx.beginPath();shape.forEach(([x,y],i)=>i?ctx.lineTo(x/MAP.pixel,y/MAP.pixel):ctx.moveTo(x/MAP.pixel,y/MAP.pixel));ctx.closePath();ctx.fill();}
function mask(draw:(ctx:CanvasRenderingContext2D)=>void){const c=canvas(W,H),ctx=c.getContext('2d',{willReadFrequently:true})!;draw(ctx);return ctx.getImageData(0,0,W,H).data;}
export function createMasks():WorldMasks {
 const land=mask(ctx=>{fill(ctx,mainland,'#ffffff');for(const i of islands)fill(ctx,i.shape,'#ffffff');});
 const water=mask(ctx=>{for(const w of rawWater)fill(ctx,w,'#ffffff');ctx.globalCompositeOperation='destination-out';for(const i of islands)fill(ctx,i.shape,'#ffffff');});
 const cliffs=mask(ctx=>{for(const c of cliffFaces)fill(ctx,c,'#ffffff');ctx.globalCompositeOperation='destination-out';for(const r of ramps)fill(ctx,r.shape,'#ffffff');});
 const cliffWalls=mask(ctx=>{for(const c of cliffFaces)fill(ctx,c,'#ffffff');});
 // Binary stamps prevent antialiased material IDs from turning parcel edges blue.
 const surfaces=new Uint8ClampedArray(W*H*4),paths=new Uint8ClampedArray(W*H*4),stampCanvas=canvas(W,H),stampContext=stampCanvas.getContext('2d',{willReadFrequently:true})!;
 const stamp=(id:number,draw:(ctx:CanvasRenderingContext2D)=>void,target=surfaces)=>{
  stampContext.clearRect(0,0,W,H);draw(stampContext);const pixels=stampContext.getImageData(0,0,W,H).data;
  for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>127){target[i]=id;target[i+3]=255;}
 };
 stamp(6,ctx=>{ctx.strokeStyle='#fff';ctx.lineWidth=28;ctx.lineJoin='round';ctx.beginPath();mainland.slice(2).forEach(([x,y],i)=>i?ctx.lineTo(x/2,y/2-5):ctx.moveTo(x/2,y/2-5));ctx.stroke();fill(ctx,islands.find(i=>i.id==='south-beach')!.shape,'#fff');});
 for(const z of zones){const id={grass:9,earth:2,mud:3,soil:4,stone:5,sand:6}[z.surface];stamp(z.id==='pandaSanctuary'?10:z.id==='northForest'||z.id==='woodland'?11:id,ctx=>fill(ctx,z.shape,'#fff'));}
 for(const r of roads)stamp(1,ctx=>{for(const shape of r.surface)fill(ctx,shape,'#fff');},paths);
 // Paths end at the plaza's paving rather than painting over its centre.
 for(let i=0;i<paths.length;i+=4)if(surfaces[i]===5)paths[i+3]=0;
 stamp(5,ctx=>fill(ctx,zones.find(z=>z.id==='centralPlaza')!.shape,'#fff'));
 return {land,water,cliffs,cliffWalls,surfaces,paths};
}
const hash=(x:number,y:number,seed=0)=>{let n=Math.imul(x+seed*109,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
function patchNoise(x:number,y:number){
 const size=43,cx=Math.floor(x/size),cy=Math.floor(y/size),u=x/size-cx,v=y/size-cy,s=u*u*(3-2*u),t=v*v*(3-2*v);
 const n=(a:number,b:number)=>(hash(a,b,2)%1000)/1000;
 return (n(cx,cy)*(1-s)+n(cx+1,cy)*s)*(1-t)+(n(cx,cy+1)*(1-s)+n(cx+1,cy+1)*s)*t;
}
const palette:Record<number,number[][]>={
 0:[[105,143,46],[117,155,51],[127,162,56],[133,166,59],[110,148,44],[145,171,62]],
 1:[[194,148,83],[208,162,95],[220,177,108],[214,168,99],[202,155,89]],
 2:[[165,139,71],[184,152,80],[190,158,85],[158,140,64],[154,145,60]],
 3:[[112,94,76],[122,101,81],[137,110,83],[116,104,86],[146,116,86]],
 4:[[120,85,48],[139,97,50],[149,105,54],[127,89,47],[157,112,60]],
 5:[[195,181,146],[218,203,164],[225,211,173],[210,194,155],[201,185,151]],
 6:[[223,198,141],[235,213,157],[239,218,165],[229,204,146],[218,192,132]],
 7:[[97,91,83],[111,104,93],[132,118,101],[146,128,108],[116,109,98]],
 9:[[127,160,66],[137,166,71],[145,170,73],[122,155,60]],
 10:[[95,141,63],[109,151,65],[120,158,72],[105,145,65]],
 11:[[88,131,49],[99,142,52],[114,151,58],[102,139,49]],
 8:[[19,120,151],[21,129,162],[24,138,168],[25,144,173],[20,124,159]],
};
function rgba(data:Uint8ClampedArray,i:number,c:number[],alpha=255){data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=alpha;}
/** Shared rock at the dry wall and beside built-in stone stairs. */
export function cliffRockColor(gx:number,gy:number){return naturalRockColor(gx,gy);}
export function cliffFaceColor(gx:number,gy:number,masks:WorldMasks){
 let color=cliffRockColor(gx,gy);
 const wall=masks.cliffWalls??masks.cliffs;
 let up=0,down=0;
 while(up<48&&gy-up>0&&wall[((gy-up-1)*W+gx)*4+3]>127)up++;
 while(down<48&&gy+down+1<H&&wall[((gy+down+1)*W+gx)*4+3]>127)down++;
 const {land,water,surfaces}=masks;
 const rim=1+hash(Math.floor(gx/3),0,19)%3,above=((gy-up-1)*W+gx)*4;
 const grass=above>=0&&land[above+3]>127&&!water[above+3]&&[0,9,10,11].includes(surfaces[above]);
 if(up<rim)color=grass?[100+up*3,125+up*2,59]:[133,122,91];
 else if(up<rim+3)color=color.map(v=>v-25+(up-rim)*4);
 else if(down<4)color=color.map(v=>v-14+down*2);
 return color;
}
export class TerrainLayers {
 readonly masks=createMasks(); private roadPixels=visualRoadMask(this.masks.surfaces); readonly objects:Phaser.GameObjects.Image[]=[];
 constructor(private scene:Phaser.Scene){
  this.chunks('water',-30);this.chunks('terrain',-20);this.chunks('surfaces',-18);this.chunks('paths',-17);this.chunks('topography',-16);

 }
 private chunks(layer:'water'|'terrain'|'surfaces'|'paths'|'topography',depth:number){
  const {land,water,surfaces,cliffs}=this.masks,paths=this.roadPixels,n=MAP.chunk/MAP.pixel;
  for(let cy=0;cy<H;cy+=n)for(let cx=0;cx<W;cx+=n){
   const c=canvas(n,n),ctx=c.getContext('2d')!,image=ctx.createImageData(n,n);let filled=false;
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const gx=cx+x,gy=cy+y,i=(gy*W+gx)*4,j=(y*n+x)*4;if(gx>=W||gy>=H)continue;
    const isWater=water[i+3]>127,isLand=land[i+3]>127&&!isWater,id=layer==='paths'?paths[i]:surfaces[i];
    if(layer==='water'?!isWater:layer==='terrain'?!isLand:layer==='surfaces'?!isLand||!id:layer==='paths'?!isLand||paths[i+3]<128:cliffs[i+3]<128)continue;
    filled=true;const h=hash(gx,gy),patch=patchNoise(gx,gy);
    const material=layer==='water'?8:layer==='topography'?7:layer==='terrain'?0:id;
    const colors=palette[material],blend=patch*(colors.length-1),low=Math.floor(blend),mix=blend-low;
    let color=colors[low].map((v,k)=>Math.round(v*(1-mix)+colors[Math.min(low+1,colors.length-1)][k]*mix)+(h%7-3));
    if(material===0||material>=9){ // Sparse blades, soft patch changes and tiny dirt inclusions.
     const tuft=hash(gx>>2,gy>>2,5)%23===0;if(tuft&&gx%4===1){color=color.map((v,k)=>v+(gy%4<2?(k===1?12:5):-12));}
     if(h%227===0)color=[160,153,76];
    }
    if(material===0){
     const near=(distance:number)=>[-W*distance,W*distance,-distance,distance].some(o=>{const v=i+o*4;return v>=0&&v<water.length&&water[v+3]>127;});
     if(near(2))color=h%3===0?[102,100,81]:[145,129,87];else if(near(5))color=h%4===0?[148,135,72]:[157,149,74];
    }
    if(material===4){const furrow=(gy+Math.floor(gx/50)*2)%9;color=color.map(v=>v+(furrow===0?-28:furrow===2?15:0));}
    if(material===5){const row=Math.floor(gy/7),seam=gy%7===0||(gx+(row%2)*6)%13===0;color=color.map(v=>v+(seam?-30:h%9===0?7:0));}
    if(material===7)color=cliffFaceColor(gx,gy,this.masks);
    // Shallow shoreline color and broken foam remain on the actual water layer.
    if(material===8){let shore=false;for(const offset of [-W*3,W*3,-3,3]){const v=i+offset*4;if(v>=0&&v<water.length&&water[v+3]<128)shore=true;}if(shore)color=h%5===0?[179,224,210]:[58,159,173];else if((gx+gy*2)%41===0&&h%4===0)color=[34,149,178];}
    if(material===1||material===2){const surface=layer==='paths'?paths:surfaces;const edge=surface[i-4]!==id||surface[i+4]!==id||surface[i-W*4]!==id||surface[i+W*4]!==id;if(edge)color=color.map(v=>v-14);if(h%97===0)color=[166,135,84];}
    rgba(image.data,j,color);
   }
   if(!filled)continue;ctx.putImageData(image,0,0);const key=`phase1-${layer}-${cx}-${cy}`;
   if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,c);
   const view=this.scene.add.image(cx*2,cy*2,key).setOrigin(0).setScale(2).setDepth(depth);this.objects.push(view);
  }
 }
 cull(){const view=this.scene.cameras.main.worldView;for(const o of this.objects){const bounds=o.getBounds();o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,bounds));}}
}
