<script>
  import { tilesetBitmap, tilesPerRow, tileRows, FIXED_TILE_SIZE, paletteTileSize, currentBrush } from '../stores/state.js';
  let buttons = [];

  function pick(i) {
    currentBrush.set(i);
  }

  function tileDataURL(i) {
    if (!$tilesetBitmap) return '';
    const tpr = $tilesPerRow;
    const size = FIXED_TILE_SIZE;
    const sx = (i % tpr) * size;
    const sy = Math.floor(i / tpr) * size;
    const off = document.createElement('canvas');
    off.width = $paletteTileSize; off.height = $paletteTileSize;
    const ctx = off.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // draw bitmap via temp canvas
    const src = document.createElement('canvas');
    src.width = $tilesetBitmap.width; src.height = $tilesetBitmap.height;
    const sctx = src.getContext('2d');
    sctx.drawImage($tilesetBitmap, 0, 0);
    ctx.drawImage(src, sx, sy, size, size, 0, 0, $paletteTileSize, $paletteTileSize);
    return off.toDataURL();
  }

  $: validTiles = $tilesetBitmap ? (() => {
    const total = $tilesPerRow * $tileRows;
    const hasPixels = new Set();
    for (let i = 0; i < total; i++) {
      const tpr = $tilesPerRow;
      const size = FIXED_TILE_SIZE;
      const sx = (i % tpr) * size;
      const sy = Math.floor(i / tpr) * size;
      const src = document.createElement('canvas');
      src.width = $tilesetBitmap.width; src.height = $tilesetBitmap.height;
      const sctx = src.getContext('2d');
      sctx.drawImage($tilesetBitmap, 0, 0);
      const imageData = sctx.getImageData(sx, sy, size, size);
      const data = imageData.data;
      let tileHasPixels = false;
      for (let j = 3; j < data.length; j += 4) {
        if (data[j] > 0) {
          tileHasPixels = true;
          break;
        }
      }
      if (tileHasPixels) hasPixels.add(i);
    }
    if (hasPixels.size === 0) return [];
    const min = Math.min(...hasPixels);
    const max = Math.max(...hasPixels);
    return Array.from({length: max - min + 1}, (_, i) => min + i);
  })() : [];
</script>

<div id="palette" style={`--tile: ${$paletteTileSize}px`} class="d-flex flex-wrap gap-0">
  {#if $tilesetBitmap}
    {#each validTiles as i}
      <button type="button" title={`Tile ${i}`} class:selected={$currentBrush === i} style={`background-image:url(${tileDataURL(i)}); background-size: ${$paletteTileSize}px ${$paletteTileSize}px; width: var(--tile); height: var(--tile);`} on:click={() => pick(i)}></button>
    {/each}
  {:else}
    <p class="hint">Upload a tileset to populate the palette.</p>
  {/if}
</div>


