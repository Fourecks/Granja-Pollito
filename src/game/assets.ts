import Phaser from 'phaser';
import { CELEBRATION_MODE } from '../data/celebration';
export function loadExteriorAssets(scene:Phaser.Scene) {
 scene.load.image('exterior','/assets/exterior-hd.webp');
 scene.load.image('actors','/assets/actors-v2.webp');
 scene.load.image('dogs','/assets/dogs.webp');
 if(CELEBRATION_MODE){scene.load.image('plaza-props','/assets/plaza-celebration-v2.webp');scene.load.image('worker-chicks','/assets/worker-chicks.webp');}
 scene.load.image('cows','/assets/cows-v2.webp');
 scene.load.image('crop-stages','/assets/crop-stages-v2.webp');
}
export function createFrames(scene:Phaser.Scene) {
 const sheet=scene.textures.get('actors'); const source=sheet.getSourceImage() as HTMLImageElement;
 for(let row=0;row<4;row++) for(let col=0;col<4;col++) {
  const x=Math.round(col*source.width/4),y=Math.round(row*source.height/4);
  sheet.add(row*4+col,0,x,y,Math.round((col+1)*source.width/4)-x,Math.round((row+1)*source.height/4)-y);
 }
 const crop=scene.textures.get('crop-stages'), cropImage=crop.getSourceImage() as HTMLImageElement;
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=Math.round(col*cropImage.width/4),y=Math.round(row*cropImage.height/3);crop.add(row*4+col,0,x,y,Math.round((col+1)*cropImage.width/4)-x,Math.round((row+1)*cropImage.height/3)-y);}
 for(const key of ['dogs',...(CELEBRATION_MODE?['worker-chicks']:[])]){const texture=scene.textures.get(key),source=texture.getSourceImage() as HTMLImageElement;for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=Math.round(col*source.width/4),y=Math.round(row*source.height/2);texture.add(row*4+col,0,x,y,Math.round((col+1)*source.width/4)-x,Math.round((row+1)*source.height/2)-y);}}
 // Authored rectangles: the atlas intentionally includes wide bunting and flower beds.
 if(CELEBRATION_MODE){const t=scene.textures.get('plaza-props');
 const frames=[[0,0,325,330],[330,0,310,330],[640,0,350,330],[1000,0,280,330],
 [0,330,315,325],[330,330,295,325],[625,330,345,325],[975,330,305,325],
 [0,655,280,290],[280,655,395,290],[675,655,220,290],[900,655,380,290],
 [0,946,455,285],[455,1080,320,160],[775,975,230,260],[1005,960,270,280]];
 const scale=(t.getSourceImage() as HTMLImageElement).width/1280;
 frames.forEach(([x,y,w,h],i)=>t.add(i,0,Math.round(x*scale),Math.round(y*scale),Math.round(w*scale),Math.round(h*scale)));}
 const cows=scene.textures.get('cows'), image=cows.getSourceImage() as HTMLImageElement;
 for(let i=0;i<2;i++) cows.add(i,0,i*image.width/2,0,image.width/2,image.height);
}
