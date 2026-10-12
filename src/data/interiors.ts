import { rectangle, type Polygon } from '../game/navigation';
import type { InteriorId } from './world';
export interface InteriorData { id: InteriorId; title: string; asset: string; walkable: Polygon[]; obstacles: Polygon[]; }
export const interiors: Record<InteriorId,InteriorData> = {
 home:{id:'home',title:'Casa de La Jefa',asset:'/assets/interior-home-v2.webp',walkable:[rectangle(340,320,1120,430)],obstacles:[rectangle(365,334,425,220),rectangle(1000,300,350,125)]},
 coop:{id:'coop',title:'Interior del gallinero',asset:'/assets/interior-coop-v2.webp',walkable:[rectangle(410,340,930,290)],obstacles:[]},
 barn:{id:'barn',title:'Interior del establo',asset:'/assets/interior-barn-v2.webp',walkable:[rectangle(390,330,980,330)],obstacles:[]},
 shed:{id:'shed',title:'Invernadero y almacén',asset:'/assets/interior-shed-v2.webp',walkable:[rectangle(740,380,260,380)],obstacles:[rectangle(530,405,225,200),rectangle(950,410,210,220)]},
};
