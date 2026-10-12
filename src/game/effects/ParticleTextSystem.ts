import type { Point } from '../navigation';
// Rasterization is only a destination sampler. Every visible point is a particle.
export class ParticleTextSystem {
 static sample(text:string,center:Point,maxPoints:number):Point[]{
  const canvas=document.createElement('canvas');canvas.width=230;canvas.height=30;
  const ctx=canvas.getContext('2d')!;ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(text,115,23);
  const pixels=ctx.getImageData(0,0,230,30).data;let points:Point[]=[];
  for(let y=0;y<30;y+=2)for(let x=0;x<230;x+=2)if(pixels[(y*230+x)*4+3]>120)points.push([center[0]+(x-115)*2.6,center[1]+(y-15)*2.6]);
  if(points.length>maxPoints){const stride=points.length/maxPoints;points=Array.from({length:maxPoints},(_,i)=>points[Math.floor(i*stride)]);}
  return points;
 }
}
