<script>
  import { tilesetImage, tilesetBitmap, setTilesetFromFile, clearTileset } from '../stores/state.js';
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

<div class="field-group">
  <label for="tilesetFile">Upload 128x128 Tileset (PNG)</label>
  <input id="tilesetFile" type="file" accept="image/png" on:change={onChange} bind:this={fileInput} />
  <button class="secondary" on:click={() => { if (confirm('Remove stored tileset? This also clears palette and brush.')) clearTileset(); }}>Clear Tileset</button>
</div>
{#if $tilesetBitmap}
  <canvas id="tilesetPreview" bind:this={previewCanvas} aria-label="Tileset preview"></canvas>
{/if}
