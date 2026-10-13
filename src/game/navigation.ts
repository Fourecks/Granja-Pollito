export type Point = readonly [number, number];
export type Polygon = readonly Point[];
export function inside(point: Point, polygon: Polygon): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    const cross=(point[0]-xi)*(yj-yi)-(point[1]-yi)*(xj-xi);
    if(Math.abs(cross)<1e-7&&point[0]>=Math.min(xi,xj)&&point[0]<=Math.max(xi,xj)&&point[1]>=Math.min(yi,yj)&&point[1]<=Math.max(yi,yj))return true;
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
export interface NavigationData { width: number; height: number; walkable: Polygon[]; obstacles: Polygon[]; bridges?: Polygon[]; water?:Polygon[]; waterIslands?:Polygon[]; passages?:Polygon[]; terrainObstacles?:Polygon[]; swims?:boolean; cell?:number; }
export class NavigationGrid {
  readonly cell: number;
  private cols: number;
  private rows: number;
  private cells: Uint8Array;
  private centers:Float64Array;
  private edges=new Map<number,boolean>();
  private obstacleBuckets=new Map<string,Polygon[]>();
  private bounds=new Map<Polygon,{minX:number;maxX:number;minY:number;maxY:number}>();
  constructor(readonly data: NavigationData, readonly radius = 3) {
    this.cell=data.cell??8;
    for(const poly of [...data.walkable,...data.obstacles,...(data.water??[]),...(data.waterIslands??[]),...(data.bridges??[]),...(data.passages??[])]){
      const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);this.bounds.set(poly,{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)});
    }
    for(const poly of data.obstacles){const b=this.bounds.get(poly)!;for(let y=Math.floor(b.minY/128);y<=Math.floor(b.maxY/128);y++)for(let x=Math.floor(b.minX/128);x<=Math.floor(b.maxX/128);x++){const key=`${x},${y}`,list=this.obstacleBuckets.get(key)??[];list.push(poly);this.obstacleBuckets.set(key,list);}}

    this.cols = Math.ceil(data.width / this.cell); this.rows = Math.ceil(data.height / this.cell);
    this.cells = new Uint8Array(this.cols * this.rows);
    this.centers=new Float64Array(this.cells.length*2);
    // Preserve the coarse world grid, but align nodes inside narrow crossing rectangles
    // to their centerline. Every connecting edge still proves continuous footprint clearance.
    const crossings=[...(data.bridges??[]),...(data.passages??[])].filter(p=>p.length===4&&Math.hypot(p[0][0]-p[3][0],p[0][1]-p[3][1])<this.cell*3);
    for(let i=0;i<this.cells.length;i++){
      let x=(i%this.cols+.5)*this.cell,y=(Math.floor(i/this.cols)+.5)*this.cell;
      for(const p of crossings){if(!inside([x,y],p))continue;
        const ax=(p[0][0]+p[3][0])/2,ay=(p[0][1]+p[3][1])/2,bx=(p[1][0]+p[2][0])/2,by=(p[1][1]+p[2][1])/2;
        const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
        const px=ax+dx*t,py=ay+dy*t;if(this.canWalk(px,py)){x=px;y=py;}break;
      }
      this.centers[i*2]=x;this.centers[i*2+1]=y;
    }

    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) this.cells[y * this.cols + x] = this.canWalk(...this.center(y * this.cols + x)) ? 1 : 0;
  }
  canWalk(x: number, y: number): boolean {
    const r=this.radius;
    for (const [dx, dy] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]) {
      const point:Point=[x+dx,y+dy];
      if(point[0]<0||point[1]<0||point[0]>=this.data.width||point[1]>=this.data.height)return false;
      const water=this.data.water?.some(poly=>inside(point,poly))&&!this.data.waterIslands?.some(poly=>inside(point,poly));
      const onBridge=this.data.bridges?.some(poly=>inside(point,poly));
      if(water&&!onBridge&&!this.data.swims)return false;
      if(!this.data.walkable.some(poly=>inside(point,poly))&&!(water&&this.data.swims))return false;
      if((this.obstacleBuckets.get(`${Math.floor(point[0]/128)},${Math.floor(point[1]/128)}`)??[]).some(poly=>inside(point,poly)&&!(this.data.terrainObstacles?.includes(poly)&&this.data.passages?.some(p=>inside(point,p)))))return false;
    }
    return true;
  }
  segment(a: Point, b: Point): boolean {
    // Split at every terrain boundary for each footprint probe. Midpoints prove
    // continuous clearance, including narrow fence corners missed by sampling.
    const dx=b[0]-a[0],dy=b[1]-a[1],cuts=[0,1];
    for(const [ox,oy] of [[0,0],[this.radius,0],[-this.radius,0],[0,this.radius],[0,-this.radius],[this.radius*.707,this.radius*.707],[-this.radius*.707,this.radius*.707],[this.radius*.707,-this.radius*.707],[-this.radius*.707,-this.radius*.707]]){
     for(const polygon of [...this.data.walkable,...this.data.obstacles,...(this.data.water??[]),...(this.data.waterIslands??[]),...(this.data.bridges??[]),...(this.data.passages??[])]){
      const bounds=this.bounds.get(polygon)!;
      if(bounds.maxX<Math.min(a[0],b[0])+ox||bounds.minX>Math.max(a[0],b[0])+ox||bounds.maxY<Math.min(a[1],b[1])+oy||bounds.minY>Math.max(a[1],b[1])+oy)continue;
      for(let i=0;i<polygon.length;i++){
      const c=polygon[i],d=polygon[(i+1)%polygon.length],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
      const cx=c[0]-a[0]-ox,cy=c[1]-a[1]-oy,t=(cx*ey-cy*ex)/den,u=(cx*dy-cy*dx)/den;
      if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
     }}
    }
    cuts.sort((x,y)=>x-y);
    for(let i=0;i<cuts.length;i++){const t=cuts[i];if(!this.canWalk(a[0]+dx*t,a[1]+dy*t))return false;if(i){const mid=(t+cuts[i-1])/2;if(!this.canWalk(a[0]+dx*mid,a[1]+dy*mid))return false;}}
    return true;
  }

  private center(index: number): [number, number] { return [this.centers[index*2],this.centers[index*2+1]]; }
  nearest(point: Point): [number, number] {
    if (this.canWalk(...point)) return [point[0], point[1]];
    let best = -1, distance = Infinity;
    for (let i = 0; i < this.cells.length; i++) if (this.cells[i]) {
      const p = this.center(i), d = (p[0] - point[0]) ** 2 + (p[1] - point[1]) ** 2;
      if (d < distance) { best = i; distance = d; }
    }
    if (best < 0) throw new Error('La zona no tiene suelo transitable.');
    return this.center(best);
  }
  path(start: Point, goal: Point): Point[] {
    // Never silently move a destination out of water or through a solid object.
    if (!this.canWalk(...start) || !this.canWalk(...goal)) return [];
    if (this.segment(start, goal)) return [goal];
    const closest=(point:Point)=>{
      const cx=Math.floor(point[0]/this.cell),cy=Math.floor(point[1]/this.cell);let best=-1,distance=Infinity;
      for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=this.cols||y>=this.rows)continue;const candidate=y*this.cols+x;if(!this.cells[candidate])continue;const center=this.center(candidate),d=Math.hypot(center[0]-point[0],center[1]-point[1]);if(d<distance&&this.segment(point,center)){best=candidate;distance=d;}}
      return best;
    };
    const first = closest(start), last = closest(goal);if(first<0||last<0)return [];
    const visited = new Set<number>(),heap:Array<{id:number;score:number}>=[];
    const push=(id:number,score:number)=>{heap.push({id,score});let i=heap.length-1;while(i){const parent=(i-1)>>1;if(heap[parent].score<=score)break;[heap[parent],heap[i]]=[heap[i],heap[parent]];i=parent;}};
    const pop=()=>{const result=heap[0],last=heap.pop()!;if(heap.length){heap[0]=last;let i=0;for(;;){let child=i*2+1;if(child>=heap.length)break;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[i].score<=heap[child].score)break;[heap[i],heap[child]]=[heap[child],heap[i]];i=child;}}return result.id;};
    const costs = new Map([[first, 0]]), previous = new Map<number, number>();
    const heuristic = (i: number) => Math.hypot(this.center(i)[0] - goal[0], this.center(i)[1] - goal[1]);
    push(first,heuristic(first));
    while (heap.length) {
      const current=pop();if(visited.has(current))continue;
      if (current === last) {
        const points: Point[] = [goal]; let cursor = current;
        while (cursor !== first) { points.unshift(this.center(cursor)); cursor = previous.get(cursor)!; }
        points.unshift(this.center(first));points.unshift(start);
        const result: Point[] = []; let i = 0;
        while (i < points.length - 1) { let j = i + 1; while (j + 1 < points.length && this.segment(points[i], points[j + 1])) j++; result.push(points[j]); i = j; }
        let prior: Point = start; for (const point of result) { if (!this.segment(prior, point)) return []; prior = point; }
        return result;
      }
      visited.add(current);
      const cx = current % this.cols, cy = Math.floor(current / this.cols);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1,-1], [-1,1], [1,-1], [1,1]]) {
        const x = cx + dx, y = cy + dy, next = y * this.cols + x;
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows || visited.has(next) || !this.cells[next]) continue;
        // The continuous footprint check below also guards diagonal corner cutting.

        const edgeKey=Math.min(current,next)*this.cells.length+Math.max(current,next);
        let safe=this.edges.get(edgeKey);if(safe===undefined){safe=this.segment(this.center(current),this.center(next));this.edges.set(edgeKey,safe);}if(!safe)continue;
        const cost = costs.get(current)! + Math.hypot(this.center(next)[0]-this.center(current)[0],this.center(next)[1]-this.center(current)[1]);
        if (cost >= (costs.get(next) ?? Infinity)) continue;
        costs.set(next, cost); previous.set(next, current); push(next,cost+heuristic(next));
      }
    }
    return [];
  }
}
export const rectangle = (x: number, y: number, w: number, h: number): Polygon => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export function corridor(points: Polygon, width = 30): Polygon[] {
  return points.slice(1).map((b, i) => { const a = points[i], distance = Math.hypot(b[0]-a[0],b[1]-a[1]); const dx=(b[1]-a[1])/distance*width, dy=(a[0]-b[0])/distance*width; return [[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]]; });
}
