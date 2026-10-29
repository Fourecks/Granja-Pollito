const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),{buildSync}=require('esbuild');
function load(entry){const c=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(c,entry);return m.exports;}
const {NavigationGrid,rectangle}=load('src/game/navigation.ts'),{ruralGates,advanceGate}=load('src/game/world/ruralGates.ts');
assert.equal(ruralGates.length,5,'Four front gates and the horse side gate');
const gate={id:'test',a:[30,50],b:[70,50],shape:rectangle(30,48,40,4),open:false,progress:0,holdUntil:0};
const data={width:100,height:100,cell:5,walkable:[rectangle(0,0,100,100)],obstacles:[],gates:[gate]};
const animals=new NavigationGrid({...data,canOpenGates:false},2),farmer=new NavigationGrid({...data,canOpenGates:true},2);
assert(!animals.canWalk(50,50),'Closed gate blocks animals');assert(farmer.path([50,80],[50,20]).length,'Farmer can plan an opening');assert(!farmer.gatesReady(50,50),'Movement waits until the actual gate opens');
const worker={kind:'worker',x:50,y:80,route:[[50,20]]};for(let t=16;t<=400;t+=16)advanceGate(gate,[worker],t,16);
assert(gate.open&&gate.progress===1,'Gate opens before the worker reaches it');assert(farmer.gatesReady(50,50));assert(animals.canWalk(50,50));
for(let t=416;t<=1800;t+=16)advanceGate(gate,[{...worker,y:50,route:[]}],t,16);
assert(gate.open,'A body holds the gate open even after a route finishes');for(let t=1816;t<3300;t+=16)advanceGate(gate,[],t,16);assert(!gate.open&&gate.progress===0,'Gate closes after everyone has cleared it');
const parallel={kind:'worker',x:40,y:80,route:[[70,80]]};advanceGate(gate,[parallel],4000,16);assert.equal(gate.progress,0,'A farmer merely passing outside does not trigger the gate');
console.log('OK: physical closed gates, farmer route permission, anticipatory opening, occupancy safety, smooth closing and no false outside trigger.');
