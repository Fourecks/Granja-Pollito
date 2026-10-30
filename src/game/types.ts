import type { MutableRefObject } from 'react';
import type { CharacterData } from '../data/farm';
import type { InteriorId } from '../data/world';
import type { FarmState, TaskId } from '../domain';
export interface SceneProps {
 selected: string | null; onSelect: (id:string)=>void; characters:CharacterData[];
 state:FarmState; activeTasks:TaskId[]; onTaskRequest:(id:TaskId)=>void; onTaskComplete:(id:TaskId)=>void; onTaskError:(id:TaskId,message:string)=>void;
 onLocation:(id:InteriorId|null)=>void;
}
export interface FarmRuntime {
 props:MutableRefObject<SceneProps>; room:InteriorId|null; owners:Map<TaskId,string>; completed:Set<TaskId>;
 busyWorkers:Map<string,TaskId>; loadedRooms:Set<InteriorId>; loading:(loading:boolean)=>void;
}
