<script>
  import { onMount, onDestroy } from 'svelte';
  import * as PIXI from 'pixi.js';
  import { MAP_W, MAP_H, FIXED_TILE_SIZE, displayTileSize, tilesetBitmap, tilesPerRow, tileRows, layers, showGrid, backgroundColor, currentBrush, currentLayer, setCell } from '../stores/state.js';
  import { get } from 'svelte/store';

  let containerEl;
  let app;
  let gridGraphics;
  let layerSprites = [];
  let tilesetTexture = null;

  function rebuildGrid() {
    if (!gridGraphics) return;
    gridGraphics.clear();
    const cell = get(displayTileSize);
    const w = MAP_W * cell;
    const h = MAP_H * cell;
    gridGraphics.lineStyle(1, 0x222222, 1);
    for (let x = 0; x <= MAP_W; x++) {
      gridGraphics.moveTo(x * cell, 0);
      gridGraphics.lineTo(x * cell, h);
    }
    for (let y = 0; y <= MAP_H; y++) {
      gridGraphics.moveTo(0, y * cell);
      gridGraphics.lineTo(w, y * cell);
    }
  }

  function resizeRenderer() {
    const cell = get(displayTileSize);
    const w = MAP_W * cell;
    const h = MAP_H * cell;
    app.renderer.resize(w, h);
    rebuildGrid();
  }

  function updateTilesForLayer(li) {
    const cell = get(displayTileSize);
    const tpr = get(tilesPerRow);
    const bmp = get(tilesetBitmap);
    const layerData = get(layers)[li];
    if (!layerSprites[li]) {
      layerSprites[li] = new PIXI.Container();
      app.stage.addChild(layerSprites[li]);
    }
    const container = layerSprites[li];
    container.removeChildren();
    if (!bmp || !tilesetTexture || tpr === 0) return;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const idx = layerData[y * MAP_W + x];
        if (idx >= 0) {
          const sx = (idx % tpr) * FIXED_TILE_SIZE;
          const sy = Math.floor(idx / tpr) * FIXED_TILE_SIZE;
          const frame = new PIXI.Rectangle(sx, sy, FIXED_TILE_SIZE, FIXED_TILE_SIZE);
          // Ensure frame fits within texture bounds
          if (sx + FIXED_TILE_SIZE <= bmp.width && sy + FIXED_TILE_SIZE <= bmp.height) {
            const tex = new PIXI.Texture(tilesetTexture.baseTexture, frame);
            tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            const spr = new PIXI.Sprite(tex);
            spr.x = x * cell;
            spr.y = y * cell;
            spr.scale.set(cell / FIXED_TILE_SIZE);
            container.addChild(spr);
          }
        }
      }
    }
  }

  function redrawAllLayers() {
    for (let li = 0; li < layerSprites.length; li++) updateTilesForLayer(li);
  }

  function handlePointer(e) {
    const cell = get(displayTileSize);
    const rect = app.view.getBoundingClientRect();
    const cx = Math.floor((e.clientX - rect.left) / cell);
    const cy = Math.floor((e.clientY - rect.top) / cell);
    if (cx < 0 || cy < 0 || cx >= MAP_W || cy >= MAP_H) return;
    const brush = get(currentBrush);
    const isErase = brush === -1;
    setCell(cx, cy, isErase ? -1 : brush);
    updateTilesForLayer(get(currentLayer));
  }

  let painting = false;
  function onDown(e) { painting = true; handlePointer(e); }
  function onMove(e) { if (!painting) return; handlePointer(e); }
  function onUp() { painting = false; }

  let unsubscribers = [];

  onMount(() => {
  app = new PIXI.Application({ background: 0x000000, antialias: false, resolution: 1 });
      containerEl.innerHTML = '';
      containerEl.appendChild(app.view);

      // BG color layer as a Graphics rect
      const bg = new PIXI.Graphics();
      app.stage.addChild(bg);

      gridGraphics = new PIXI.Graphics();
      app.stage.addChild(gridGraphics);

      // Ensure containers for each layer
      for (let i = 0; i < 2; i++) {
        layerSprites[i] = new PIXI.Container();
        app.stage.addChild(layerSprites[i]);
      }

      // React to store changes
      unsubscribers.push(backgroundColor.subscribe((hex) => {
        const cell = get(displayTileSize);
        const w = MAP_W * cell; const h = MAP_H * cell;
        const color = parseInt(hex.replace('#','0x'));
        bg.clear();
        bg.beginFill(color);
        bg.drawRect(0, 0, w, h);
        bg.endFill();
      }));
      unsubscribers.push(displayTileSize.subscribe(() => { resizeRenderer(); redrawAllLayers(); }));
      unsubscribers.push(layers.subscribe(() => redrawAllLayers()));
      unsubscribers.push(tilesetBitmap.subscribe((bmp) => {
        if (bmp) {
          tilesetTexture = PIXI.Texture.from(bmp);
          tilesetTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        } else {
          tilesetTexture = null;
        }
        redrawAllLayers();
      }));
      unsubscribers.push(showGrid.subscribe((v) => { gridGraphics.visible = v; }));

      resizeRenderer();

      // Pointer events on canvas element
      app.view.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      app.view.addEventListener('touchstart', (e)=>{ e.preventDefault(); onDown(e.touches[0]); });
      app.view.addEventListener('touchmove', (e)=>{ e.preventDefault(); onMove(e.touches[0]); });
      app.view.addEventListener('touchend', (e)=>{ e.preventDefault(); onUp(); });

      // Make app available globally for export
      window.pixiApp = app;
  });

  onDestroy(() => {
    try {
      app?.view?.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    } catch {}
    unsubscribers.forEach(u => u());
    if (app) app.destroy(true);
  });
</script>

<div id="mapCanvas" bind:this={containerEl} style="border:1px solid #333; background:#000; display:block;" />
