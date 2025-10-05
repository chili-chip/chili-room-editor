<script>
  import { tilesetImage, tilesetBitmap, tilesets, selectedTilesetIndex, setTilesetFromFile, clearTileset, selectTileset } from '../stores/state.js';
  let fileInput;
  let previewCanvas;

  async function onChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'image/png') { alert('Please select a PNG file'); return; }
    try {
      await setTilesetFromFile(file);
    } catch (e) {
      alert(e?.message || 'Failed to load tileset');
    } finally {
      e.target.value = '';
    }
  }

  $: if ($tilesetBitmap && previewCanvas) {
    const cv = previewCanvas;
    cv.width = 128;
    cv.height = $tilesetBitmap.height;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,cv.width, cv.height);
    const off = document.createElement('canvas');
    off.width = $tilesetBitmap.width; off.height = $tilesetBitmap.height;
    const octx = off.getContext('2d');
    octx.drawImage($tilesetBitmap, 0, 0);
    ctx.drawImage(off, 0, 0);
  }
</script>

<div class="mb-3">
  <label for="tilesetFile" class="form-label">Upload 128x128 Tileset (PNG)</label>
  <input id="tilesetFile" class="form-control" type="file" accept="image/png" on:change={onChange} bind:this={fileInput} />
  <div class="mt-2">
    <button class="btn btn-sm btn-outline-secondary" on:click={() => { if (confirm('Remove stored tileset? This also clears palette and brush.')) clearTileset(); }}>Clear Tileset</button>
  </div>
</div>
{#if $tilesets.length > 0}
  <div class="mb-3">
    <label for="tilesetSelect" class="form-label">Select Tileset</label>
    <select id="tilesetSelect" class="form-select" bind:value={$selectedTilesetIndex} on:change={(e) => selectTileset(parseInt(e.target.value))}>
      {#each $tilesets as ts, i}
        <option value={i}>{ts.name}</option>
      {/each}
    </select>
  </div>
{/if}
{#if $tilesetBitmap}
  <canvas id="tilesetPreview" bind:this={previewCanvas} aria-label="Tileset preview" class="img-fluid border" style="max-width:100%; height:auto;"></canvas>
{/if}
