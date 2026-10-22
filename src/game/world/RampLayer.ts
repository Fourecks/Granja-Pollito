import Phaser from 'phaser';
import { ramps, bridges, cliffFaces } from './mapConfig';
import { inside } from '../navigation';
import { cliffFaceColor, type WorldMasks } from './terrain';
const pathWidths:Record<string,number>={'north-steps':30,'forest-pass':24,'west-pass':22,'coop-steps':24,'home-steps':24,'beach-west-steps':38,'beach-east-steps':40,'pier-steps':26};
const beachRamps=new Set(['beach-west-steps','beach-east-steps']);
/** Historical terrain passages are slopes/stairs, not bridges. Clip steps to the actual cliff. */
export class RampLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 constructor(scene:Phaser.Scene,masks:WorldMasks){
  for(const ramp of ramps){
   const connected=ramp.id==='pier-steps'?bridges.find(b=>b.id==='fishing-pier'):undefined;
   const visual=connected??ramp;
   let wood:{pixels:Uint8ClampedArray;width:number;height:number}|undefined;
   if(connected){const sheet=scene.textures.get('bridge-rustic'),f=sheet.get('planks'),c=document.createElement('canvas');c.width=f.cutWidth;c.height=f.cutHeight;const ctx=c.getContext('2d')!;ctx.drawImage(sheet.getSourceImage() as HTMLImageElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,c.width,c.height);wood={pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};}
   const pixel=connected?1:2,xs=ramp.shape.map(p=>p[0]),ys=ramp.shape.map(p=>p[1]),left=Math.floor(Math.min(...xs)/pixel)*pixel,top=Math.floor(Math.min(...ys)/pixel)*pixel;
   const w=Math.ceil((Math.max(...xs)-left)/pixel)+1,h=Math.ceil((Math.max(...ys)-top)/pixel)+1,c=document.createElement('canvas');c.width=w;c.height=h;
   const ctx=c.getContext('2d')!,image=ctx.createImageData(w,h),dx=visual.to[0]-visual.from[0],dy=visual.to[1]-visual.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
   let stairPixels=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const wx=left+x*pixel,wy=top+y*pixel,index=(Math.floor(wy/2)*1536+Math.floor(wx/2))*4;
    // Fill exactly the native cells removed by the passage mask; no pale road sliver at its sides.
    const nativeWall=(masks.cliffWalls??masks.cliffs)[index+3]>127&&masks.cliffs[index+3]<128;
    const pierSeam=connected&&inside([wx,wy],ramp.shape)&&cliffFaces.some(face=>inside([wx,wy],face));
    if(!nativeWall&&!pierSeam)continue;
    const vx=wx-visual.from[0],vy=wy-visual.from[1],across=-uy*vx+ux*vy,along=ux*vx+uy*vy,j=(y*w+x)*4,noise=(x*17+y*31)%7;
    if(Math.abs(across)>pathWidths[ramp.id]/2){
     image.data.set([...cliffFaceColor(Math.floor(wx/2),Math.floor(wy/2),masks),255],j);
     continue;
    }
    const beach=beachRamps.has(ramp.id),period=beach?10:8,step=connected?((along+12)%9+9)%9:((along%period)+period)%period;
    // The two beach passages are authored as masonry staircases cut into the cliff.
    // A light tread + dark riser rhythm makes the descent read clearly from the elevated camera.
    const outerHalf=pathWidths[ramp.id]/2,stairHalf=outerHalf-6,absAcross=Math.abs(across);
    if(beach&&absAcross>outerHalf){image.data.set([...cliffFaceColor(Math.floor(wx/2),Math.floor(wy/2),masks),255],j);continue;}
    let color:number[];
    if(beach){
     const sideWall=absAcross>stairHalf;
     if(sideWall){
      const block=((Math.floor(along/8)+Math.floor((absAcross-stairHalf)/3))&1)===0;
      color=block?[142+noise,136+noise,120+noise]:[122+noise,118+noise,105+noise];
      if(absAcross>outerHalf-2)color=color.map(v=>v-28);
      else if(absAcross<stairHalf+2)color=color.map(v=>v+12);
     }else{
      const riser=step<2,front=step>=2&&step<4;
      color=riser?[78,75,67]:front?[126+noise,120+noise,105+noise]:[188+noise,176+noise,148+noise];
      if(absAcross>stairHalf-2)color=color.map(v=>v-18);
      if(!riser&&step===4)color=color.map(v=>v+10);
     }
    }else color=step<2?[94,88,72]:step<4?[177,164,137]:[145+noise,137+noise,114+noise];
    if(wood){const span=Math.max(4,wood.width-32),rows=Math.max(4,Math.floor(wood.height/5)-18),sx=16+((Math.floor((across+80)*5)%span)+span)%span,sy=8+((Math.floor((along+100)*3)%rows)+rows)%rows,k=(sy*wood.width+sx)*4;
     const base=wood.pixels[k+3]<128?[166,105,45]:[wood.pixels[k],wood.pixels[k+1],wood.pixels[k+2]],shade=step<1?-46:step<2?8:0;color=base.map(v=>Math.max(0,Math.min(255,v+shade)));
    }
    if(!connected){
     const edge=(beach?outerHalf:pathWidths[ramp.id]/2)-Math.abs(across);
     if(beach&&edge<3)color=color.map(v=>v-(edge<1?26:12));
     if(edge<2)color=color.map(v=>v-22);
     else if(edge<4&&step>=4)color=color.map(v=>v-8);
     if(step>=4&&(Math.floor(wx/4)*17+Math.floor(wy/4)*31)%47===0)color=color.map(v=>v-12);
    }
    image.data.set([...color,255],j);stairPixels++;
   }
   ctx.putImageData(image,0,0);const key=`terrain-stairs-${ramp.id}`;scene.textures.addCanvas(key,c);
   this.objects.push(scene.add.image(left,top,key).setOrigin(0).setScale(pixel).setDepth(-15.8).setData('terrainPassage',ramp.id).setData('stairPixels',stairPixels).setData('integratedBridge',connected?.id??null));
   if(beachRamps.has(ramp.id))this.beachStaircase(scene,ramp);
  }
 }
 private beachStaircase(scene:Phaser.Scene,ramp:(typeof ramps)[number]){
  const dx=ramp.to[0]-ramp.from[0],dy=ramp.to[1]-ramp.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,nx=-uy,ny=ux;
  // Reach deliberately into the upper road and lower beach so the staircase never stops at the cliff seam.
  const upperPad=14,lowerPad=24,outerHalf=ramp.id==='beach-east-steps'?29:28,wall=8,innerHalf=outerHalf-wall;
  const corners=[
   [ramp.from[0]-ux*upperPad+nx*outerHalf,ramp.from[1]-uy*upperPad+ny*outerHalf],
   [ramp.from[0]-ux*upperPad-nx*outerHalf,ramp.from[1]-uy*upperPad-ny*outerHalf],
   [ramp.to[0]+ux*lowerPad+nx*outerHalf,ramp.to[1]+uy*lowerPad+ny*outerHalf],
   [ramp.to[0]+ux*lowerPad-nx*outerHalf,ramp.to[1]+uy*lowerPad-ny*outerHalf],
  ];
  const left=Math.floor(Math.min(...corners.map(q=>q[0])))-6,top=Math.floor(Math.min(...corners.map(q=>q[1])))-6,right=Math.ceil(Math.max(...corners.map(q=>q[0])))+8,bottom=Math.ceil(Math.max(...corners.map(q=>q[1])))+10;
  const c=document.createElement('canvas');c.width=right-left+1;c.height=bottom-top+1;const ctx=c.getContext('2d')!,data=ctx.createImageData(c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const wx=left+x,wy=top+y,vx=wx-ramp.from[0],vy=wy-ramp.from[1],along=vx*ux+vy*uy,across=vx*nx+vy*ny,aa=Math.abs(across);
   if(along<-upperPad||along>length+lowerPad||aa>outerHalf)continue;
   const j=(y*c.width+x)*4,noise=((x*13+y*29)%7)-3;let color:number[];
   const landing=along<0||along>length;
   if(aa>innerHalf){
    const block=((Math.floor((along+upperPad)/9)+Math.floor((aa-innerHalf)/4))&1)===0;
    color=block?[150+noise,144+noise,129+noise]:[126+noise,121+noise,109+noise];
    if(aa>outerHalf-2)color=color.map(v=>v-34);
    else if(aa<innerHalf+2)color=color.map(v=>v+14);
   }else{
    const step=((along+upperPad)%10+10)%10;
    if(landing){
     // Flat stone landing: visually bridges the tan road and beach into the staircase.
     color=[184+noise,173+noise,147+noise];
     if(((Math.floor((along+upperPad)/8))&1)===0&&step<2)color=color.map(v=>v-12);
    }else if(step<2)color=[69,67,62];
    else if(step<4)color=[118+noise,113+noise,101+noise];
    else color=[196+noise,184+noise,157+noise];
    if(aa>innerHalf-2)color=color.map(v=>v-18);
    if(!landing&&step===4)color=color.map(v=>v+11);
   }
   data.data.set([...color,255],j);
  }
  ctx.putImageData(data,0,0);

  // Raised 3D parapets: dark front/side face, stone body, then a bright cap shifted upward.
  const drawRail=(side:number)=>{
   const center=innerHalf+wall*.52;
   ctx.lineCap='square';ctx.lineJoin='miter';
   const stroke=(offsetY:number,width:number,color:string)=>{
    ctx.beginPath();
    const a0=-upperPad,a1=length+lowerPad;
    const x0=ramp.from[0]+ux*a0+nx*side*center-left,y0=ramp.from[1]+uy*a0+ny*side*center-top+offsetY;
    const x1=ramp.from[0]+ux*a1+nx*side*center-left,y1=ramp.from[1]+uy*a1+ny*side*center-top+offsetY;
    ctx.moveTo(Math.round(x0),Math.round(y0));ctx.lineTo(Math.round(x1),Math.round(y1));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
   };
   stroke(5,wall+5,'rgba(48,45,40,.48)'); // cast/front shadow
   stroke(3,wall+2,'rgb(91,87,79)');      // vertical face
   stroke(0,wall,'rgb(147,141,126)');      // wall body
   stroke(-2,Math.max(3,wall-3),'rgb(210,199,173)'); // top cap
   stroke(-3,2,'rgb(235,222,190)');        // highlight
   for(let a=-upperPad+4;a<length+lowerPad-2;a+=10){
    const qx=ramp.from[0]+ux*a+nx*side*center-left,qy=ramp.from[1]+uy*a+ny*side*center-top;
    ctx.fillStyle='rgba(89,84,76,.75)';ctx.fillRect(Math.round(qx)-2,Math.round(qy)-1,4,1);
   }
  };
  drawRail(-1);drawRail(1);

  // End pillars make the rail terminate as architecture instead of a painted stripe.
  for(const a of [-upperPad+3,length+lowerPad-4])for(const side of [-1,1]){
   const qx=ramp.from[0]+ux*a+nx*side*(innerHalf+wall*.52)-left,qy=ramp.from[1]+uy*a+ny*side*(innerHalf+wall*.52)-top;
   ctx.fillStyle='rgba(54,51,46,.42)';ctx.fillRect(Math.round(qx)-5,Math.round(qy)+1,10,8);
   ctx.fillStyle='rgb(132,127,115)';ctx.fillRect(Math.round(qx)-5,Math.round(qy)-3,10,8);
   ctx.fillStyle='rgb(220,208,180)';ctx.fillRect(Math.round(qx)-4,Math.round(qy)-5,8,3);
  }

  const key=`beach-staircase-${ramp.id}`;if(scene.textures.exists(key))scene.textures.remove(key);scene.textures.addCanvas(key,c);
  this.objects.push(scene.add.image(left,top,key).setOrigin(0).setDepth(-15.45).setData('terrainPassage',ramp.id).setData('beachStaircase',true));
 }
 update(view:Phaser.Geom.Rectangle){for(const image of this.objects)image.setVisible(Phaser.Geom.Rectangle.Overlaps(view,image.getBounds()));}
 get diagnostics(){return {stairs:this.objects.length,bridgeRails:0,clippedToHistoricalFaces:true};}
}
