import Phaser from 'phaser';
/** Remove disconnected atlas neighbours/scan lines without resizing the authored frame. */
export function cleanTextureFrames(scene:Phaser.Scene,key:string,names?:string[]){
 const old=scene.textures.get(key),source=old.getSourceImage() as HTMLImageElement;
 const frames=(names??old.getFrameNames()).map(name=>{const f=old.get(name);return {name,x:f.cutX,y:f.cutY,w:f.cutWidth,h:f.cutHeight};});
 const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
 let removed=0;
 for(const f of frames){
  const image=ctx.getImageData(f.x,f.y,f.w,f.h),d=image.data,count=f.w*f.h,labels=new Int32Array(count),queue=new Int32Array(count);let label=0;
  // This frame starts two rows too high and includes a thin, connected piece of the previous atlas row.
  if(key==='vegetation'&&f.name==='HOLLOW_TREE')for(let y=0;y<2;y++)for(let x=0;x<f.w;x++)d[(y*f.w+x)*4+3]=0;
  const groups:Array<{id:number;size:number;left:number;right:number;top:number;bottom:number}>=[];
  for(let start=0;start<count;start++){
   if(labels[start]||d[start*4+3]<48)continue;
   const g={id:++label,size:0,left:f.w,right:0,top:f.h,bottom:0};let read=0,write=1;queue[0]=start;labels[start]=label;
   while(read<write){const i=queue[read++],x=i%f.w,y=Math.floor(i/f.w);g.size++;g.left=Math.min(g.left,x);g.right=Math.max(g.right,x);g.top=Math.min(g.top,y);g.bottom=Math.max(g.bottom,y);
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy,j=ny*f.w+nx;if(nx<0||ny<0||nx>=f.w||ny>=f.h||labels[j]||d[j*4+3]<48)continue;labels[j]=label;queue[write++]=j;}
   }groups.push(g);
  }
  const main=groups.sort((a,b)=>b.size-a.size)[0];if(!main)continue;
  const kept=new Set(groups.filter(g=>g===main||g.left>=main.left-2&&g.right<=main.right+2&&g.top>=main.top-2&&g.bottom<=main.bottom+2&&g.size>=3).map(g=>g.id));
  // Preserve only a one-pixel antialias fringe beside a valid component.
  for(let i=0;i<count;i++)if(d[i*4+3]){
   let valid=kept.has(labels[i]);
   if(!valid&&d[i*4+3]>=16){const x=i%f.w,y=Math.floor(i/f.w);for(let dy=-1;dy<=1&&!valid;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<f.w&&y+dy>=0&&y+dy<f.h&&kept.has(labels[(y+dy)*f.w+x+dx])){valid=true;break;}}
   if(!valid){d[i*4+3]=0;removed++;}
  }
  ctx.putImageData(image,f.x,f.y);
 }
 const all=old.getFrameNames().map(name=>{const f=old.get(name);return {name,x:f.cutX,y:f.cutY,w:f.cutWidth,h:f.cutHeight};});
 scene.textures.remove(key);const texture=scene.textures.addCanvas(key,c)!;for(const f of all)texture.add(f.name,0,f.x,f.y,f.w,f.h);
 return {frames:frames.length,removed};
}
