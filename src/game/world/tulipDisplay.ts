import type { Tulip } from './tulipFieldPlan';
/** Flowers only: retain the garden's shape, paths, props and physical plan. */
export function selectReadableTulips(flowers:readonly Tulip[]):Tulip[]{
 const chosen:Tulip[]=[],heads=new Map<string,Array<{x:number;y:number;radius:number}>>();
 for(const f of flowers){
  // Narrow winding grass seams, interrupted into pockets rather than agricultural rows.
  const seam=f.x-(2720+Math.sin(f.y/67)*53+Math.sin(f.y/31)*12);
  if(Math.abs(seam)<8+3*Math.sin(f.y/41)&&Math.cos(f.y/83)>.05)continue;
  const pocket=Math.sin(f.x/49+f.y/77)+Math.cos(f.y/37-f.x/103);
  if(pocket<-1.65)continue;
  const x=f.x,y=f.y-f.height*.8,radius=f.variant>=6?10:6.5,cx=Math.floor(x/24),cy=Math.floor(y/24);
  let clear=true;
  for(let dy=-1;dy<=1&&clear;dy++)for(let dx=-1;dx<=1&&clear;dx++)for(const p of heads.get(`${cx+dx},${cy+dy}`)??[])if(Math.hypot(x-p.x,y-p.y)<radius+p.radius){clear=false;break;}
  if(!clear)continue;
  chosen.push(f);const key=`${cx},${cy}`,list=heads.get(key)??[];list.push({x,y,radius});heads.set(key,list);
 }
 return chosen;
}
