import Phaser from 'phaser';
import { CELEBRATION_MODE } from '../data/celebration';
export function loadExteriorAssets(scene:Phaser.Scene) {
 scene.load.image('exterior','/assets/exterior-hd.webp');
 scene.load.image('actors','/assets/actors-v2.webp');
 scene.load.image('dogs','/assets/dogs.webp');
 if(CELEBRATION_MODE)scene.load.image('celebration-props','/assets/celebration-props.webp');
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
 for(const key of ['dogs',...(CELEBRATION_MODE?['celebration-props']:[])]){const texture=scene.textures.get(key),source=texture.getSourceImage() as HTMLImageElement;for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=Math.round(col*source.width/4),y=Math.round(row*source.height/2);texture.add(row*4+col,0,x,y,Math.round((col+1)*source.width/4)-x,Math.round((row+1)*source.height/2)-y);}}
 const cows=scene.textures.get('cows'), image=cows.getSourceImage() as HTMLImageElement;
 for(let i=0;i<2;i++) cows.add(i,0,i*image.width/2,0,image.width/2,image.height);
}
