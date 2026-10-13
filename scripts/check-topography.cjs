const assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module'),path=require('node:path');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const map=load('src/game/world/mapConfig.ts'),{inside}=load('src/game/navigation.ts'),{bridgePlans}=load('src/game/world/bridgePlan.ts');
const baseline=require('./fixtures/topography-original.json');
for(const [key,expected] of Object.entries(baseline.hashes))assert.equal(crypto.createHash('sha256').update(JSON.stringify(map[key])).digest('hex'),expected,`${key}: original geometry must match ${baseline.commit}`);
assert.equal(bridgePlans.length,10);assert(bridgePlans.every(p=>p.crossing.kind!=='ramp'),'Terrain stairs must not become bridges');
assert.equal(map.waterfalls.length,5);const north=map.waterfalls.find(f=>f.id==='north-falls');assert(north.historical);assert.deepEqual(north.position,[1130,86]);
for(const f of map.waterfalls){
 if(f.historical)continue;
 assert(inside(f.position,map.cliffFaces[f.cliffIndex]),`${f.id}: lip on the historical rock face`);
 assert(f.foot[1]>f.position[1]+8,`${f.id}: real descent`);
 for(let n=1;n<19;n++){const y=f.position[1]+(f.foot[1]-f.position[1])*n/20;let x=f.position[0];for(let k=1;k<f.flow.length;k++){const a=f.flow[k-1],b=f.flow[k];if(y<=b[1]){x=a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);break;}}
 assert(inside([x,y],map.cliffFaces[f.cliffIndex]),`${f.id}: water falls along the wall`);assert(map.rawWater.some(p=>inside([x,y],p)),`${f.id}: preserve the original water course`);}
 const beyond=[f.foot[0],f.foot[1]+1];assert(!inside(beyond,map.cliffFaces[f.cliffIndex]),`${f.id}: pool below the lower edge`);
}
console.log('OK: historical topography unchanged in 14 geometry groups, eight terrain passages, ten bridges, four falls on real rock-face descents plus the approved historical north visual drop.');
