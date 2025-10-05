<script>
  import TilesetUploader from './TilesetUploader.svelte';
  import LayersPanel from './LayersPanel.svelte';
  import Sidebar from './Sidebar.svelte';
</script>

<Sidebar ariaLabel="Left tools sidebar">
  <section id="tileset-section" class="card">
    <div class="card-body">
      <h5 class="card-title">Upload Tileset</h5>
      <TilesetUploader />
    </div>
  </section>

  <section id="layers-section" class="card">
    <div class="card-body">
      <h5 class="card-title">Layers</h5>
      <p class="hint">Select a layer to edit. Combined preview shows both layers stacked (Layer 0 below Layer 1).</p>
      <LayersPanel />
    </div>
  </section>
</Sidebar>
