import Phaser from 'phaser';
import { inside } from '../navigation';
import { MAP } from './mapConfig';
import { zones } from './zones';
import { ruralBuildings,paddocks } from './ruralBuildings';
import { drawGrass } from './grassArt';
import type { WorldMasks } from './terrain';
const noise=(x:number,y:number)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
function patchNoise(x:number,y:number){const gx=Math.floor(x/12),gy=Math.floor(y/12),u=(x/12-gx),v=(y/12-gy),a=u*u*(3-2*u),b=v*v*(3-2*v);return (noise(gx,gy)*(1-a)+noise(gx+1,gy)*a)*(1-b)+(noise(gx,gy+1)*(1-a)+noise(gx+1,gy+1)*a)*b;}
/** Yard materials are rasterized at the same two-world-unit pixel grid as terrain.
 * Existing water, cliffs and road stamps always win over these material patches. */
export class RuralParcelLayer {
 constructor(scene:Phaser.Scene,masks:WorldMasks){
  const canvas=document.createElement('canvas');canvas.width=MAP.width/2;canvas.height=MAP.height/2;
  const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  for(const id of ['cowArea','mixedBarnArea','chickenArea','jefeHouseArea','greenhouseArea','northForest']){
   const z=zones.find(z=>z.id===id)!,xs=z.shape.map(p=>p[0]/2),ys=z.shape.map(p=>p[1]/2);
   for(let y=Math.floor(Math.min(...ys));y<Math.max(...ys);y++)for(let x=Math.floor(Math.min(...xs));x<Math.max(...xs);x++){
    const wx=x*2,wy=y*2,i=(y*canvas.width+x)*4;if(!inside([wx,wy],z.shape)||!masks.land[i+3]||masks.water[i+3]||masks.cliffs[i+3]||masks.paths[i+3])continue;
    const n=noise(x,y),cluster=patchNoise(x,y),broad=Math.sin(x*.13)*Math.cos(y*.17)*.14;let earth=.16,grass=[119,153,57];
    if(id==='cowArea')earth=wy>690?.28:.12;
    if(id==='chickenArea')earth=wy>834?.63:.22;
    if(id==='mixedBarnArea'){earth=wx>1228&&wy>624?.7:.17;if(Math.hypot((wx-1339)/95,(wy-679)/43)<.84+broad)earth=.85;}
    if(id==='jefeHouseArea')earth=wy>1245&&Math.abs(wx-1750)>58&&Math.abs(wx-1750)<138?.5:.08;
    if(id==='greenhouseArea')earth=Math.abs(wx-2646)>68?.56:.22;
    if(id==='northForest'){const d=Math.hypot((wx-1664)/190,(wy-215)/76);if(d>1.08+broad)continue;earth=.50-d*.24;grass=[105,143,53];}
    const dirt=cluster<earth+broad,dark=id==='mixedBarnArea'&&wx>1244&&wy>636&&wy<722;
    const base=dirt?(dark?[126,104,66]:[178,151,91]):grass;
    const v=Math.floor(n*6)-3;ctx.fillStyle=`rgb(${base.map(c=>c+v).join(',')})`;ctx.fillRect(x,y,1,1);
   }
  }
  // Foundation shadows have a thin irregular contact edge, never a detached oval.
  for(const b of ruralBuildings){const [x,y]=b.anchor,w=b.footprint.width;
   for(let i=-Math.floor(w/4);i<w/4;i++){const n=noise(i+1000,Math.round(y));ctx.fillStyle=`rgba(49,43,25,${.18+n*.17})`;ctx.fillRect(Math.round(x/2+i),Math.round(y/2-2),1,2+(n>.65?1:0));}
   for(const side of [-1,1])for(let i=0;i<5;i++)drawGrass(ctx,Math.round((x+side*(w/2-8+i*3))/2),Math.round(y/2+i%2),8,i*781+Math.round(x),0,false,2);
  }
  const key='rural-parcel-ground';if(scene.textures.exists(key))scene.textures.remove(key);scene.textures.addCanvas(key,canvas);scene.add.image(0,0,key).setOrigin(0).setScale(2).setDepth(-15);
  // Several small reused garden sprites bind each full plot into its surroundings.
  const plant=(name:string,x:number,y:number,w:number,h:number)=>scene.add.image(x,y,'vegetation',name).setOrigin(.5,1).setDisplaySize(w,h).setDepth(y);
  for(const side of [-1,1]){
   for(let i=0;i<5;i++)plant(i%2?'FLOWERS_WHITE':'FLOWERS_PINK',1750+side*(87+i%2*16),1248+i*13,19,18);
   plant('BUSH_FLOWER_PINK',1750+side*130,1280,28,25);
   for(let i=0;i<4;i++)plant(i%2?'FLOWERS_WHITE':'BUSH_GREEN',2646+side*92,937+i*23,18,16);
   for(let i=0;i<4;i++)plant(i%2?'FLOWERS_YELLOW':'GRASS_FLOWERING',730+side*186,855+i*22,17,16);
  }
  for(const [x,y] of [[1658,1300],[1700,1320],[1780,1320],[1830,1308],[1870,1280]])plant('FLOWERS_WHITE',x,y,20,18);
  scene.add.image(1798,1301,'tulip-garden','BENCH').setOrigin(.5,1).setDisplaySize(48,34).setDepth(1301);
  plant('FALLEN_LOG',1530,232,48,25);plant('FALLEN_LOG',1537,244,44,23);plant('ROCK_CLUSTER',1731,236,34,28);plant('ROCK_SMALL',1710,252,15,12);
  for(const p of paddocks){if(p.id==='pig')continue;for(let i=0;i<12;i++){const x=p.x+15+noise(i,2)*(p.w-30),y=p.y+15+noise(i,4)*(p.h-30);plant(p.id==='pig'?'ROCK_SMALL':'GRASS_FLOWERING',x,y,12,10);}}
 }
}
