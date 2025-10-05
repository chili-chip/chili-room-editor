<script>
  import { backgroundColor, tilesetBitmap, tilesPerRow, FIXED_TILE_SIZE, MAP_W, MAP_H } from '../stores/state.js';
  import { createEventDispatcher } from 'svelte';

  export let layer = [];
  export let layers = null; // for combined
  export let width = 128;
  export let height = 128;

  const dispatch = createEventDispatcher();

  let canvas;

  function drawPreview() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const size = width;
    const cell = size / MAP_W;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = $backgroundColor;
    ctx.fillRect(0, 0, size, size);
    if (!$tilesetBitmap || $tilesPerRow === 0) return;
    const tpr = $tilesPerRow;
    // temp source
    const src = document.createElement('canvas');
    src.width = $tilesetBitmap.width;
    src.height = $tilesetBitmap.height;
    src.getContext('2d').drawImage($tilesetBitmap, 0, 0);
    const layersToDraw = layers || [layer];
    for (let l = 0; l < layersToDraw.length; l++) {
      const layerData = layersToDraw[l];
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const idx = layerData[y * MAP_W + x];
          if (idx >= 0) {
            const sx = (idx % tpr) * FIXED_TILE_SIZE;
            const sy = Math.floor(idx / tpr) * FIXED_TILE_SIZE;
            if (sx + FIXED_TILE_SIZE <= $tilesetBitmap.width && sy + FIXED_TILE_SIZE <= $tilesetBitmap.height) {
              ctx.drawImage(src, sx, sy, FIXED_TILE_SIZE, FIXED_TILE_SIZE, x * cell, y * cell, cell, cell);
            }
          }
        }
      }
    }
  }

  $: if (layer || layers || $backgroundColor || $tilesetBitmap) drawPreview();
</script>

<canvas bind:this={canvas} {width} {height} on:click={() => dispatch('click')}></canvas>