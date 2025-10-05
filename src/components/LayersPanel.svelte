<script>
  import { layers, currentLayer, clearCurrentLayer } from '../stores/state.js';
  import LayerPreview from './LayerPreview.svelte';
</script>

<div class="layers-list d-flex flex-column gap-2">
  {#each $layers as layer, i}
    <div class="card">
      <div class="card-body d-flex align-items-center gap-2 p-2" role="button" on:click={() => currentLayer.set(i)}>
        <div class="flex-grow-1">Layer {i}</div>
        <LayerPreview {layer} width={128} height={128} aria-label={`Layer ${i} preview`} />
      </div>
    </div>
  {/each}
  <button class="btn btn-sm btn-outline-danger" on:click={() => { if (confirm('Clear current layer?')) clearCurrentLayer(); }}>Clear Current Layer</button>
</div>

<div class="combined-wrapper mt-3">
  <span class="combined-label d-block mb-1">Combined</span>
  <LayerPreview layers={$layers} width={128} height={128} aria-label="Combined layers preview" />
</div>
