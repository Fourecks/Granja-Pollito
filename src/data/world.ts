export interface WorldObjectData {
  id: string;
  x: number;
  y: number;
  interactive?: boolean;
  hitWidth?: number;
  hitHeight?: number;
}

export interface WorldBuildingData {
  id: string;
  x: number;
  y: number;
  sprite: string;
  scale: number;
}

export const worldBuildings: WorldBuildingData[] = [
  { id: 'coop', x: 980, y: 600, sprite: 'coop-sprite', scale: .29 },
  { id: 'home', x: 1270, y: 480, sprite: 'home-sprite', scale: .19 },
  { id: 'barn', x: 1770, y: 715, sprite: 'barn-sprite', scale: .24 },
  { id: 'shed', x: 2110, y: 500, sprite: 'building-shed', scale: 1.1 },
];

export const worldObjects: WorldObjectData[] = [
  { id: 'sign', x: 410, y: 839, interactive: true, hitWidth: 135, hitHeight: 120 },
  { id: 'pond', x: 610, y: 1400, interactive: true, hitWidth: 230, hitHeight: 170 },
  { id: 'well', x: 1360, y: 560, interactive: true, hitWidth: 130, hitHeight: 140 },
  { id: 'coop', x: 980, y: 600, interactive: true, hitWidth: 420, hitHeight: 330 },
  { id: 'home', x: 1270, y: 480, interactive: true, hitWidth: 290, hitHeight: 270 },
  { id: 'garden', x: 1680, y: 945, interactive: true, hitWidth: 420, hitHeight: 250 },
  { id: 'bench', x: 1950, y: 1130, interactive: true, hitWidth: 145, hitHeight: 105 },
  { id: 'barn', x: 1770, y: 715, interactive: true, hitWidth: 350, hitHeight: 310 },
  { id: 'shed', x: 2110, y: 500, interactive: true, hitWidth: 180, hitHeight: 155 },
  { id: 'secret-flower', x: 2190, y: 1425, interactive: true, hitWidth: 90, hitHeight: 80 },
];

export interface MapDecoration {
  id: string;
  type: 'flowers' | 'crate' | 'bench' | 'fence' | 'hay' | 'rocks' | 'stump' | 'log' | 'sign' | 'well' | 'bridge' | 'scarecrow';
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
}

// Static composition lives here so the renderer only interprets data.
export const mapDecorations: MapDecoration[] = [
  { id: 'house-garden-left', type: 'flowers', x: 1140, y: 552, scale: .75 },
  { id: 'house-garden-right', type: 'flowers', x: 1390, y: 562, scale: .72 },
  { id: 'coop-nest-01', type: 'hay', x: 850, y: 660, scale: .82 },
  { id: 'coop-nest-02', type: 'hay', x: 1115, y: 685, scale: .78 },
  { id: 'coop-feed-01', type: 'crate', x: 835, y: 625, scale: .9 },
  { id: 'coop-feed-02', type: 'crate', x: 1120, y: 650, scale: .85 },
  { id: 'barn-hay', type: 'hay', x: 1830, y: 786, scale: .92 },
  { id: 'barn-crates', type: 'crate', x: 1650, y: 752, scale: .88 },
  { id: 'bench-oak', type: 'bench', x: 1950, y: 1130, scale: 1.05 },
  { id: 'garden-flower-01', type: 'flowers', x: 1480, y: 1042, scale: .8 },
  { id: 'garden-flower-02', type: 'flowers', x: 1795, y: 900, scale: .7 },
  { id: 'pond-reeds', type: 'flowers', x: 740, y: 1510, scale: .75 },
  { id: 'orchard-log', type: 'log', x: 2050, y: 1490, scale: .92, rotation: -.14 },
  { id: 'woodland-rocks', type: 'rocks', x: 740, y: 445, scale: .78 },
  { id: 'woodland-stump', type: 'stump', x: 2220, y: 865, scale: .9 },
  { id: 'fence-north', type: 'fence', x: 832, y: 569, scale: .9 },
  { id: 'fence-south', type: 'fence', x: 1865, y: 850, scale: .85 },
  { id: 'fence-meadow', type: 'fence', x: 1990, y: 730, scale: .9 },
  { id: 'hidden-flower-bed', type: 'flowers', x: 2190, y: 1425, scale: .7 },
  { id: 'picnic-crate', type: 'crate', x: 1900, y: 1180, scale: .68 },
  { id: 'pathside-stones', type: 'rocks', x: 1330, y: 812, scale: .72 },
  { id: 'coop-flower-01', type: 'flowers', x: 775, y: 709, scale: .82 },
  { id: 'coop-flower-02', type: 'flowers', x: 1080, y: 728, scale: .78 },
  { id: 'coop-flower-03', type: 'flowers', x: 1165, y: 610, scale: .7 },
  { id: 'coop-pen-front-01', type: 'fence', x: 795, y: 786, scale: .82 },
  { id: 'coop-pen-front-02', type: 'fence', x: 908, y: 786, scale: .82 },
  { id: 'coop-pen-front-03', type: 'fence', x: 1021, y: 786, scale: .82 },
  { id: 'coop-pen-front-04', type: 'fence', x: 1134, y: 786, scale: .82 },
  { id: 'coop-pen-left', type: 'fence', x: 746, y: 698, scale: .7, rotation: -1.2 },
  { id: 'coop-pen-right', type: 'fence', x: 1210, y: 700, scale: .7, rotation: 1.2 },
  { id: 'house-bush-01', type: 'flowers', x: 1150, y: 487, scale: .72 },
  { id: 'house-bush-02', type: 'flowers', x: 1380, y: 500, scale: .72 },
  { id: 'orchard-crate', type: 'crate', x: 1570, y: 1300, scale: .8 },
  { id: 'pond-stones', type: 'rocks', x: 850, y: 1340, scale: .8 },
  { id: 'pond-flowers', type: 'flowers', x: 940, y: 1435, scale: .7 },
  { id: 'meadow-flowers', type: 'flowers', x: 1840, y: 1050, scale: .76 },
  { id: 'garden-border-01', type: 'flowers', x: 1310, y: 998, scale: .78 },
  { id: 'garden-border-02', type: 'flowers', x: 1750, y: 1033, scale: .72 },
  { id: 'coop-hay-03', type: 'hay', x: 980, y: 745, scale: .75 },
  { id: 'coop-nest-03', type: 'crate', x: 785, y: 660, scale: .72 },
  { id: 'barn-feed-01', type: 'hay', x: 1850, y: 828, scale: .82 },
  { id: 'woodland-bench', type: 'bench', x: 2190, y: 900, scale: .78 },
  { id: 'farm-entrance-sign', type: 'sign', x: 410, y: 839, scale: 1.15 },
  { id: 'garden-well', type: 'well', x: 1360, y: 560, scale: .9 },
  { id: 'pond-bridge', type: 'bridge', x: 540, y: 1360, scale: .86 },
  { id: 'crop-scarecrow', type: 'scarecrow', x: 1450, y: 1270, scale: .9 },
];
