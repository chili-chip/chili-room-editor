<script>
  import { pngExportSize } from '../stores/state.js';
  import { exportJSON, exportPNG, exportHeader, exportCArray } from '../utils/export.js';

  let exportAction = 'json';

  function runExport() {
    switch (exportAction) {
      case 'json':
        exportJSON();
        break;
      case 'png':
        exportPNG();
        break;
      case 'header':
        exportHeader();
        break;
      case 'carray':
        exportCArray();
        break;
    }
  }
</script>

<div style="display:flex; gap:0.5rem; align-items:center;">
  <label for="exportAction" style="width:auto;">Export</label>
  <select id="exportAction" bind:value={exportAction} title="Export actions">
    <option value="json">JSON</option>
    <option value="png">PNG</option>
    <option value="header">.h</option>
    <option value="carray">C array</option>
  </select>
  {#if exportAction === 'png'}
    <label for="pngSize" style="width:auto;">Size</label>
    <select id="pngSize" bind:value={$pngExportSize} title="PNG export size">
      <option value={128}>128x128</option>
      <option value={256}>256x256</option>
      <option value={512}>512x512</option>
      <option value={1024}>1024x1024</option>
    </select>
  {/if}
  <button class="secondary" title="Run selected export" on:click={runExport}>Export</button>
</div>