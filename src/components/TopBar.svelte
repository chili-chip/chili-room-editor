<script>
  import { buildProjectJSON, importFromJSON, buildCArrayString } from '../stores/state.js';

  let exportAction = 'json';
  let importAction = 'json';
  let importFileInput;

  function runExport() {
    switch (exportAction) {
      case 'json':
        try {
          const data = buildProjectJSON();
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'room_project.json';
          a.click();
          URL.revokeObjectURL(a.href);
        } catch { alert('Failed to export JSON'); }
        break;
      case 'png':
        exportPNG();
        break;
      case 'header':
        downloadHeader();
        break;
      case 'carray': {
        const { out } = buildCArrayString();
        navigator.clipboard.writeText(out).then(() => alert('C array copied to clipboard')).catch(() => alert('Clipboard blocked'));
        break;
      }
    }
  }

  function exportPNG() {
    const app = window.pixiApp;
    if (!app) { alert('Pixi app not found'); return; }
    try {
      const canvas = app.renderer.extract.canvas(app.stage);
      canvas.toBlob((blob) => {
        if (!blob) { alert('Failed to generate PNG'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'room_map.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  }

  function downloadHeader() {
    const { out, name } = buildCArrayString();
    const blob = new Blob([out + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.h';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onImportChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      await importFromJSON(obj);
      alert('Import complete');
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + (err && err.message ? err.message : 'Unknown error'));
    } finally {
      e.target.value = '';
    }
  }
</script>

<div class="header-actions" style="display:flex; gap:0.5rem; align-items:center; flex-wrap:nowrap;">
  <input type="file" bind:this={importFileInput} accept="application/json" style="display:none" on:change={onImportChange} />
  <label for="exportAction" style="width:auto;">Export</label>
  <select id="exportAction" bind:value={exportAction} title="Export actions">
    <option value="json">JSON</option>
    <option value="png">PNG</option>
    <option value="header">.h</option>
    <option value="carray">C array</option>
  </select>
  <button class="secondary" title="Run selected export" on:click={runExport}>Export</button>
  <label for="importAction" style="width:auto; margin-left:0.5rem;">Import</label>
  <select id="importAction" bind:value={importAction} title="Import actions">
    <option value="json">JSON</option>
  </select>
  <button class="secondary" title="Run selected import" on:click={() => importFileInput?.click()}>Import</button>
</div>
