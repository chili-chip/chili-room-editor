<script>
  import { onMount } from 'svelte';
  import MapCanvas from './components/MapCanvas.svelte';
  import Palette from './components/Palette.svelte';
  import LayersPanel from './components/LayersPanel.svelte';
  import TopBar from './components/TopBar.svelte';
  import TilesetUploader from './components/TilesetUploader.svelte';
  import { currentBrush, backgroundColor, showGrid, tilesetImage, initFromStorage } from './stores/state.js';

  onMount(() => {
    initFromStorage();
  });
</script>

<header>
  <h1>Chili Room Editor</h1>
  <TopBar />
  </header>

<main>
  <section id="tileset-section">
    <h2>1. Upload Tileset</h2>
    <TilesetUploader />
  </section>

  <section id="brush-section">
    <h2>2. Select Brush</h2>
    <p class="hint">Click a tile to set the current brush. Current: <span>{ $currentBrush !== -1 ? `#${$currentBrush}` : '(none)' }</span></p>
    <Palette />
  </section>

  <section id="layers-section">
    <h2>3. Layers</h2>
    <p class="hint">Select a layer to edit. Combined preview shows both layers stacked (Layer 0 below Layer 1).</p>
    <LayersPanel />
  </section>

  <section id="editor-section">
    <h2>4. Map Editor</h2>
    <div class="field-group">
      <button class="secondary" on:click={() => currentBrush.set(-1)} title="Toggle erase mode (brush -1)">Erase</button>
      <label for="bgColor" style="width:auto; margin-top:0.25rem;">BG</label>
      <input id="bgColor" type="color" bind:value={$backgroundColor} title="Background color" style="width:42px; padding:0; height:32px;" />
      <label for="toggleGrid" style="margin-left:0.75rem; width:auto;">Grid</label>
      <input id="toggleGrid" type="checkbox" bind:checked={$showGrid} title="Show grid lines" />
    </div>
    <div id="mapCanvasContainer">
      <MapCanvas />
    </div>
  </section>
</main>

<footer>
  <p>Copyright © 2023 chilichip</p>
</footer>

<style>
  span { font-weight: 600; }
</style>
