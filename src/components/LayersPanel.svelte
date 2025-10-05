<script>
  import { layers, currentLayer, backgroundColor, tilesetBitmap, tilesPerRow, FIXED_TILE_SIZE, MAP_W, MAP_H, clearCurrentLayer } from '../stores/state.js';
  import { onMount, tick } from 'svelte';

  let canvasRefs = [];
  let combined;

  function drawPreview(cv, layerIndex) {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const size = cv.width; const cell = size / MAP_W;
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle = $backgroundColor;
    ctx.fillRect(0,0,size,size);
    if (!$tilesetBitmap || $tilesPerRow === 0) return;
    const layer = $layers[layerIndex];
    const tpr = $tilesPerRow;
    // temp source
    const src = document.createElement('canvas');
    src.width = $tilesetBitmap.width; src.height = $tilesetBitmap.height;
    src.getContext('2d').drawImage($tilesetBitmap, 0, 0);
    for (let y=0;y<MAP_H;y++) {
      for (let x=0;x<MAP_W;x++) {
        const idx = layer[y*MAP_W + x];
        if (idx >= 0) {
          const sx = (idx % tpr) * FIXED_TILE_SIZE;
          const sy = Math.floor(idx / tpr) * FIXED_TILE_SIZE;
          if (sx + FIXED_TILE_SIZE <= $tilesetBitmap.width && sy + FIXED_TILE_SIZE <= $tilesetBitmap.height) {
            ctx.drawImage(src, sx, sy, FIXED_TILE_SIZE, FIXED_TILE_SIZE, x*cell, y*cell, cell, cell);
          }
        }
      }
    }
  }

  function drawCombined() {
    if (!combined) return;
    const ctx = combined.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const size = combined.width; const cell = size / MAP_W;
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle = $backgroundColor;
    ctx.fillRect(0,0,size,size);
    if (!$tilesetBitmap || $tilesPerRow === 0) return;
    const tpr = $tilesPerRow;
    const src = document.createElement('canvas');
    src.width = $tilesetBitmap.width; src.height = $tilesetBitmap.height;
    src.getContext('2d').drawImage($tilesetBitmap, 0, 0);
    for (let l=0;l<$layers.length;l++) {
      const layer = $layers[l];
      for (let y=0;y<MAP_H;y++) {
        for (let x=0;x<MAP_W;x++) {
          const idx = layer[y*MAP_W + x];
          if (idx >= 0) {
            const sx = (idx % tpr) * FIXED_TILE_SIZE;
            const sy = Math.floor(idx / tpr) * FIXED_TILE_SIZE;
            if (sx + FIXED_TILE_SIZE <= $tilesetBitmap.width && sy + FIXED_TILE_SIZE <= $tilesetBitmap.height) {
              ctx.drawImage(src, sx, sy, FIXED_TILE_SIZE, FIXED_TILE_SIZE, x*cell, y*cell, cell, cell);
            }
          }
        }
      }
    }
  }

  $: { // redraw previews on reactive changes
    for (let i = 0; i < $layers.length; i++) {
      if (canvasRefs[i]) drawPreview(canvasRefs[i], i);
    }
    drawCombined();
  }

  onMount(async () => {
    await tick();
    for (let i = 0; i < $layers.length; i++) {
      if (canvasRefs[i]) drawPreview(canvasRefs[i], i);
    }
    drawCombined();
  });
</script>

<div class="layers-list">
  {#each $layers as _, i}
    <button type="button" class="layer-select { $currentLayer === i ? 'selected' : '' }" on:click={() => currentLayer.set(i)}>
      <span>Layer {i}</span>
      <canvas bind:this={canvasRefs[i]} class="layerPreview" width="128" height="128" aria-label={`Layer ${i} preview`}></canvas>
    </button>
  {/each}
  <button class="secondary" on:click={() => { if (confirm('Clear current layer?')) clearCurrentLayer(); }}>Clear Current Layer</button>
</div>

<div class="combined-wrapper">
  <span class="combined-label">Combined</span>
  <canvas bind:this={combined} id="combinedPreview" width="128" height="128" aria-label="Combined layers preview"></canvas>
</div>
