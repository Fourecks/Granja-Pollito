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
export interface NavigationData { width: number; height: number; walkable: Polygon[]; obstacles: Polygon[]; bridges?: Polygon[]; }
export class NavigationGrid {
  readonly cell = 8;
  private cols: number;
  private rows: number;
  private cells: Uint8Array;
  private edges=new Map<number,boolean>();
  constructor(readonly data: NavigationData, readonly radius = 3) {
    this.cols = Math.ceil(data.width / this.cell); this.rows = Math.ceil(data.height / this.cell);
    this.cells = new Uint8Array(this.cols * this.rows);
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) this.cells[y * this.cols + x] = this.canWalk(...this.center(y * this.cols + x)) ? 1 : 0;
  }
  canWalk(x: number, y: number): boolean {
    for (const [dx, dy] of [[0, 0], [this.radius, 0], [-this.radius, 0], [0, this.radius], [0, -this.radius]]) {
      const point: Point = [x + dx, y + dy];
      if (!this.data.walkable.some(poly => inside(point, poly))) return false;
      if (!this.data.bridges?.some(poly => inside(point, poly)) && this.data.obstacles.some(poly => inside(point, poly))) return false;
    }
    return true;
  }
  segment(a: Point, b: Point): boolean {
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(distance / .75));
    for (let i = 0; i <= steps; i++) if (!this.canWalk(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)) return false;
    return true;
  }
  private center(index: number): [number, number] { return [(index % this.cols + .5) * this.cell, (Math.floor(index / this.cols) + .5) * this.cell]; }
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
    const open = new Set([first]), visited = new Set<number>();
    const costs = new Map([[first, 0]]), previous = new Map<number, number>();
    const heuristic = (i: number) => Math.hypot(this.center(i)[0] - goal[0], this.center(i)[1] - goal[1]);
    while (open.size) {
      let current = -1, best = Infinity;
      for (const i of open) { const score = costs.get(i)! + heuristic(i); if (score < best) { current = i; best = score; } }
      if (current === last) {
        const points: Point[] = [goal]; let cursor = current;
        while (cursor !== first) { points.unshift(this.center(cursor)); cursor = previous.get(cursor)!; }
        points.unshift(this.center(first));points.unshift(start);
        const result: Point[] = []; let i = 0;
        while (i < points.length - 1) { let j = i + 1; while (j + 1 < points.length && this.segment(points[i], points[j + 1])) j++; result.push(points[j]); i = j; }
        let prior: Point = start; for (const point of result) { if (!this.segment(prior, point)) return []; prior = point; }
        return result;
      }
      open.delete(current); visited.add(current);
      const cx = current % this.cols, cy = Math.floor(current / this.cols);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const x = cx + dx, y = cy + dy, next = y * this.cols + x;
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows || visited.has(next) || !this.cells[next]) continue;
        if (dx && dy && (!this.cells[cy * this.cols + x] || !this.cells[y * this.cols + cx])) continue;

        const edgeKey=Math.min(current,next)*this.cells.length+Math.max(current,next);
        let safe=this.edges.get(edgeKey);if(safe===undefined){safe=this.segment(this.center(current),this.center(next));this.edges.set(edgeKey,safe);}if(!safe)continue;
        const cost = costs.get(current)! + this.cell * (dx && dy ? Math.SQRT2 : 1);
        if (cost >= (costs.get(next) ?? Infinity)) continue;
        costs.set(next, cost); previous.set(next, current); open.add(next);
      }
    }
    return [];
  }
}
export const rectangle = (x: number, y: number, w: number, h: number): Polygon => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export function corridor(points: Polygon, width = 30): Polygon[] {
  return points.slice(1).map((b, i) => { const a = points[i], distance = Math.hypot(b[0]-a[0],b[1]-a[1]); const dx=(b[1]-a[1])/distance*width, dy=(a[0]-b[0])/distance*width; return [[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]]; });
}
