<script>
  import { layers, currentLayer, clearCurrentLayer } from '../stores/state.js';
  import LayerPreview from './LayerPreview.svelte';
</script>

<div class="layers-list">
  {#each $layers as layer, i}
    <button type="button" class="layer-select { $currentLayer === i ? 'selected' : '' }" on:click={() => currentLayer.set(i)}>
      <span>Layer {i}</span>
      <LayerPreview {layer} width={128} height={128} aria-label={`Layer ${i} preview`} />
    </button>
  {/each}
  <button class="secondary" on:click={() => { if (confirm('Clear current layer?')) clearCurrentLayer(); }}>Clear Current Layer</button>
</div>

<div class="combined-wrapper">
  <span class="combined-label">Combined</span>
  <LayerPreview layers={$layers} width={128} height={128} aria-label="Combined layers preview" />
</div>
