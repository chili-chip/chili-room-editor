<script>
  import { get } from 'svelte/store';
  import { buildProjectJSON, importFromJSON, buildCArrayString, pngExportSize, backgroundColor, layers, tilesetBitmap, tilesPerRow } from '../stores/state.js';
  import * as PIXI from 'pixi.js';

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
    const size = get(pngExportSize);
    const cell = size / 16; // since MAP_W=16
    try {
      // Create a temporary renderer for export
      const tempApp = new PIXI.Application({ width: size, height: size, background: 0x000000, antialias: false, resolution: 1 });
      // Copy the stage content, but scaled
      const tempStage = new PIXI.Container();
      tempApp.stage.addChild(tempStage);

      // Draw background
      const bg = new PIXI.Graphics();
      const bgColor = get(backgroundColor);
      const color = parseInt(bgColor.replace('#','0x'));
      bg.beginFill(color);
      bg.drawRect(0, 0, size, size);
      bg.endFill();
      tempStage.addChild(bg);

      // Draw tiles
      const layersData = get(layers);
      const bmp = get(tilesetBitmap);
      const tpr = get(tilesPerRow);
      if (bmp && tpr > 0) {
        const tex = PIXI.Texture.from(bmp);
        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        for (let li = 0; li < layersData.length; li++) {
          const layerData = layersData[li];
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const idx = layerData[y * 16 + x];
              if (idx >= 0) {
                const sx = (idx % tpr) * 8;
                const sy = Math.floor(idx / tpr) * 8;
                const frame = new PIXI.Rectangle(sx, sy, 8, 8);
                if (sx + 8 <= bmp.width && sy + 8 <= bmp.height) {
                  const tileTex = new PIXI.Texture(tex.baseTexture, frame);
                  tileTex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                  const spr = new PIXI.Sprite(tileTex);
                  spr.x = x * cell;
                  spr.y = y * cell;
                  spr.scale.set(cell / 8);
                  tempStage.addChild(spr);
                }
              }
            }
          }
        }
      }

      tempApp.renderer.render(tempApp.stage);
      const canvas = tempApp.renderer.extract.canvas(tempApp.stage);
      canvas.toBlob((blob) => {
        if (!blob) { alert('Failed to generate PNG'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `room_map_${size}x${size}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        tempApp.destroy(true);
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
  <label for="importAction" style="width:auto; margin-left:0.5rem;">Import</label>
  <select id="importAction" bind:value={importAction} title="Import actions">
    <option value="json">JSON</option>
  </select>
  <button class="secondary" title="Run selected import" on:click={() => importFileInput?.click()}>Import</button>
</div>
