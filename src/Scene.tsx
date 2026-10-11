import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { CharacterData } from './data/farm';
import { mapDecorations, worldBuildings, worldObjects } from './data/world';

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  characters: CharacterData[];
  workingCharacter: string | null;
  workingTask: string | null;
  onZoom: (delta: number) => void;
}

const MAP = { width: 2600, height: 1900 };
type ArtContext = CanvasRenderingContext2D;

function texture(scene: Phaser.Scene, key: string, width: number, height: number, paint: (ctx: ArtContext) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  paint(ctx);
  scene.textures.addCanvas(key, canvas);
}

function pixel(ctx: ArtContext, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function paintGrass(ctx: ArtContext) {
  pixel(ctx, 0, 0, 128, 128, '#849d4b');
  const colors = ['#8fa653', '#788e43', '#94a958', '#6f8741', '#a0ad5a'];
  for (let i = 0; i < 140; i++) {
    const x = (i * 47 + (i % 7) * 13) % 128;
    const y = (i * 71 + (i % 9) * 7) % 128;
    pixel(ctx, x, y, i % 5 === 0 ? 7 : 3, i % 4 === 0 ? 4 : 2, colors[i % colors.length]);
  }
  for (let i = 0; i < 15; i++) {
    const x = (i * 37 + 12) % 128, y = (i * 53 + 16) % 128;
    pixel(ctx, x, y, 2, 5, '#c2bd69');
    pixel(ctx, x - 2, y + 2, 3, 2, '#b5bf66');
    pixel(ctx, x + 2, y + 1, 3, 2, '#b5bf66');
  }
}

function paintBuilding(ctx: ArtContext, kind: 'coop' | 'home' | 'barn' | 'shed') {
  const palettes = {
    coop: { roof: '#a9523f', roofLight: '#cf7651', wall: '#ead7a5', trim: '#81513c', door: '#644339', detail: '#80a9a2' },
    home: { roof: '#a55d43', roofLight: '#cf8260', wall: '#f1dfb9', trim: '#84563e', door: '#76513e', detail: '#89aaa0' },
    barn: { roof: '#788e53', roofLight: '#9daf66', wall: '#edd5a0', trim: '#77533c', door: '#966845', detail: '#91aaa0' },
    shed: { roof: '#687d4c', roofLight: '#8a9c5e', wall: '#e8d0a0', trim: '#775139', door: '#82563d', detail: '#83a6a0' },
  }[kind];
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  // Ground shadow and a low, warm stone foundation.
  pixel(ctx, 19, h - 19, w - 38, 11, '#647547');
  pixel(ctx, 25, h - 25, w - 50, 10, '#c59a69');
  pixel(ctx, 31, h - 31, w - 62, 8, '#e8ca91');
  const top = kind === 'coop' ? 45 : 51;
  const left = kind === 'home' ? 20 : 27;
  const right = w - left;
  const wallBottom = h - 29;
  // Wall planes, with a darker side to suggest the elevated 3/4 view.
  pixel(ctx, left, top + 20, right - left, wallBottom - top - 20, palettes.wall);
  pixel(ctx, left, top + 20, 12, wallBottom - top - 20, '#d7ba88');
  pixel(ctx, right - 18, top + 20, 18, wallBottom - top - 20, '#c6a777');
  for (let y = top + 35; y < wallBottom; y += 17) {
    pixel(ctx, left, y, right - left - 2, 2, '#d6ba8d');
    pixel(ctx, left + 13 + ((y / 17) % 2) * 9, y + 2, 2, 12, '#d6ba8d');
  }
  // Layered, stepped roof in crisp pixel rows.
  const roofBase = top + 24;
  for (let row = 0; row < 39; row += 3) {
    const inset = Math.max(0, 37 - row);
    pixel(ctx, left - 16 + inset, roofBase - 39 + row, right - left + 32 - inset * 2, 4, row % 2 ? palettes.roof : palettes.roofLight);
    pixel(ctx, left - 17 + inset, roofBase - 38 + row, 4, 4, palettes.trim);
    pixel(ctx, right + 13 - inset, roofBase - 38 + row, 4, 4, palettes.trim);
  }
  pixel(ctx, left - 13, roofBase, right - left + 26, 7, palettes.trim);
  pixel(ctx, left - 9, roofBase + 2, right - left + 18, 3, palettes.roofLight);
  // Roof boards, ridge and eaves.
  for (let x = left + 2; x < right - 2; x += 18) pixel(ctx, x, top - 8, 4, 31, '#9d503e');
  pixel(ctx, left + 4, top - 15, right - left - 8, 5, '#e1a071');
  pixel(ctx, left + 13, top - 10, right - left - 26, 5, palettes.trim);
  // Door and windows.
  const doorX = kind === 'coop' ? w / 2 - 12 : w / 2 - 14;
  pixel(ctx, doorX - 4, wallBottom - 45, 34, 48, palettes.trim);
  pixel(ctx, doorX, wallBottom - 41, 26, 44, palettes.door);
  pixel(ctx, doorX + 11, wallBottom - 38, 3, 36, '#b37b4d');
  pixel(ctx, doorX + 20, wallBottom - 20, 3, 3, '#efcf78');
  for (const wx of [left + 20, right - 39]) {
    pixel(ctx, wx - 4, top + 37, 30, 27, palettes.trim);
    pixel(ctx, wx, top + 41, 22, 19, palettes.detail);
    pixel(ctx, wx + 9, top + 41, 3, 19, '#e6dbbb');
    pixel(ctx, wx, top + 49, 22, 3, '#e6dbbb');
  }
  if (kind === 'coop') {
    pixel(ctx, w / 2 - 24, wallBottom - 27, 49, 20, '#573e32');
    pixel(ctx, w / 2 - 20, wallBottom - 24, 41, 5, '#e8d3a0');
    pixel(ctx, w / 2 - 4, top - 24, 9, 10, '#f5d479');
  }
  if (kind === 'barn') {
    pixel(ctx, w / 2 - 5, top - 27, 10, 13, '#9a6942');
    pixel(ctx, w / 2 - 2, top - 24, 4, 7, '#f1d29c');
  }
}

function paintTree(ctx: ArtContext, variant: number) {
  const greens = [['#3f633c', '#527643', '#6c8d4c', '#87a353', '#a9b25e'], ['#45613d', '#5b7744', '#718a4b', '#91a454', '#b6b562'], ['#53683b', '#667c43', '#7d9149', '#9eaa56', '#c0b965']][variant % 3];
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  pixel(ctx, w / 2 - 9, h - 50, 19, 42, '#89573a'); pixel(ctx, w / 2 - 4, h - 58, 10, 46, '#ad7650');
  pixel(ctx, w / 2 - 31, h - 24, 32, 8, '#704a34'); pixel(ctx, w / 2 + 4, h - 24, 30, 8, '#704a34');
  pixel(ctx, w / 2 - 1, h - 49, 3, 30, '#cf9960');
  // Five rounded foliage clusters form an irregular crown instead of one flat canopy.
  const blobs = [
    [w * .31, h * .39, w * .27, h * .25, 1], [w * .48, h * .28, w * .31, h * .28, 2],
    [w * .68, h * .40, w * .26, h * .25, 0], [w * .38, h * .56, w * .30, h * .23, 0],
    [w * .63, h * .58, w * .30, h * .23, 1],
  ];
  blobs.forEach(([cx, cy, rx, ry, tone], bi) => {
    for (let y = cy - ry; y <= cy + ry; y += 5) for (let x = cx - rx; x <= cx + rx; x += 5) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      const jitter = (((x * 13 + y * 7 + variant * 19 + bi * 11) % 13) - 6) / 40;
      if (nx * nx + ny * ny + jitter > 1) continue;
      const shade = y < cy - ry * .2 ? 4 : ((x + y + variant + bi) % 9 === 0 ? 3 : tone);
      pixel(ctx, x, y, 6, 6, greens[shade]);
    }
  });
  for (let i = 0; i < 22; i++) {
    const x = (i * 29 + variant * 17) % (w - 12) + 6, y = 22 + (i * 17 + 11) % 72;
    pixel(ctx, x, y, 3 + i % 3, 3, i % 4 === 0 ? '#e0ce75' : greens[3]);
  }
}

function paintCritter(scene: Phaser.Scene, id: string, chicken: boolean) {
  if (chicken) return;
  texture(scene, id, 88, 68, ctx => {
    pixel(ctx, 14, 42, 60, 13, '#718050'); pixel(ctx, 20, 47, 45, 11, '#536644');
    pixel(ctx, 18, 21, 48, 28, '#f1e8d2'); pixel(ctx, 58, 16, 20, 23, '#eee2c8');
    pixel(ctx, 61, 12, 12, 10, '#e9d1b0'); pixel(ctx, 59, 26, 18, 11, '#e2a88d');
    pixel(ctx, 29, 25, 13, 12, '#85706c'); pixel(ctx, 50, 33, 13, 9, '#877570');
    pixel(ctx, 23, 45, 4, 16, '#655443'); pixel(ctx, 40, 45, 4, 16, '#655443');
    pixel(ctx, 57, 44, 4, 17, '#655443'); pixel(ctx, 69, 40, 4, 17, '#655443');
    pixel(ctx, 64, 18, 3, 3, '#443b36'); pixel(ctx, 78, 20, 9, 4, '#b8824b');
  });
}

function makePixelAssets(scene: Phaser.Scene) {
  texture(scene, 'grass-tile', 128, 128, paintGrass);
  texture(scene, 'dirt-yard', 1760, 980, ctx => {
    const edge = [[47, 338], [129, 274], [252, 231], [376, 229], [491, 170], [640, 143], [742, 161], [883, 190], [1009, 151], [1148, 187], [1284, 216], [1405, 283], [1529, 328], [1646, 416], [1691, 522], [1642, 603], [1558, 663], [1468, 729], [1326, 760], [1203, 815], [1077, 857], [949, 884], [821, 850], [704, 897], [571, 856], [452, 814], [329, 784], [215, 731], [111, 635], [64, 524]];
    ctx.beginPath(); ctx.moveTo((edge[0][0] + edge[edge.length - 1][0]) / 2, (edge[0][1] + edge[edge.length - 1][1]) / 2);
    edge.forEach(([x, y], i) => { const next = edge[(i + 1) % edge.length]; ctx.quadraticCurveTo(x, y, (x + next[0]) / 2, (y + next[1]) / 2); }); ctx.closePath();
    ctx.fillStyle = '#a17250'; ctx.fill();
    ctx.strokeStyle = '#c08c61'; ctx.lineWidth = 9; ctx.stroke();
    const flecks = ['#a77955', '#8a6549', '#b38359', '#916849', '#ad7b57', '#816146'];
    for (let i = 0; i < 1100; i++) {
      const x = (i * 197 + (i % 11) * 29) % 1695, y = (i * 313 + (i % 13) * 23) % 920;
      pixel(ctx, x, y, i % 5 === 0 ? 13 : 7, i % 4 === 0 ? 8 : 4, flecks[i % flecks.length]);
    }
    for (let i = 0; i < 30; i++) {
      const x = (i * 211 + 17) % 1690, y = (i * 131 + 22) % 900;
      pixel(ctx, x, y, 24, 5, '#c2986a'); pixel(ctx, x + 7, y + 5, 11, 4, '#c2986a');
    }
  });
  texture(scene, 'building-coop', 168, 142, ctx => paintBuilding(ctx, 'coop'));
  texture(scene, 'building-home', 184, 154, ctx => paintBuilding(ctx, 'home'));
  texture(scene, 'building-barn', 192, 156, ctx => paintBuilding(ctx, 'barn'));
  texture(scene, 'building-shed', 132, 112, ctx => paintBuilding(ctx, 'shed'));
  for (let i = 0; i < 5; i++) texture(scene, `tree-${i}`, 128 + (i % 2) * 16, 138 + (i % 3) * 8, ctx => paintTree(ctx, i));
  texture(scene, 'bush', 74, 46, ctx => {
    pixel(ctx, 12, 32, 52, 8, '#526b3c');
    for (let y = 7; y < 36; y += 5) for (let x = 5; x < 70; x += 5) {
      const nx = (x - 37) / 33, ny = (y - 23) / 21;
      if (nx * nx + ny * ny + (((x * 7 + y * 3) % 9) - 4) / 35 > 1) continue;
      const shade = (x + y) % 7 === 0 ? '#b8b961' : (x * 3 + y) % 5 === 0 ? '#8e9e50' : '#688344';
      pixel(ctx, x, y, 6, 6, shade);
    }
    for (let i = 0; i < 7; i++) pixel(ctx, 13 + i * 8, 15 + (i % 3) * 4, 4, 3, i % 2 ? '#d0be6e' : '#a4b35c');
  });
  texture(scene, 'flower-clump', 86, 48, ctx => {
    pixel(ctx, 6, 35, 74, 8, '#6c8047');
    for (let i = 0; i < 9; i++) {
      const x = 8 + (i * 17) % 67, y = 10 + (i % 3) * 9;
      pixel(ctx, x + 4, y + 8, 3, 16, '#668247'); pixel(ctx, x, y + 5, 5, 5, '#e8d88e');
      pixel(ctx, x + 8, y + 5, 5, 5, i % 2 ? '#d89a7c' : '#efce7d'); pixel(ctx, x + 4, y, 5, 5, '#f4e6ac');
      pixel(ctx, x + 4, y + 5, 5, 5, '#a9764a');
    }
  });
  texture(scene, 'fence', 132, 54, ctx => {
    pixel(ctx, 6, 38, 120, 8, '#77523a'); pixel(ctx, 8, 34, 116, 5, '#b78453');
    for (let x = 9; x < 129; x += 24) { pixel(ctx, x, 6, 8, 36, '#815638'); pixel(ctx, x + 2, 8, 3, 30, '#c18a55'); pixel(ctx, x - 1, 4, 10, 6, '#e0b374'); }
  });
  texture(scene, 'plot-bed', 174, 108, ctx => {
    const diamond = (points: Array<[number, number]>, color: string) => { ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([x,y]) => ctx.lineTo(x,y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
    diamond([[9,54],[86,12],[165,54],[87,101]], '#684f39'); diamond([[17,53],[86,17],[157,53],[87,92]], '#926a45');
    diamond([[24,51],[86,21],[150,52],[87,86]], '#a77b4e');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const x = 46 + c * 16 - r * 5, y = 40 + r * 10;
      pixel(ctx, x, y + 8, 3, 10, '#537444'); pixel(ctx, x - 4, y + 4, 6, 6, '#83a053'); pixel(ctx, x + 2, y + 1, 7, 8, '#acb864');
      pixel(ctx, x + 3, y + 2, 3, 3, c % 2 ? '#e1a164' : '#efcf77');
    }
  });
  texture(scene, 'garden-bed', 172, 96, ctx => {
    const diamond = (points: Array<[number, number]>, color: string) => { ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([x,y]) => ctx.lineTo(x,y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
    diamond([[7,48],[86,7],[164,48],[86,91]], '#684e38'); diamond([[15,47],[86,13],[157,47],[86,83]], '#946d46');
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) { const x = 53 + c * 15 - r * 6, y = 27 + r * 12; pixel(ctx, x, y + 5, 4, 10, '#60834a'); pixel(ctx, x - 5, y + 1, 8, 4, '#a7bb5c'); pixel(ctx, x + 2, y + 2, 8, 4, '#87a553'); }
    }
  });
  texture(scene, 'pond', 204, 116, ctx => {
    pixel(ctx, 17, 52, 170, 48, '#61583c'); pixel(ctx, 25, 43, 156, 49, '#9a8756');
    pixel(ctx, 37, 39, 127, 43, '#416f68'); pixel(ctx, 49, 34, 105, 46, '#4e8980');
    pixel(ctx, 63, 42, 73, 4, '#79a69a'); pixel(ctx, 82, 55, 47, 3, '#9ac0a4');
    for (const [x, y] of [[34, 40], [159, 48], [55, 80], [148, 77], [27, 64], [171, 67]]) pixel(ctx, x, y, 14, 8, '#c3aa73');
    for (let i = 0; i < 8; i++) { const x = (i * 23 + 10) % 192; pixel(ctx, x, 29 + (i % 4) * 12, 4, 12, '#64884b'); pixel(ctx, x + 3, 28 + (i % 4) * 12, 3, 8, '#8da655'); }
  });
  texture(scene, 'sign', 120, 88, ctx => {
    pixel(ctx, 56, 41, 8, 40, '#724d37'); pixel(ctx, 22, 17, 76, 39, '#80573b'); pixel(ctx, 26, 20, 68, 30, '#d6ad68');
    pixel(ctx, 31, 25, 58, 3, '#f0d18b'); pixel(ctx, 31, 43, 58, 3, '#a77648');
    pixel(ctx, 34, 30, 5, 5, '#f4e2b9'); pixel(ctx, 47, 30, 5, 5, '#efdaab'); pixel(ctx, 60, 30, 5, 5, '#f4e2b9'); pixel(ctx, 73, 30, 5, 5, '#efdaab');
  });
  texture(scene, 'bench', 112, 66, ctx => {
    pixel(ctx, 18, 30, 76, 9, '#915e3e'); pixel(ctx, 22, 23, 68, 9, '#bc8654');
    pixel(ctx, 25, 39, 8, 21, '#744d35'); pixel(ctx, 78, 39, 8, 21, '#744d35');
    pixel(ctx, 17, 16, 77, 7, '#8b573b'); pixel(ctx, 22, 10, 68, 7, '#b67b4d');
  });
  texture(scene, 'well', 92, 100, ctx => {
    pixel(ctx, 17, 62, 58, 24, '#80583d'); pixel(ctx, 23, 69, 46, 18, '#9b724b'); pixel(ctx, 25, 60, 42, 6, '#c2925e');
    pixel(ctx, 20, 17, 7, 49, '#744d36'); pixel(ctx, 65, 17, 7, 49, '#744d36'); pixel(ctx, 15, 14, 63, 7, '#956340');
    pixel(ctx, 30, 35, 31, 23, '#47857b'); pixel(ctx, 34, 40, 22, 3, '#89b8a0'); pixel(ctx, 38, 47, 13, 3, '#a6c5a5');
  });
  texture(scene, 'crate', 58, 48, ctx => {
    pixel(ctx, 5, 14, 47, 28, '#966644'); pixel(ctx, 8, 18, 41, 4, '#c18c52'); pixel(ctx, 8, 36, 41, 4, '#775139');
    pixel(ctx, 12, 20, 4, 17, '#dfb56c'); pixel(ctx, 38, 20, 4, 17, '#dfb56c'); pixel(ctx, 25, 19, 4, 20, '#80583c');
  });
  texture(scene, 'hay', 78, 54, ctx => {
    pixel(ctx, 9, 34, 61, 14, '#a87a42'); pixel(ctx, 14, 28, 53, 10, '#d2a254'); pixel(ctx, 20, 22, 40, 9, '#e3bb65');
    pixel(ctx, 21, 26, 3, 24, '#f0d27b'); pixel(ctx, 43, 24, 3, 24, '#efce73'); pixel(ctx, 61, 31, 3, 18, '#c5934d');
  });
  texture(scene, 'rocks', 64, 42, ctx => {
    pixel(ctx, 5, 22, 24, 15, '#756a55'); pixel(ctx, 20, 12, 28, 24, '#91836a'); pixel(ctx, 40, 20, 20, 15, '#736850');
    pixel(ctx, 25, 14, 16, 5, '#b5a27e'); pixel(ctx, 8, 24, 11, 4, '#a19372'); pixel(ctx, 45, 22, 8, 3, '#a49674');
  });
  texture(scene, 'stump', 70, 82, ctx => {
    pixel(ctx, 16, 29, 38, 39, '#72503a'); pixel(ctx, 22, 22, 29, 44, '#945e42'); pixel(ctx, 17, 17, 39, 12, '#c0935b');
    pixel(ctx, 23, 20, 27, 5, '#e0bc7e'); pixel(ctx, 28, 29, 4, 33, '#704b38'); pixel(ctx, 42, 30, 4, 30, '#704b38');
    pixel(ctx, 8, 58, 15, 7, '#674632'); pixel(ctx, 49, 57, 15, 7, '#674632');
  });
  texture(scene, 'log', 112, 52, ctx => {
    pixel(ctx, 10, 23, 87, 19, '#82563b'); pixel(ctx, 17, 17, 73, 12, '#a16a43'); pixel(ctx, 92, 21, 12, 23, '#d5a86e');
    pixel(ctx, 95, 25, 7, 14, '#7c543b'); pixel(ctx, 97, 28, 3, 8, '#c99662'); pixel(ctx, 25, 21, 5, 18, '#6d4835');
  });
  texture(scene, 'scarecrow', 82, 104, ctx => {
    pixel(ctx, 38, 18, 7, 68, '#815838'); pixel(ctx, 14, 39, 54, 7, '#a97849'); pixel(ctx, 13, 29, 13, 20, '#e2bd75');
    pixel(ctx, 31, 14, 22, 18, '#ddb27a'); pixel(ctx, 32, 11, 21, 6, '#78523b'); pixel(ctx, 36, 20, 3, 3, '#54443a'); pixel(ctx, 45, 20, 3, 3, '#54443a');
    pixel(ctx, 28, 32, 28, 29, '#7e9560'); pixel(ctx, 29, 62, 12, 21, '#63794f'); pixel(ctx, 44, 62, 12, 21, '#63794f');
  });
  texture(scene, 'bridge', 192, 76, ctx => {
    pixel(ctx, 10, 48, 170, 11, '#6f4935'); pixel(ctx, 18, 40, 156, 10, '#b67b4c'); pixel(ctx, 27, 33, 139, 9, '#d39a5d');
    for (let x = 25; x < 171; x += 23) pixel(ctx, x, 25, 8, 28, '#80563b');
  });
  // OpenGameArt's CC0 crop atlas has a white matte. Remove it once, then slice real tiles.
  const atlas = scene.textures.get('crop-source').getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas'); canvas.width = atlas.width; canvas.height = atlas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!; ctx.imageSmoothingEnabled = false; ctx.drawImage(atlas, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) if (pixels.data[i] > 242 && pixels.data[i + 1] > 242 && pixels.data[i + 2] > 242) pixels.data[i + 3] = 0;
  ctx.putImageData(pixels, 0, 0); scene.textures.addCanvas('crop-atlas', canvas);
  const cropTexture = scene.textures.get('crop-atlas');
  cropTexture.add('spring-ground', 0, 249, 39, 64, 39);
  cropTexture.add('summer-ground', 0, 320, 39, 68, 39);
  cropTexture.add('autumn-ground', 0, 393, 39, 68, 39);
  cropTexture.add('crop-bed-small', 0, 263, 80, 35, 22);
  paintCritter(scene, 'margarita-sprite', false);
}

class FarmScene extends Phaser.Scene {
  private propsRef: React.MutableRefObject<Props>;
  private onReady: () => void;
  private dragging = false;
  private moved = false;
  private lastPointer = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  private pinchDistance = 0;
  private actors: Array<{ id: string; sprite: Phaser.GameObjects.Sprite; x: number; y: number; path: Array<[number, number]>; state: CharacterData['state']; step: number; nextAction: number }> = [];

  constructor(propsRef: React.MutableRefObject<Props>, onReady: () => void) {
    super('Farm'); this.propsRef = propsRef; this.onReady = onReady;
  }

  preload() {
    this.load.image('farm-background', '/assets/farm-world-background.png');
    this.load.image('coop-sprite', '/assets/coop-building.png');
    this.load.image('home-sprite', '/assets/home-building.png');
    this.load.image('barn-sprite', '/assets/barn-building.png');
    this.load.image('cow-sprite', '/assets/margarita.png');
    this.load.image('crop-source', '/assets/crops_tileset.png');
    this.load.spritesheet('chickens', '/assets/chickens.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    makePixelAssets(this);
    this.createAnimations();
    this.drawWorld();
    this.createCritters();
    this.cameras.main.setBounds(0, 0, MAP.width, MAP.height);
    this.cameras.main.setZoom(window.innerWidth < 760 ? 0.78 : 0.75);
    this.cameras.main.centerOn(window.innerWidth < 760 ? 1100 : 1320, window.innerWidth < 760 ? 690 : 680);
    this.input.addPointer(1);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      const touches = [this.input.pointer1, this.input.pointer2].filter(active => active.isDown);
      if (touches.length > 1) {
        const [first, second] = touches;
        this.pinchDistance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        this.dragging = false;
        this.moved = true;
        this.velocity = { x: 0, y: 0 };
        return;
      }
      this.dragging = true; this.moved = false; this.lastPointer = { x: pointer.x, y: pointer.y };
      this.velocity = { x: 0, y: 0 };
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const touches = [this.input.pointer1, this.input.pointer2].filter(active => active.isDown);
      if (touches.length > 1) {
        const [first, second] = touches;
        const distance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        if (this.pinchDistance > 0) this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * distance / this.pinchDistance, 0.55, 1.65));
        this.pinchDistance = distance;
        this.moved = true;
        return;
      }
      if (!this.dragging || !pointer.isDown) return;
      const dx = pointer.x - this.lastPointer.x, dy = pointer.y - this.lastPointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.moved = true;
      if (this.moved) {
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        this.velocity = { x: -dx / this.cameras.main.zoom * 0.1, y: -dy / this.cameras.main.zoom * 0.1 };
      }
      this.lastPointer = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointerup', () => {
      this.dragging = false;
      if ([this.input.pointer1, this.input.pointer2].filter(active => active.isDown).length < 2) this.pinchDistance = 0;
    });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * (dy < 0 ? 1.08 : 0.92), 0.7, 1.65));
    });
    window.addEventListener('farm-zoom', this.onZoom);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('farm-zoom', this.onZoom));
    this.onReady();
  }

  private onZoom = (event: Event) => {
    const delta = (event as CustomEvent<number>).detail;
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * (delta < 0 ? 1.08 : 0.92), 0.7, 1.65));
  };

  private createAnimations() {
    this.anims.create({ key: 'chick-walk', frames: this.anims.generateFrameNumbers('chickens', { frames: [0, 1, 2, 1] }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'chick-peck', frames: this.anims.generateFrameNumbers('chickens', { frames: [16, 17, 18, 17] }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'chick-sleep', frames: this.anims.generateFrameNumbers('chickens', { frames: [24, 25, 24] }), frameRate: 2, repeat: -1 });
  }

  private drawWorld() {
    // One continuous illustrated terrain replaces the empty-field prototype. Live characters,
    // buildings, crops and interaction targets remain independent Phaser objects above it.
    this.add.image(MAP.width / 2, MAP.height / 2, 'farm-background')
      .setDisplaySize(MAP.width, MAP.height).setDepth(0);
    for (const building of worldBuildings) {
      const originY = building.id === 'shed' ? .9 : .96;
      this.add.image(building.x, building.y, building.sprite).setOrigin(.5, originY).setScale(building.scale).setDepth(building.y).setInteractive();
    }
    // A tiny, slow chimney puff is the only movement attached to the buildings.
    for (let i = 0; i < 3; i++) {
      const puff = this.add.rectangle(1354, 389, 5, 5, 0xf0e5c8, .46).setDepth(900);
      this.tweens.add({ targets: puff, x: 1365 + i * 2, y: 348 - i * 4, alpha: 0, scale: 1.7, duration: 3300, delay: i * 1100, repeat: -1, onRepeat: () => { puff.setPosition(1354, 389); puff.setAlpha(.46).setScale(1); } });
    }
    // Crop beds use the real CC0 spring / summer / autumn tiles as pixel-art ground accents.
    [[1160, 735, 'spring-ground'], [1225, 773, 'summer-ground'], [1290, 811, 'autumn-ground'], [1355, 849, 'crop-bed-small']] .forEach(([x, y, frame]) => {
      this.add.image(Number(x), Number(y), 'crop-atlas', String(frame)).setOrigin(.5, .6).setScale(1.55).setDepth(Number(y) - 1);
    });
    this.add.image(1315, 900, 'plot-bed').setOrigin(.5, .8).setScale(2.25).setDepth(899);
    this.add.image(1680, 945, 'garden-bed').setOrigin(.5, .8).setScale(1.9).setDepth(944);
    this.add.image(1530, 1080, 'plot-bed').setOrigin(.5, .8).setScale(1.55).setDepth(1079);
    // Small dandelions, mushrooms, stones, and fallen logs are native pixel sprites.
    for (let i = 0; i < 70; i++) {
      const x = 160 + (i * 137) % 2260, y = 140 + (i * 197) % 1590;
      const color = [0xe9d477, 0xd89a83, 0xe9e3c5, 0x748c54][i % 4];
      const g = this.add.graphics(); g.fillStyle(color, i % 6 === 0 ? .8 : .54);
      const size = i % 7 === 0 ? 7 : 4; g.fillRect(x, y, size, size); g.fillRect(x + size, y + 2, 3, 2); g.setDepth(y + 1);
    }
    const decorationTexture: Record<string, string> = { flowers: 'flower-clump', crate: 'crate', bench: 'bench', fence: 'fence', hay: 'hay', rocks: 'rocks', stump: 'stump', log: 'log', sign: 'sign', well: 'well', bridge: 'bridge', scarecrow: 'scarecrow' };
    for (const item of mapDecorations) {
      const art = this.add.image(item.x, item.y, decorationTexture[item.type]).setOrigin(.5, .84).setScale(item.scale ?? 1).setDepth(item.y);
      if (item.rotation) art.setRotation(item.rotation);
    }
    // Interactive silhouettes are transparent tap targets; panels remain in the React shell.
    for (const item of worldObjects) {
      if (!item.interactive) continue;
      const hit = this.add.rectangle(item.x, item.y - 24, item.hitWidth ?? 130, item.hitHeight ?? 96, 0xffffff, 0.001);
      hit.setDepth(item.y + 10).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => { if (!this.moved) this.propsRef.current.onSelect(item.id); });
    }
    this.input.on('gameobjectover', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      (object as Phaser.GameObjects.Image).setTint?.(0xfff6db);
    });
    this.input.on('gameobjectout', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      (object as Phaser.GameObjects.Image).clearTint?.();
    });
    // Floating grain and sun motes keep the still scene gently alive.
    for (let i = 0; i < 12; i++) {
      const mote = this.add.rectangle(300 + i * 171, 230 + (i * 109) % 1200, 3, 3, 0xffe8a0, .58).setDepth(1200);
      this.tweens.add({ targets: mote, y: mote.y - 17 - (i % 4) * 5, alpha: .12, duration: 2600 + i * 160, yoyo: true, repeat: -1, delay: i * 170 });
    }
  }

  private createCritters() {
    const entries = this.propsRef.current.characters;
    entries.forEach((data, index) => {
      const isCow = data.kind === 'cow';
      const initialX = data.position?.x ?? 820 + index * 60;
      const initialY = data.position?.y ?? 765 + index * 25;
      let sprite: Phaser.GameObjects.Sprite;
      if (isCow) {
        sprite = this.add.sprite(initialX, initialY, 'cow-sprite').setScale(.095);
      } else {
        sprite = this.add.sprite(initialX, initialY, 'chickens', data.spriteFrame ?? (index % 2 ? 8 : 0)).setScale(data.scale ?? 2.55);
        sprite.play('chick-walk');
      }
      sprite.setOrigin(.5, .82).setDepth(initialY + 4).setInteractive({ useHandCursor: true });
      sprite.on('pointerup', () => { if (!this.moved) this.propsRef.current.onSelect(data.id); });
      const path = data.path?.length ? data.path : [[initialX + 30, initialY - 18], [initialX - 25, initialY - 5]];
      this.actors.push({ id: data.id, sprite, x: initialX, y: initialY, path: path.map(point => [point[0], point[1]]), state: data.state ?? 'walking', step: index % Math.max(1, path.length), nextAction: 0 });
    });
  }

  update(time: number, delta: number) {
    const camera = this.cameras.main;
    if (!this.dragging && Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > .08) {
      camera.scrollX += this.velocity.x * delta;
      camera.scrollY += this.velocity.y * delta;
      this.velocity.x *= .92; this.velocity.y *= .92;
    }
    this.actors.forEach(actor => {
      const { sprite } = actor;
      const isWorking = this.propsRef.current.workingCharacter === actor.id;
      if (actor.state === 'sleeping' && !isWorking && sprite.texture.key === 'chickens') {
        if (sprite.anims.currentAnim?.key !== 'chick-sleep') sprite.play('chick-sleep');
        return;
      }
      const taskTarget = isWorking && this.propsRef.current.workingTask ? this.taskPoint(this.propsRef.current.workingTask) : null;
      if (taskTarget) actor.path = [taskTarget, taskTarget];
      else {
        const source = this.propsRef.current.characters.find(character => character.id === actor.id);
        if (source?.path?.length && actor.path !== source.path) actor.path = source.path;
      }
      const target = actor.path[actor.step % actor.path.length];
      const dx = target[0] - actor.x, dy = target[1] - actor.y, distance = Math.hypot(dx, dy);
      if (distance > 4) {
        const speed = isWorking ? 43 : 24;
        const move = Math.min(distance, speed * delta / 1000);
        actor.x += dx / distance * move; actor.y += dy / distance * move;
        sprite.setPosition(actor.x, actor.y).setDepth(actor.y + 4);
        if (sprite.texture.key === 'chickens' && sprite.anims.currentAnim?.key !== 'chick-walk') sprite.play('chick-walk');
        if (dx < -2) sprite.setFlipX(true); else if (dx > 2) sprite.setFlipX(false);
      } else {
        if (taskTarget && isWorking) {
          if (sprite.texture.key === 'chickens' && time > actor.nextAction) { sprite.play('chick-peck'); actor.nextAction = time + 1500; }
          sprite.setY(actor.y + Math.sin(time / 180) * .7);
        } else {
          if (time > actor.nextAction) {
            actor.step = (actor.step + 1) % actor.path.length;
            actor.nextAction = time + 2300 + (actor.step % 3) * 950;
            if (sprite.texture.key === 'chickens') sprite.play(actor.step % 5 === 0 ? 'chick-sleep' : 'chick-walk');
          }
          sprite.setPosition(actor.x, actor.y).setDepth(actor.y + 4);
        }
      }
    });
  }

  private taskPoint(task: string): [number, number] {
    if (task === 'water-crops') return [1680, 945];
    if (task === 'feed-cows' || task === 'collect-milk') return [1820, 825];
    return [990, 745];
  }
}

export default function Scene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const propsRef = useRef(props);
  const [ready, setReady] = useState(false);
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const farm = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#849d4b',
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: [new FarmScene(propsRef, () => setReady(true))],
      render: { pixelArt: true, antialias: false, roundPixels: true, transparent: false },
    });
    game.current = farm;
    return () => { farm.destroy(true); game.current = null; };
  }, []);
  return <div className="farm-world" ref={host} role="application" aria-label="Granja Pollito pixel art explorable">
    <div className={`world-loading ${ready ? 'loaded' : ''}`} aria-live="polite"><span>🐥</span><small>Preparando Granja Pollito…</small></div>
  </div>;
}
