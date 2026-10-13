/** Native art pixels (two world units). No scaled source sprites or interpolation. */
export const grassProfiles = [
 {name:'micro_01',width:4,height:2,blades:2}, {name:'micro_02',width:5,height:3,blades:3}, {name:'micro_03',width:6,height:3,blades:3},
 {name:'short_01',width:8,height:4,blades:4}, {name:'short_02',width:10,height:5,blades:5}, {name:'short_03',width:11,height:5,blades:6},
 {name:'medium_01',width:12,height:7,blades:6}, {name:'medium_02',width:14,height:8,blades:7},
 {name:'dense_01',width:16,height:9,blades:9}, {name:'dense_02',width:19,height:11,blades:11},
 {name:'edge_01',width:7,height:3,blades:3}, {name:'edge_02',width:9,height:4,blades:4},
 {name:'foreground_01',width:11,height:5,blades:5}, {name:'foreground_02',width:15,height:6,blades:7}, {name:'foreground_03',width:18,height:7,blades:8},
] as const;
export function drawGrass(ctx:CanvasRenderingContext2D,x:number,y:number,profile:number|{width:number;height:number;blades:number},seed:number,pose=0,wet=false,maxHeight=Infinity){
 const p=typeof profile==='number'?grassProfiles[profile]:profile;
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const colors=wet?['#416a37','#578243','#71974c','#92ac60']:['#567733','#6e9140','#8caa50','#a8ba65'];
 for(let b=0;b<p.blades;b++){
  const root=Math.round(x-p.width/2+random()*p.width),bottom=Math.round(y-random()*2),height=Math.max(2,Math.min(Math.floor(maxHeight),2+Math.floor(random()*(p.height-1))));
  const lean=(random()<.5?-1:1)*(1+Math.floor(random()*2)),tone=Math.floor(random()*2);
  for(let h=0;h<height;h++){
   const bend=Math.round(lean*(h/height)**2+(h>height*.55?pose:0));
   ctx.fillStyle=colors[Math.min(3,tone+(h>height*.6?1:0))];ctx.fillRect(root+bend,bottom-h,1,1);
   if(height>4&&h>0&&h<height*.65){ctx.fillStyle=colors[tone+1];ctx.fillRect(root+bend+1,bottom-h,1,1);}
  }
  if(height>4&&b%3===0){ctx.fillStyle=colors[2];ctx.fillRect(root-1,bottom-2,1,1);ctx.fillRect(root-2,bottom-3,1,1);}
 }
}
