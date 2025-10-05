<script>
  import Palette from './Palette.svelte';
  import { currentBrush } from '../stores/state.js';
  import Sidebar from './Sidebar.svelte';
</script>

<Sidebar ariaLabel="Right tools sidebar">
  <section id="brush-section" class="card">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">Brush</h5>
      <p class="hint">Click a tile to set the current brush. Current: <span>{$currentBrush !== -1 ? `#${$currentBrush}` : "(none)"}</span></p>
      <div class="flex-grow-1 overflow-auto">
        <Palette />
      </div>
    </div>
  </section>
</Sidebar>
