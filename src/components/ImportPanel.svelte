<script>
  import { importJSON } from '../utils/import.js';

  let importAction = 'json';
  let importFileInput;

  async function onImportChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    await importJSON(f);
    e.target.value = '';
  }
</script>

<div style="display:flex; gap:0.5rem; align-items:center;">
  <input type="file" bind:this={importFileInput} accept="application/json" style="display:none" on:change={onImportChange} />
  <label for="importAction" style="width:auto;">Import</label>
  <select id="importAction" bind:value={importAction} title="Import actions">
    <option value="json">JSON</option>
  </select>
  <button class="secondary" title="Run selected import" on:click={() => importFileInput?.click()}>Import</button>
</div>