// Optional browser regression: run against Vite; set PLAYWRIGHT_MODULE if installed externally.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch(process.env.CHROME_BINARY?{executablePath:process.env.CHROME_BINARY,headless:true}:{headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/Scene.tsx*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const observer =','window.testGame = game; const observer =')});});
  await page.goto(process.env.TOPOGRAPHY_URL||'http://127.0.0.1:5174');
  await page.waitForFunction(()=>window.testGame&&document.querySelector('canvas')?.dataset.world,null,{timeout:60000});
  const result=await page.evaluate(async()=>{
   const scene=window.testGame.scene.getScene('Exterior'),masks=scene.terrain.masks,W=1536,H=1024,coverage=new Uint8Array(W*H);
   for(const o of scene.terrain.objects){if(!o.texture.key.startsWith('phase1-topography-'))continue;
    const c=o.texture.getSourceImage(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>127)coverage[(o.y/2+y)*W+o.x/2+x]=1;
   }
   let missing=0,waterWalls=0;for(let i=0;i<W*H;i++)if(masks.cliffs[i*4+3]>127){if(!coverage[i])missing++;if(masks.water[i*4+3]>127)waterWalls++;}
   const {cliffFaces}=await import('/src/game/world/mapConfig.ts'),{inside}=await import('/src/game/navigation.ts');let bridgeWallPixels=0;
   for(const o of scene.bridges.objects){if(o.getData('bridgePart')!=='floor')continue;
    const c=o.texture.getSourceImage(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>127&&cliffFaces.some(face=>inside([o.x+x,o.y+y],face)))bridgeWallPixels++;
   }
   let invalidSubmerged=0,submergedPixels=0;for(let i=0;i<scene.submerged.fade.length;i++)if(scene.submerged.fade[i]>0){submergedPixels++;if(masks.water[i*4+3]<128||masks.cliffWalls[i*4+3]>127)invalidSubmerged++;}
   const underwaterOrder=scene.submerged.objects.every(o=>o.depth===-28.5)&&scene.water.layers.every(o=>o.depth===-28||o.depth===-29);
   return {missing,waterWalls,bridgeWallPixels,stairs:scene.ramps.diagnostics.stairs,submergedPixels,invalidSubmerged,underwaterOrder,falls:scene.water.falls.length};
  });
  assert.equal(result.missing,0,'Every original cliff pixel must render, including water intersections');
  assert(result.waterWalls>25000,'The historical coastline must remain visible above the sea');
  assert.equal(result.bridgeWallPixels,0,'Bridge decks must not paint over cliff walls');assert.equal(result.stairs,8);assert(result.submergedPixels>0);assert.equal(result.invalidSubmerged,0);assert(result.underwaterOrder);assert.equal(result.falls,5);assert.deepEqual(errors,[]);console.log('OK:',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
