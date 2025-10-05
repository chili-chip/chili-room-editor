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
</script>

<div id="palette" style={`--tile: ${$paletteTileSize}px`}>
  {#if $tilesetBitmap}
    {#each Array($tilesPerRow * $tileRows) as _, i}
      <button type="button" class:selected={$currentBrush === i} style={`background-image:url(${tileDataURL(i)}); background-size: ${$paletteTileSize}px ${$paletteTileSize}px;`} on:click={() => pick(i)}></button>
    {/each}
  {:else}
    <p class="hint">Upload a tileset to populate the palette.</p>
  {/if}
</div>


