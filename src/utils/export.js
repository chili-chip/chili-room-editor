import { get } from 'svelte/store';
import { buildProjectJSON, buildCArrayString, pngExportSize, backgroundColor, layers, tilesetBitmap, tilesPerRow } from '../stores/state.js';
import * as PIXI from 'pixi.js';

export function exportJSON() {
  try {
    const data = buildProjectJSON();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'room_project.json';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch { alert('Failed to export JSON'); }
}

export async function exportPNG() {
  const app = window.pixiApp;
  if (!app) { alert('Pixi app not found'); return; }
  const size = get(pngExportSize);
  const cell = size / 16; // since MAP_W=16
  try {
    // Create a temporary renderer for export
    // Pixi v8: the Application is created empty and initialised asynchronously.
    const tempApp = new PIXI.Application();
    await tempApp.init({ width: size, height: size, background: 0x000000, antialias: false, resolution: 1 });
    // Copy the stage content, but scaled
    const tempStage = new PIXI.Container();
    tempApp.stage.addChild(tempStage);

    // Draw background
    const bg = new PIXI.Graphics();
    const bgColor = get(backgroundColor);
    const color = parseInt(bgColor.replace('#','0x'));
    bg.rect(0, 0, size, size).fill(color);
    tempStage.addChild(bg);

    // Draw tiles
    const layersData = get(layers);
    const bmp = get(tilesetBitmap);
    const tpr = get(tilesPerRow);
    if (bmp && tpr > 0) {
      const tex = PIXI.Texture.from(bmp);
      tex.source.scaleMode = 'nearest';
      for (let li = 0; li < layersData.length; li++) {
        const layerData = layersData[li];
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const idx = layerData[y * 16 + x];
            if (idx >= 0) {
              const sx = (idx % tpr) * 8;
              const sy = Math.floor(idx / tpr) * 8;
              const frame = new PIXI.Rectangle(sx, sy, 8, 8);
              if (sx + 8 <= bmp.width && sy + 8 <= bmp.height) {
                const tileTex = new PIXI.Texture({ source: tex.source, frame });
                const spr = new PIXI.Sprite(tileTex);
                spr.x = x * cell;
                spr.y = y * cell;
                spr.scale.set(cell / 8);
                tempStage.addChild(spr);
              }
            }
          }
        }
      }
    }

    tempApp.renderer.render(tempApp.stage);
    const canvas = tempApp.renderer.extract.canvas(tempApp.stage);
    canvas.toBlob((blob) => {
      if (!blob) { alert('Failed to generate PNG'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `room_map_${size}x${size}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      tempApp.destroy(true);
    }, 'image/png');
  } catch (e) {
    alert('Export failed: ' + e.message);
  }
}

export function exportHeader() {
  const { out, name } = buildCArrayString();
  const blob = new Blob([out + '\n'], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '.h';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportCArray() {
  const { out } = buildCArrayString();
  navigator.clipboard.writeText(out).then(() => alert('C array copied to clipboard')).catch(() => alert('Clipboard blocked'));
}