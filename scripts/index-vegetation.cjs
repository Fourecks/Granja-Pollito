// Asset slicing only: preserve generated art and alpha; discard invisible matte dust for bounds.
const fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE || 'sharp');
(async()=>{
 const {data,info}=await sharp('public/assets/vegetation-atlas.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const names=[...fs.readFileSync('src/game/world/vegetationPlan.ts','utf8').split('export const VEGETATION_NAMES = [')[1].split('] as const')[0].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 const rows=[0,214,410,550,688,833,965,1146,1254].map(v=>Math.round(v*info.height/1254));
 const frames={};
 for(let n=0;n<names.length;n++){
  let slot=n;if(n===2)slot=11;if(n===3)slot=2;if(n===4)slot=3;if(n===5)slot=4;if(n===6)slot=5;
  const row=Math.floor(slot/8),col=slot%8,x0=Math.round(col*info.width/8),x1=Math.round((col+1)*info.width/8),y0=rows[row],y1=rows[row+1];
  let left=x1,top=y1,right=x0,bottom=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw new Error('Empty sprite '+names[n]);
  frames[names[n]]={frame:{x:left,y:top,w:right-left+1,h:bottom-top+1},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:right-left+1,h:bottom-top+1},sourceSize:{w:right-left+1,h:bottom-top+1}};
 }
 fs.writeFileSync('public/assets/vegetation-atlas.json',JSON.stringify({frames,meta:{image:'vegetation-atlas.png',size:{w:info.width,h:info.height},scale:'1',app:'Granja Pollito Capa 2'}},null,2)+'\n');
 console.log('Indexed '+names.length+' named frames, alpha preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
