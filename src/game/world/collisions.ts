import { MAP, mainland, islands, rawWater, bridges, ramps, cliffFaces } from './mapConfig';
import type { NavigationData } from '../navigation';
export const WATER_COLLISION = rawWater;
export const CLIFF_COLLISION = cliffFaces;
// Passages override only their terrain type. A future trunk/building obstacle still blocks a bridge.
export const navigation:NavigationData = {
 ...MAP,cell:MAP.navigationCell,walkable:[mainland,...islands.map(i=>i.shape),...bridges.map(b=>b.shape)],
 obstacles:CLIFF_COLLISION,terrainObstacles:CLIFF_COLLISION,water:WATER_COLLISION,bridges:bridges.map(b=>b.shape),
 waterIslands:islands.map(i=>i.shape),passages:ramps.map(r=>r.shape),
};
export function navigationFor(capabilities:readonly ('LAND'|'WATER')[],obstacles:NavigationData['obstacles']=[]):NavigationData {
 return {...navigation,obstacles:[...navigation.obstacles,...obstacles],swims:capabilities.includes('WATER')};
}
