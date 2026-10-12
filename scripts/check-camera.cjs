const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),Module=require('node:module');
const {EventEmitter}=require('node:events'),{execFileSync}=require('node:child_process');
const output=fs.mkdtempSync(path.join(os.tmpdir(),'granja-camera-')),original=Module._load;
try {
 execFileSync('./node_modules/.bin/tsc',['--target','es2022','--module','commonjs','--outDir',output,'--skipLibCheck','--esModuleInterop','src/game/camera.ts']);
 Module._load=function(id,...args){if(id==='phaser')return {Scale:{Events:{RESIZE:'resize'}},Math:{Distance:{Between:(x,y,a,b)=>Math.hypot(x-a,y-b)},Clamp:(v,min,max)=>Math.min(max,Math.max(min,v))}};return original.call(this,id,...args);};
 const {CameraControls}=require(path.join(output,'camera.js'));
 const camera={zoom:1,scrollX:100,scrollY:100,panEffect:{reset(){}},zoomEffect:{reset(){}},setZoom(v){this.zoom=v;}};
 const input=new EventEmitter();input.enabled=true;input.addPointer=()=>{};input.pointer1={isDown:false,x:0,y:0};input.pointer2={isDown:false,x:0,y:0};
 const scale=new EventEmitter();scale.width=390;scale.height=844;const events=new EventEmitter();global.window={addEventListener(){},removeEventListener(){}};
 const scene={input,scale,events,cameras:{main:camera}},control=new CameraControls(scene,.42,2.4,{width:3072,height:2048});
 for(let i=0;i<100;i++)control.zoom(100);assert.equal(camera.zoom,.42);for(let i=0;i<100;i++)control.zoom(-100);assert.equal(camera.zoom,2.4);
 camera.zoom=1;input.emit('pointerdown',{button:0,x:20,y:20});input.emit('pointermove',{isDown:true,x:80,y:60});assert.equal(control.moved,true);assert.equal(camera.scrollX,40);assert.equal(camera.scrollY,60);input.emit('pointerup');control.update(16);assert.ok(camera.scrollX<40);
 input.pointer1={isDown:true,x:0,y:0};input.pointer2={isDown:true,x:100,y:0};input.emit('pointerdown',{button:0});input.pointer2.x=200;input.emit('pointermove',{});assert.equal(camera.zoom,2);input.pointer2.x=1;input.emit('pointermove',{});assert.equal(camera.zoom,.42);
 scale.width=1440;scale.height=1000;scale.emit('resize');assert.equal(camera.zoom,Math.max(1440/3072,1000/2048));assert.equal(scale.listenerCount('resize'),1);events.emit('shutdown');assert.equal(scale.listenerCount('resize'),0);
 console.log('OK: drag/inercia, rueda/zoom limitado, pinch de dos dedos, resize móvil/escritorio y limpieza del listener.');
}finally{Module._load=original;fs.rmSync(output,{recursive:true,force:true});}
