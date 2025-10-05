<script>
    import MapCanvas from "../components/MapCanvas.svelte";
    import Palette from "../components/Palette.svelte";
    import LayersPanel from "../components/LayersPanel.svelte";
    import TilesetUploader from "../components/TilesetUploader.svelte";
    import {
        currentBrush,
        backgroundColor,
        showGrid,
    } from "../stores/state.js";
</script>
<main class="container py-3">
    <div class="row g-3">
        <!-- Left column: tileset and layers -->
        <aside class="col-12 col-lg-3">
            <section id="tileset-section" class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">1. Upload Tileset</h5>
                    <TilesetUploader />
                </div>
            </section>

            <section id="layers-section" class="card">
                <div class="card-body">
                    <h5 class="card-title">3. Layers</h5>
                    <p class="hint">Select a layer to edit.</p>
                    <LayersPanel />
                </div>
            </section>
        </aside>

        <!-- Middle column: palette/brush -->
        <div class="col-12 col-lg-3">
            <section id="brush-section" class="card h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">2. Select Brush</h5>
                    <p class="hint">Click a tile to set the current brush. Current: <span>{$currentBrush !== -1 ? `#${$currentBrush}` : "(none)"}</span></p>
                    <div class="flex-grow-1 overflow-auto">
                        <Palette />
                    </div>
                </div>
            </section>
        </div>

        <!-- Right column: editor -->
        <div class="col-12 col-lg-6">
            <section id="editor-section" class="card">
                <div class="card-body">
                    <h5 class="card-title">4. Map Editor</h5>
                    <div class="d-flex flex-wrap align-items-center mb-2 gap-2">
                        <button class="btn btn-secondary btn-sm" on:click={() => currentBrush.set(-1)} title="Toggle erase mode (brush -1)">Erase</button>
                        <label for="bgColor" class="m-0">BG</label>
                        <input id="bgColor" type="color" bind:value={$backgroundColor} class="form-control form-control-color" title="Background color" style="width:48px; padding:0; height:34px;" />
                        <div class="form-check ms-2">
                            <input id="toggleGrid" class="form-check-input" type="checkbox" bind:checked={$showGrid} />
                            <label class="form-check-label" for="toggleGrid">Grid</label>
                        </div>
                    </div>

                    <div id="mapCanvasContainer" class="map-canvas-wrapper">
                        <MapCanvas />
                    </div>
                </div>
            </section>
        </div>
    </div>
</main>
