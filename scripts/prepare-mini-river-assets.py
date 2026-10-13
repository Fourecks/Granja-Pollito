"""Slice generated reference-bound assets; preserve alpha, aspect ratio and nearest pixels."""
from PIL import Image
from pathlib import Path
import json, os, numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(os.environ.get('RIVER_ART_SOURCE',str(Path.home()/'.codex/generated_images/01a13609-afca-7082-998b-b14b4be95474')))
INPUTS={
 'stone':'exec-f5734a66-7d3a-4fe0-a465-f0c613c6a5c9.png',
 'farm':'exec-0761504b-1b10-49f0-b640-2672f7d85e09.png',
 'large':'exec-659f939d-f3b6-4e97-9103-74541deda882.png',
 'medium':'exec-bf91b7f0-efc7-4f12-b4ab-1f238a8cb704.png',
 'small':'exec-6e509ca8-ca21-411a-86e2-7b0af00a637c.png',
 'water':'exec-551e3c73-0f3a-46d4-9360-04e9987d2572.png',
}
OUT=ROOT/'public/assets'
def clean(im):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<8,:]=0
 return Image.fromarray(a)
def save(im,name,frames):
 path=OUT/(name+'.png');clean(im).quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(path,optimize=True)
 (OUT/(name+'.json')).write_text(json.dumps({'frames':{k:{'frame':v,'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':v['w'],'h':v['h']},'sourceSize':{'w':v['w'],'h':v['h']}} for k,v in frames.items()},'meta':{'image':path.name,'scale':'1','generator':'ImageGen; primary reference Diseños de puentes, cascadas y ríos.png'}},indent=2)+'\n')
 print(name,im.size,path.stat().st_size)
for style in ['stone']:
 src=Image.open(SOURCE/INPUTS[style]).convert('RGBA');cw,ch=src.width//3,src.height//2
 atlas=Image.new('RGBA',(768,512));frames={};roles=['planks','post','beam','stone','decor','landing']
 if style=='rustic':roles[-2:]=['landing','rope']
 for i,role in enumerate(roles):
  cell=src.crop((i%3*cw,i//3*ch,(i%3+1)*cw,(i//3+1)*ch));bounds=cell.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
  assert bounds,role
  cell=cell.crop(bounds);factor=min(240/cell.width,240/cell.height,1);cell=cell.resize((round(cell.width*factor),round(cell.height*factor)),Image.Resampling.NEAREST)
  x=i%3*256+8;y=i//3*256+8;atlas.paste(cell,(x,y));frames[role]={'x':x,'y':y,'w':cell.width,'h':cell.height}
 save(atlas,'bridge-'+style+'-v2',frames)
for kind,cols,rows in [('medium',3,2),('small',3,2)]:
 src=Image.open(SOURCE/INPUTS[kind]).convert('RGBA');cw,ch=src.width//cols,src.height//rows;cells=[];bounds=[]
 for i in range(cols*rows):
  cell=src.crop((i%cols*cw,i//cols*ch,(i%cols+1)*cw,(i//cols+1)*ch));cells.append(cell);bounds.append(cell.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox())
 union=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
 width,height=union[2]-union[0],union[3]-union[1];factor=min(240/width,320/height,1);fw,fh=round(width*factor),round(height*factor)
 atlas=Image.new('RGBA',(cols*(fw+16),rows*(fh+16)));frames={}
 for i,cell in enumerate(cells):
  tile=cell.crop(union).resize((fw,fh),Image.Resampling.NEAREST);x=i%cols*(fw+16)+8;y=i//cols*(fh+16)+8;atlas.paste(tile,(x,y));frames[str(i)]={'x':x,'y':y,'w':fw,'h':fh}
 save(atlas,'waterfall-'+kind+'-v2',frames)
