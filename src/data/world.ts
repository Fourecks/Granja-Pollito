// Stable imports for existing interiors, tasks and React; exterior geography lives in game/world.
export { MAP } from '../game/world/mapConfig';
export { navigation } from '../game/world/collisions';
import { rawWater, bridges } from '../game/world/mapConfig';
import { zoneById, zones } from '../game/world/zones';
import type { Polygon } from '../game/navigation';
export const coopPen:Polygon = zoneById.chickenArea.shape;
export const cowPen:Polygon = zoneById.cowArea.shape;
export const waterZones=rawWater;
export const bridge=bridges[0].shape;
export type InteriorId = 'home'|'coop'|'barn'|'shed';
export interface WorldObjectData {id:string;x:number;y:number;hitWidth:number;hitHeight:number;enter?:InteriorId}
export const worldObjects:WorldObjectData[] = zones.filter(z=>z.legacyObject).map(z=>({id:z.legacyObject!,x:z.center[0],y:z.center[1],hitWidth:90,hitHeight:60}));
