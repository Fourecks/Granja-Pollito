/** Native-pixel rock: uneven strata and sparse fissures, never a masonry grid. */
const hash=(x:number,y:number,seed=0)=>{let n=Math.imul(x+seed*109,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
export function rockDetail(x:number,y:number){
 const cx=Math.floor(x/17),cy=Math.floor(y/12);
 let first=Infinity,second=Infinity,sx=0,sy=0,seed=0;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const h=hash(cx+dx,cy+dy,41);if(h%7===0)continue;
  const px=(cx+dx)*17+2+h%13,py=(cy+dy)*12+1+(h>>>8)%10;
  const distance=(x-px)**2+((y-py)*1.35)**2;
  if(distance<first){second=first;first=distance;sx=px;sy=py;seed=h;}
  else if(distance<second)second=distance;
 }
 const edge=second-first,near=edge<19;
 // Selectively open vertical/diagonal fractures, not outlines around every rock.
 const crack=near&&Math.abs(x-sx)>Math.abs(y-sy)*.7&&seed%4!==0;
 const strata=y+Math.floor(Math.sin(x/19)*4+Math.sin(x/43)*6+x*.055);
 const band=Math.floor(strata/11),grain=hash(Math.floor(x/13),band,13);
 const ledge=strata%11===0&&grain%5===0;
 const plane=x-sx+(y-sy)*.7;
 const facet=seed%19-9+(plane<-3?10:plane>6?-9:0);
 const broad=Math.floor(Math.sin(x/37-y/29)*5);
 const shade=broad+facet+(crack?-22:near&&plane<0?8:0)+(ledge?9:0)+(hash(x,y)%5-2);
 return {shade,crack,ledge,moss:crack&&hash(Math.floor(x/2),Math.floor(y/3),31)%11===0};
}
export function naturalRockColor(x:number,y:number,wet=false){
 const d=rockDetail(x,y),base=wet?[100,109,116]:[127,123,111];
 if(d.moss&&!wet)return [91,105,63];
 return base.map(v=>v+d.shade);
}
