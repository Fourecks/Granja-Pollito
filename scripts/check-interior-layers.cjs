const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),{buildSync}=require('esbuild');
function load(entry){const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,entry);return m.exports;}
const {InteriorLayers}=load('src/game/interiors/InteriorLayers.ts'),{NavigationGrid}=load('src/game/navigation.ts'),{interiors}=load('src/data/interiors.ts'),{ruralBuildings}=load('src/game/world/ruralBuildings.ts'),{taskRoutes}=load('src/data/routes.ts');
const object=()=>new Proxy({}, {get:()=>()=>object()});
const scene={add:new Proxy({}, {get:()=>()=>object()}),tweens:{add:()=>{}}};
let routes=0;
for(const [id,room] of Object.entries(interiors)){
 const layer=new InteriorLayers(scene,id,()=>true),nav=new NavigationGrid({width:1672,height:941,walkable:layer.walkable,obstacles:layer.obstacles,gates:layer.gates,canOpenGates:true},7);
 for(const station of room.stations){assert(nav.canWalk(...station.point),id+' station is physically reachable: '+station.task);assert(nav.path([830,590],station.point).length,id+' has an actual route: '+station.task);assert.deepEqual(taskRoutes[station.task].interiorPoint,station.point,'Click target matches action location');routes++;}
 for(const gate of layer.gates){const x=(gate.a[0]+gate.b[0])/2,y=gate.a[1];assert(!nav.gatesReady(x,y),'Closed stall gate blocks movement');layer.update(100,16,[{kind:'worker',x,y:y+50,route:[[x,y-40]]}]);for(let t=116;t<800;t+=16)layer.update(t,16,[{kind:'worker',x,y:y+50,route:[[x,y-40]]}]);assert(nav.gatesReady(x,y),'Approaching farmer opens the physical gate');}
 layer.complete('feed-rabbits');layer.complete('clean-rabbit-hutch');layer.update(2000,16,[]);
}
for(const id of ['goat-shelter','rabbit-hutch'])assert.equal(ruralBuildings.find(b=>b.id===id).interiorId,id,'Exterior building resolves to its real interior');
console.log('OK: '+routes+' care station routes, physical stall gates, layered room construction and goat/rabbit entrances.');
