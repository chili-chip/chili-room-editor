// Chili Room Editor - initial scaffold
// Features to implement progressively:
// 1. Tileset upload & storage
// 2. Tile slicing by selectable tile size
// 3. Tile palette & brush selection
// 4. 16x16 map editing (tile indices)
// 5. Persistence in localStorage
// 6. Export to C array

const STORAGE_KEYS = {
  tilesetImage: 'chili_tileset_image',
  tilesetTileSize: 'chili_tileset_tile_size',
  mapData: 'chili_map_data'
};

// State
let tilesetImg = null; // HTMLImageElement
let tileSize = 16;
let tilesPerRow = 0; // horizontal tiles count
let tileRows = 0;    // vertical tiles count (for variable height)
let paletteButtons = [];
let selectedTileIndex = -1;
let eraseMode = false;
const MAP_W = 16;
const MAP_H = 16;
let mapData = new Array(MAP_W * MAP_H).fill(-1); // -1 means empty
// Fixed display scale (smaller to reduce blurriness when scaling source tiles)
let displayTileSize = 32; // map tile display size in pixels (integer multiple of base tile logical size)
let paletteTileSize = 32; // palette tile button size

// Elements
const tilesetFileInput = document.getElementById('tilesetFile');
const tileSizeSelect = document.getElementById('tileSize');
const reSliceBtn = document.getElementById('reSliceBtn');
const paletteDiv = document.getElementById('palette');
const tilesetPreview = document.getElementById('tilesetPreview');
const currentBrushSpan = document.getElementById('currentBrush');
const eraseModeBtn = document.getElementById('eraseModeBtn');
const clearMapBtn = document.getElementById('clearMapBtn');
const mapCanvas = document.getElementById('mapCanvas');
const exportBtn = document.getElementById('exportBtn');
const downloadHeaderBtn = document.getElementById('downloadHeaderBtn');
const copyExportBtn = document.getElementById('copyExportBtn');
const clearTilesetBtn = document.getElementById('clearTilesetBtn');
// (Removed scale selector)

const tilesetCtx = tilesetPreview.getContext('2d');
const mapCtx = mapCanvas.getContext('2d');

function saveState() {
  if (tilesetImg && tilesetImg.dataset.src) {
    localStorage.setItem(STORAGE_KEYS.tilesetImage, tilesetImg.dataset.src);
  }
  localStorage.setItem(STORAGE_KEYS.tilesetTileSize, String(tileSize));
  localStorage.setItem(STORAGE_KEYS.mapData, JSON.stringify(mapData));
}

function loadState() {
  const imgData = localStorage.getItem(STORAGE_KEYS.tilesetImage);
  const ts = parseInt(localStorage.getItem(STORAGE_KEYS.tilesetTileSize) || '16', 10);
  const mapStr = localStorage.getItem(STORAGE_KEYS.mapData);
  if (imgData) {
    loadTilesetFromDataURL(imgData);
  }
  if ([8,16,32].includes(ts)) {
    tileSize = ts;
    tileSizeSelect.value = String(ts);
  }
  if (mapStr) {
    try { const arr = JSON.parse(mapStr); if (Array.isArray(arr) && arr.length === MAP_W*MAP_H) mapData = arr; } catch(e){}
  }
  renderMap();
}

function loadTilesetFromDataURL(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width !== 128 || img.height > 128) {
        alert('Tileset width must be 128 and height <= 128.');
        reject(new Error('Invalid size'));
        return;
      }
      tilesetImg = img;
      tilesetImg.dataset.src = dataURL; // persist original
      tilesetPreview.hidden = false;
      tilesetPreview.width = 128; tilesetPreview.height = img.height;
      tilesetCtx.clearRect(0,0,128,img.height);
      tilesetCtx.drawImage(img,0,0);
      slicePalette();
      saveState();
      resolve();
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

async function handleTilesetFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== 'image/png') { alert('Please select a PNG file'); return; }
  const dataURL = await fileToDataURL(file);
  await loadTilesetFromDataURL(dataURL);
}

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function slicePalette() {
  if (!tilesetImg) return;
  const size = tileSize;
  if (128 % size !== 0) { alert('Tile size must divide 128'); return; }
  tilesPerRow = 128 / size;
  tileRows = Math.floor(tilesetImg.height / size);
  paletteDiv.innerHTML = '';
  paletteButtons = [];
  paletteDiv.style.setProperty('--tile', paletteTileSize + 'px');

  // offscreen canvas
  const off = document.createElement('canvas');
  off.width = paletteTileSize; off.height = paletteTileSize;
  const offCtx = off.getContext('2d');
  offCtx.imageSmoothingEnabled = false;

  const total = tilesPerRow * tileRows;
  for (let i=0;i<total;i++) {
    const sx = (i % tilesPerRow) * size;
    const sy = Math.floor(i / tilesPerRow) * size;
  offCtx.clearRect(0,0,paletteTileSize,paletteTileSize);
  offCtx.drawImage(tilesetImg, sx, sy, size, size, 0,0,paletteTileSize,paletteTileSize);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.style.backgroundImage = `url(${off.toDataURL()})`;
  btn.style.backgroundSize = paletteTileSize + 'px ' + paletteTileSize + 'px';
    btn.addEventListener('click', () => selectTile(i, btn));
    paletteDiv.appendChild(btn);
    paletteButtons.push(btn);
  }
  // Clamp map data if necessary
  for (let i=0;i<mapData.length;i++) {
    if (mapData[i] >= total) mapData[i] = -1;
  }
  // Reselect if possible
  if (selectedTileIndex >= 0 && selectedTileIndex < total) {
    const btn = paletteButtons[selectedTileIndex];
    if (btn) btn.classList.add('selected');
  } else {
    selectedTileIndex = -1;
    currentBrushSpan.textContent = '(none)';
  }
}

function selectTile(index, btn) {
  selectedTileIndex = index;
  paletteButtons.forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  currentBrushSpan.textContent = '#' + index;
}

function toggleEraseMode() {
  eraseMode = !eraseMode;
  eraseModeBtn.textContent = 'Erase: ' + (eraseMode ? 'On' : 'Off');
}

function clearMap() {
  if (!confirm('Clear map?')) return;
  mapData.fill(-1);
  renderMap();
  saveState();
}

function clearTileset() {
  if (!confirm('Remove stored tileset? This also clears palette and brush.')) return;
  tilesetImg = null;
  localStorage.removeItem(STORAGE_KEYS.tilesetImage);
  paletteDiv.innerHTML = '';
  selectedTileIndex = -1;
  currentBrushSpan.textContent = '(none)';
  tilesetPreview.hidden = true;
}

function renderMap() {
  // Enforce integer multiple to avoid fractional scaling blur
  if (displayTileSize % tileSize !== 0) {
    const mult = Math.max(1, Math.round(displayTileSize / tileSize));
    displayTileSize = tileSize * mult;
  }
  const dpr = window.devicePixelRatio || 1;
  // We only upscale backing store if DPR is integer to keep pixel grid intact
  const backingScale = Number.isInteger(dpr) ? dpr : 1;
  const cellScreen = displayTileSize;
  const cssWidth = MAP_W * cellScreen;
  const cssHeight = MAP_H * cellScreen;
  mapCanvas.style.width = cssWidth + 'px';
  mapCanvas.style.height = cssHeight + 'px';
  mapCanvas.width = cssWidth * backingScale;
  mapCanvas.height = cssHeight * backingScale;

  mapCtx.imageSmoothingEnabled = false;
  mapCtx.setTransform(backingScale,0,0,backingScale,0,0);
  mapCtx.clearRect(0,0,cssWidth,cssHeight);

  for (let y=0;y<MAP_H;y++) {
    for (let x=0;x<MAP_W;x++) {
      const idx = mapData[y*MAP_W + x];
      if (idx >= 0 && tilesetImg) {
        const sx = (idx % tilesPerRow) * tileSize;
        const sy = Math.floor(idx / tilesPerRow) * tileSize;
        mapCtx.drawImage(tilesetImg, sx, sy, tileSize, tileSize, x*cellScreen, y*cellScreen, cellScreen, cellScreen);
      } else {
        mapCtx.fillStyle = (x+y)%2===0 ? '#111' : '#161616';
        mapCtx.fillRect(x*cellScreen, y*cellScreen, cellScreen, cellScreen);
      }
    }
  }
  // Draw grid after tiles to avoid blending
  mapCtx.strokeStyle = '#222';
  for (let x=0; x<=MAP_W; x++) {
    mapCtx.beginPath();
    mapCtx.moveTo(x*cellScreen+0.5, 0); // 0.5 to align to pixel boundary at scale 1
    mapCtx.lineTo(x*cellScreen+0.5, cssHeight);
    mapCtx.stroke();
  }
  for (let y=0; y<=MAP_H; y++) {
    mapCtx.beginPath();
    mapCtx.moveTo(0, y*cellScreen+0.5);
    mapCtx.lineTo(cssWidth, y*cellScreen+0.5);
    mapCtx.stroke();
  }
}

function canvasPosToCell(e) {
  const rect = mapCanvas.getBoundingClientRect();
  const cssWidth = rect.width; // since style width = logical width
  const cssHeight = rect.height;
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  const cellScreen = displayTileSize; // updated size
  const cellX = Math.floor(x / cellScreen);
  const cellY = Math.floor(y / cellScreen);
  if (cellX < 0 || cellY < 0 || cellX >= MAP_W || cellY >= MAP_H) return null;
  return {x:cellX,y:cellY};
}

let painting = false;
function handlePointerDown(e) {
  const cell = canvasPosToCell(e);
  if (!cell) return;
  painting = true;
  paintCell(cell.x, cell.y);
}
function handlePointerMove(e) {
  if (!painting) return;
  const cell = canvasPosToCell(e);
  if (!cell) return;
  paintCell(cell.x, cell.y);
}
function handlePointerUp() { painting = false; }

function paintCell(x,y) {
  const idx = y*MAP_W + x;
  const newVal = eraseMode ? -1 : selectedTileIndex;
  if (newVal === undefined || newVal === null) return;
  if (!eraseMode && newVal < 0) return; // can't paint if no brush
  if (mapData[idx] === newVal) return;
  mapData[idx] = newVal;
  renderMap();
  saveState();
}

function buildCArrayString() {
  const name = 'roomMap';
  const lines = [];
  lines.push('// Generated by Chili Room Editor');
  lines.push(`#define ROOM_W ${MAP_W}`);
  lines.push(`#define ROOM_H ${MAP_H}`);
  lines.push(`static const int ${name}[ROOM_W*ROOM_H] = {`);
  for (let y=0;y<MAP_H;y++) {
    const row = [];
    for (let x=0;x<MAP_W;x++) {
      row.push(mapData[y*MAP_W + x]);
    }
    lines.push('  ' + row.join(', ') + (y < MAP_H-1 ? ',' : ''));
  }
  lines.push('};');
  const out = lines.join('\n');
  return {out, name};
}

function downloadHeader() {
  const { out, name } = buildCArrayString();
  const blob = new Blob([out+'\n'], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '.h';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Event wiring
tilesetFileInput.addEventListener('change', handleTilesetFileChange);
reSliceBtn.addEventListener('click', () => { tileSize = parseInt(tileSizeSelect.value,10); slicePalette(); saveState(); });
tileSizeSelect.addEventListener('change', () => { tileSize = parseInt(tileSizeSelect.value,10); slicePalette(); saveState(); });
eraseModeBtn.addEventListener('click', toggleEraseMode);
clearMapBtn.addEventListener('click', clearMap);
if (exportBtn) exportBtn.addEventListener('click', () => {
  const { out } = buildCArrayString();
  alert(out);
});
if (downloadHeaderBtn) downloadHeaderBtn.addEventListener('click', downloadHeader);
if (copyExportBtn) copyExportBtn.addEventListener('click', () => {
  const { out } = buildCArrayString();
  navigator.clipboard.writeText(out).then(()=>{
    copyExportBtn.textContent = 'Copied!';
    setTimeout(()=> copyExportBtn.textContent = 'Copy', 1200);
  }).catch(()=> alert('Clipboard blocked'));
});
clearTilesetBtn.addEventListener('click', clearTileset);
// (Removed display scale change handler)

mapCanvas.addEventListener('mousedown', handlePointerDown);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);
// Touch support
mapCanvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); handlePointerDown(e.touches[0]); });
mapCanvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); handlePointerMove(e.touches[0]); });
mapCanvas.addEventListener('touchend', (e)=>{ e.preventDefault(); handlePointerUp(); });

loadState();
renderMap();

console.log('Chili Room Editor loaded');
