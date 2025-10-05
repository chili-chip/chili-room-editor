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
    // Ensure the canvas element reflects the pixel size (avoid CSS scaling)
    if (app && app.view) {
      app.view.style.width = w + 'px';
      app.view.style.height = h + 'px';
      app.view.style.display = 'block';
    }
    // Size the container to the canvas pixel size so the outer wrapper
    // (the scrollable area) can scroll to view different parts of the map.
    if (containerEl) {
      containerEl.style.width = w + 'px';
      containerEl.style.height = h + 'px';
      // Helpful debug visual while diagnosing layout issues
      containerEl.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))';
      containerEl.style.minHeight = '100px';
      console.debug('[MapCanvas] container set to canvas size', { w, h });
    }
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
  let panning = false;
  let panLastX = 0;
  let panLastY = 0;
  function onDown(e) {
    // painting only when left button and not holding shift
    if (typeof e.button !== 'undefined' && e.button === 0 && !e.shiftKey) {
      painting = true;
      handlePointer(e);
      return;
    }
    // start panning when right button, or shift+left-button
    if ((typeof e.button !== 'undefined' && e.button === 2) || (e.button === 0 && e.shiftKey)) {
      panning = true;
      panLastX = e.clientX; panLastY = e.clientY;
      e.preventDefault();
      return;
    }
  }

  function onMove(e) {
    if (painting) return handlePointer(e);
    if (panning) {
      const dx = panLastX - e.clientX;
      const dy = panLastY - e.clientY;
      // scroll the nearest scrollable ancestor
      let p = containerEl.parentElement;
      while (p && p !== document.body) {
        const overflowY = window.getComputedStyle(p).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') break;
        p = p.parentElement;
      }
      const target = p || null;
      if (target) target.scrollBy(dx, dy);
      panLastX = e.clientX; panLastY = e.clientY;
    }
  }

  function onUp(e) { painting = false; panning = false; }

  let unsubscribers = [];

  onMount(() => {
  app = new PIXI.Application({ background: 0x000000, antialias: false, resolution: 1 });
    containerEl.innerHTML = '';
    containerEl.appendChild(app.view);
    // ensure container is positioned and the canvas participates in layout
    containerEl.style.position = 'relative';
    containerEl.style.overflow = 'visible';
    // ensure view has no CSS scaling and participates in layout (not absolute)
    app.view.style.display = 'block';
    app.view.style.position = 'relative';


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
      const mdown = (e) => onDown(e);
      const mmove = (e) => onMove(e);
      const mup = (e) => onUp(e);
      app.view.addEventListener('mousedown', mdown);
      window.addEventListener('mousemove', mmove);
      window.addEventListener('mouseup', mup);

      // Prevent context menu so right-drag can be used for panning
      const ctx = (e) => { e.preventDefault(); };
      app.view.addEventListener('contextmenu', ctx);

      // Touch support: single-finger paint, two-finger pan
      let touchPan = false;
      let touchLastX = 0, touchLastY = 0;
      const tstart = (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          painting = true; handlePointer(t);
        } else if (e.touches.length === 2) {
          touchPan = true;
          touchLastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          touchLastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
      };
      const tmove = (e) => {
        if (painting && e.touches.length >= 1) { handlePointer(e.touches[0]); }
        if (touchPan && e.touches.length >= 2) {
          const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const dx = touchLastX - cx; const dy = touchLastY - cy;
          let p = containerEl.parentElement;
          while (p && p !== document.body) {
            const overflowY = window.getComputedStyle(p).overflowY;
            if (overflowY === 'auto' || overflowY === 'scroll') break;
            p = p.parentElement;
          }
          const target = p || null;
          if (target) target.scrollBy(dx, dy);
          touchLastX = cx; touchLastY = cy;
        }
        e.preventDefault();
      };
      const tend = (e) => { painting = false; touchPan = false; };
      app.view.addEventListener('touchstart', tstart, { passive: false });
      app.view.addEventListener('touchmove', tmove, { passive: false });
      app.view.addEventListener('touchend', tend);

      // Keep container sized when window resizes
      const onWinResize = () => resizeRenderer();
      window.addEventListener('resize', onWinResize);

      // Make app available globally for export
      window.pixiApp = app;
  });

  onDestroy(() => {
    try {
  app?.view?.removeEventListener('mousedown', mdown);
  window.removeEventListener('mousemove', mmove);
  window.removeEventListener('mouseup', mup);
  app?.view?.removeEventListener('contextmenu', ctx);
  app?.view?.removeEventListener('touchstart', tstart);
  app?.view?.removeEventListener('touchmove', tmove);
  app?.view?.removeEventListener('touchend', tend);
  window.removeEventListener('resize', onWinResize);
    } catch (err) { /* ignore */ }
    unsubscribers.forEach(u => u());
    if (app) app.destroy(true);
  });
</script>

<div class="w-100" style="position:relative; height:600px;">
  <div id="mapCanvas" bind:this={containerEl} style="display:block; width:100%; height:100%; overflow:hidden; position:relative;"></div>
</div>