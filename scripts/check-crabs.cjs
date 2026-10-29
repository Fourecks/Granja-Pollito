const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),{buildSync}=require('esbuild');
const entry='src/game/world/crabs.ts',m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,entry);
const {CrabColony}=m.exports;
const sand=(x,y)=>x>=20&&x<=600&&y>=30&&y<=100;
const colony=new CrabColony(sand,[[70,65],[200,65],[350,65],[500,65]]),states=new Map(colony.crabs.map(c=>[c.id,new Set()]));
for(let time=0;time<150000;time+=40){colony.update(time,40);for(const c of colony.crabs){states.get(c.id).add(c.state);assert(sand(c.x,c.y),'Crab stays on sand');assert(Math.hypot(c.x-c.home[0],c.y-c.home[1])<=49,'Excursion remains local');if(c.state==='dig'||c.state==='hidden')assert(Math.hypot(c.x-c.home[0],c.y-c.home[1])<.01,'Burrows only at its own hole');}}
for(const seen of states.values())for(const state of ['hidden','emerge','walk','pause','return','dig'])assert(seen.has(state),'Complete cycle '+state);
console.log('OK: every crab walks on sand, pauses, returns to its own burrow, digs, hides and emerges over 150 simulated seconds.');
