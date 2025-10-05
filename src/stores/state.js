import { writable, derived, get } from 'svelte/store';

export const STORAGE_KEYS = {
  tilesetImage: 'chili_tileset_image',
  mapLayers: 'chili_map_layers',
  bgColor: 'chili_map_bg_color',
  gridVisible: 'chili_show_grid'
};

export const FIXED_TILE_SIZE = 8;
export const MAP_W = 16;
export const MAP_H = 16;
export const LAYER_COUNT = 2;

export const tilesetImage = writable(null); // dataURL string | null
export const tilesetBitmap = writable(null); // ImageBitmap | null
export const tilesPerRow = writable(0);
export const tileRows = writable(0);

export const layers = writable(Array.from({ length: LAYER_COUNT }, () => new Array(MAP_W * MAP_H).fill(-1)));
export const currentLayer = writable(0);
export const currentBrush = writable(-1); // -1 is erase
export const backgroundColor = writable('#111111');
export const showGrid = writable(true);

export const displayTileSize = writable(32); // screen pixels per cell
export const pngExportSize = writable(512);

export function sliceInfoFromBitmap(bitmap) {
  if (!bitmap) return { tpr: 0, rows: 0 };
  const size = FIXED_TILE_SIZE;
  if (bitmap.width !== 128) return { tpr: 0, rows: 0 };
  return { tpr: 128 / size, rows: Math.floor(bitmap.height / size) };
}

export function initFromStorage() {
  try {
    const img = localStorage.getItem(STORAGE_KEYS.tilesetImage);
    const lsLayers = localStorage.getItem(STORAGE_KEYS.mapLayers);
    const bg = localStorage.getItem(STORAGE_KEYS.bgColor);
    const gv = localStorage.getItem(STORAGE_KEYS.gridVisible);
    if (gv !== null) showGrid.set(gv === '1');
    if (bg && /^#?[0-9a-fA-F]{6}$/.test(bg)) backgroundColor.set(bg.startsWith('#') ? bg : ('#' + bg));
    if (lsLayers) {
      const parsed = JSON.parse(lsLayers);
      if (Array.isArray(parsed) && parsed.length === LAYER_COUNT) layers.set(parsed);
    }
    if (img) {
      tilesetImage.set(img);
      createImageBitmapFromDataURL(img).then((bmp) => {
        tilesetBitmap.set(bmp);
        const { tpr, rows } = sliceInfoFromBitmap(bmp);
        tilesPerRow.set(tpr); tileRows.set(rows);
      }).catch(()=>{});
    }
  } catch {}
}

export function persist() {
  const img = get(tilesetImage);
  const ls = get(layers);
  const bg = get(backgroundColor);
  const gv = get(showGrid);
  if (img) localStorage.setItem(STORAGE_KEYS.tilesetImage, img);
  localStorage.setItem(STORAGE_KEYS.mapLayers, JSON.stringify(ls));
  localStorage.setItem(STORAGE_KEYS.bgColor, bg);
  localStorage.setItem(STORAGE_KEYS.gridVisible, gv ? '1' : '0');
}

export async function createImageBitmapFromDataURL(dataURL) {
  const res = await fetch(dataURL);
  const blob = await res.blob();
  return await createImageBitmap(blob, { imageOrientation: 'from-image', premultiplyAlpha: 'default' });
}

export async function setTilesetFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataURL = reader.result;
      tilesetImage.set(dataURL);
      try {
        const bmp = await createImageBitmapFromDataURL(dataURL);
        if (bmp.width !== 128 || bmp.height > 128) {
          reject(new Error('Tileset width must be 128 and height <= 128.'));
          return;
        }
        tilesetBitmap.set(bmp);
        const { tpr, rows } = sliceInfoFromBitmap(bmp);
        tilesPerRow.set(tpr); tileRows.set(rows);
        // Clamp existing map indices to valid range
        const maxTiles = tpr * rows;
        layers.update(ls => ls.map(l => l.map(idx => idx >= 0 && idx < maxTiles ? idx : -1)));
        persist();
        resolve();
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function clearTileset() {
  tilesetImage.set(null);
  tilesetBitmap.set(null);
  tilesPerRow.set(0);
  tileRows.set(0);
  localStorage.removeItem(STORAGE_KEYS.tilesetImage);
}

export function clearCurrentLayer() {
  layers.update(arr => {
    const idx = get(currentLayer);
    arr[idx] = new Array(MAP_W * MAP_H).fill(-1);
    return [...arr];
  });
  persist();
}

export const paletteTileSize = writable(32);

export function setCell(x, y, value) {
  const idx = y * MAP_W + x;
  layers.update(arr => {
    const l = get(currentLayer);
    const copy = arr.map(a => a.slice());
    copy[l][idx] = value;
    return copy;
  });
  persist();
}

export function buildProjectJSON() {
  const maxTiles = get(tilesPerRow) * get(tileRows);
  return {
    version: 1,
    mapWidth: MAP_W,
    mapHeight: MAP_H,
    layers: get(layers).map(l => {
      const grid = [];
      for (let y = 0; y < MAP_H; y++) {
        const row = [];
        for (let x = 0; x < MAP_W; x++) {
          const idx = l[y * MAP_W + x];
          row.push(idx >= 0 && idx < maxTiles ? idx : -1);
        }
        grid.push(row);
      }
      return grid;
    }),
    backgroundColor: get(backgroundColor),
    gridVisible: get(showGrid),
    tilesetDataURL: get(tilesetImage) || undefined
  };
}

export function rgbHexToIntLiteral(hex) {
  const h = hex.replace('#','');
  return '0x' + h.toUpperCase();
}

export function buildCArrayString() {
  const baseName = 'roomMap';
  const lines = [];
  lines.push('// Generated by Chili Room Editor');
  lines.push(`#define ROOM_W ${MAP_W}`);
  lines.push(`#define ROOM_H ${MAP_H}`);
  lines.push(`#define LAYER_COUNT ${LAYER_COUNT}`);
  lines.push(`#define ROOM_BG_COLOR ${rgbHexToIntLiteral(get(backgroundColor))}`);
  for (let l = 0; l < LAYER_COUNT; l++) {
    const name = `${baseName}_L${l}`;
    lines.push(`static const int ${name}[ROOM_W*ROOM_H] = {`);
    const layer = get(layers)[l];
    for (let y = 0; y < MAP_H; y++) {
      const row = [];
      for (let x = 0; x < MAP_W; x++) {
        const idx = layer[y * MAP_W + x];
        row.push(idx >= 0 && idx < maxTiles ? idx : -1);
      }
      lines.push('  ' + row.join(', ') + (y < MAP_H - 1 ? ',' : ''));
    }
    lines.push('};');
  }
  lines.push('\n// Access macro: layer 0 stored in roomMap_L0, layer 1 in roomMap_L1, etc.');
  const out = lines.join('\n');
  return { out, name: 'roomMap' };
}

export async function importFromJSON(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
  if (!Array.isArray(obj.layers)) throw new Error('Missing layers');
  if (obj.layers.length !== LAYER_COUNT) throw new Error('Layer count mismatch');
  for (let i = 0; i < LAYER_COUNT; i++) {
    let layerData = obj.layers[i];
    if (Array.isArray(layerData) && Array.isArray(layerData[0])) {
      // 2D array, flatten it
      layerData = layerData.flat();
    }
    if (!Array.isArray(layerData) || layerData.length !== MAP_W * MAP_H) {
      throw new Error(`Layer ${i} has invalid size`);
    }
    obj.layers[i] = layerData;
  }
  layers.set(obj.layers.map(l => l.slice()));
  if (typeof obj.backgroundColor === 'string' && /^#?[0-9a-fA-F]{6}$/.test(obj.backgroundColor)) {
    backgroundColor.set(obj.backgroundColor.startsWith('#') ? obj.backgroundColor : ('#' + obj.backgroundColor));
  }
  if (typeof obj.gridVisible === 'boolean') showGrid.set(obj.gridVisible);
  // Note: tileset is not loaded from JSON, using current tileset
  // if (typeof obj.tilesetDataURL === 'string' && obj.tilesetDataURL.startsWith('data:image/png')) {
  //   tilesetImage.set(obj.tilesetDataURL);
  //   try {
  //     const bmp = await createImageBitmapFromDataURL(obj.tilesetDataURL);
  //     tilesetBitmap.set(bmp);
  //     const { tpr, rows } = sliceInfoFromBitmap(bmp);
  //     tilesPerRow.set(tpr); tileRows.set(rows);
  //   } catch {}
  // }
  persist();
}
