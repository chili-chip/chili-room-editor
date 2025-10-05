<script>
    import MapCanvas from "./MapCanvas.svelte";
    import {
        currentBrush,
        backgroundColor,
        showGrid,
    } from "../stores/state.js";
    import { displayTileSize } from "../stores/state.js";
    import { onMount } from "svelte";
    import { onDestroy } from "svelte";

    let wrapperEl;

    // Zoom constants
    const ZOOM_MIN = 16;
    const ZOOM_MAX = 64;
    const ZOOM_STEP = 4;
    const ZOOM_DEFAULT = 32;

    // Zoom helpers
    function zoomIn() {
        displayTileSize.update((s) => Math.min(s + ZOOM_STEP, ZOOM_MAX));
    }
    function zoomOut() {
        displayTileSize.update((s) => Math.max(s - ZOOM_STEP, ZOOM_MIN));
    }
    function setZoom(v) {
        displayTileSize.set(Number(v || ZOOM_DEFAULT));
    }

    // Panning helpers: scroll the wrapper element
    function pan(dx, dy) {
        if (!wrapperEl) return;
        console.debug("[CenterEditor] pan", {
            dx,
            dy,
            wrapperClient: wrapperEl.clientWidth + "x" + wrapperEl.clientHeight,
        });
        wrapperEl.scrollBy({ left: dx, top: dy, behavior: "smooth" });
    }
    function centerView() {
        if (!wrapperEl) return;
        const canvas = wrapperEl.querySelector("canvas");
        if (!canvas) return;
        console.debug("[CenterEditor] centerView", {
            canvasW: canvas.width,
            canvasH: canvas.height,
            wrapperW: wrapperEl.clientWidth,
            wrapperH: wrapperEl.clientHeight,
        });
        const footerReserve =
            parseInt(
                getComputedStyle(document.documentElement).getPropertyValue(
                    "--footer-height",
                ),
            ) || 48;
        const left = (canvas.width - wrapperEl.clientWidth) / 2;
        const top =
            (canvas.height - (wrapperEl.clientHeight - footerReserve)) / 2;
        wrapperEl.scrollTo({ left, top, behavior: "smooth" });
    }

    onMount(() => {
        // small delay to allow canvas to be appended
        setTimeout(() => centerView(), 200);
    });

    function onWheel(e) {
        // Use wheel to zoom the map
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
        console.debug("[CenterEditor] wheel", { deltaY: e.deltaY });
    }

    function onKey(e) {
        const panStepX = Math.round((wrapperEl?.clientWidth || 200) / 6);
        const panStepY = Math.round((wrapperEl?.clientHeight || 200) / 6);
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            pan(-panStepX, 0);
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            pan(panStepX, 0);
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            pan(0, -panStepY);
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            pan(0, panStepY);
        }
        if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            zoomIn();
        }
        if (e.key === "-") {
            e.preventDefault();
            zoomOut();
        }
        if (e.key === "0") {
            e.preventDefault();
            centerView();
        }
        console.debug("[CenterEditor] key", e.key);
    }

    onMount(() => {
        window.addEventListener("keydown", onKey);
        // attach wheel to wrapper once available
        const attach = () =>
            wrapperEl &&
            wrapperEl.addEventListener("wheel", onWheel, { passive: false });
        const t = setTimeout(attach, 100);
        console.debug("[CenterEditor] mounted, wrapperEl:", wrapperEl);
        return () => {
            clearTimeout(t);
            window.removeEventListener("keydown", onKey);
            wrapperEl && wrapperEl.removeEventListener("wheel", onWheel);
        };
    });

    onDestroy(() => {
        window.removeEventListener("keydown", onKey);
        wrapperEl && wrapperEl.removeEventListener("wheel", onWheel);
    });
</script>

<section class="col-12 col-lg-6 px-3 h-100">
    <div class="card h-100">
        <div
            class="card-header d-flex mb-2 align-items-center justify-content-between bg-secondary p-3"
        >
            <div class="d-flex align-items-center gap-2">
                <button
                    class="btn btn-secondary btn-sm"
                    on:click={() => currentBrush.set(-1)}
                    title="Toggle erase mode (brush -1)">Erase</button
                >
                <label for="bgColor" class="ms-2">BG</label>
                <input
                    id="bgColor"
                    type="color"
                    bind:value={$backgroundColor}
                    class="form-control form-control-color d-inline-block ms-1"
                    title="Background color"
                    style="width:48px; padding:0; height:34px;"
                />
                <div class="form-check form-check-inline ms-2">
                    <input
                        id="toggleGrid"
                        class="form-check-input"
                        type="checkbox"
                        bind:checked={$showGrid}
                    />
                    <label class="form-check-label" for="toggleGrid">Grid</label
                    >
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <div class="btn-group" role="group" aria-label="pan controls">
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={() =>
                            pan(
                                -Math.round(
                                    (wrapperEl?.clientWidth || 200) / 4,
                                ),
                                0,
                            )}
                        title="Pan left">◀</button
                    >
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={() =>
                            pan(
                                Math.round((wrapperEl?.clientWidth || 200) / 4),
                                0,
                            )}
                        title="Pan right">▶</button
                    >
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={() =>
                            pan(
                                0,
                                -Math.round(
                                    (wrapperEl?.clientHeight || 200) / 4,
                                ),
                            )}
                        title="Pan up">▲</button
                    >
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={() =>
                            pan(
                                0,
                                Math.round(
                                    (wrapperEl?.clientHeight || 200) / 4,
                                ),
                            )}
                        title="Pan down">▼</button
                    >
                </div>

                <div
                    class="btn-group ms-2"
                    role="group"
                    aria-label="zoom controls"
                >
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={zoomOut}
                        title="Zoom out">-</button
                    >
                    <input
                        class="form-range"
                        type="range"
                        min={ZOOM_MIN}
                        max={ZOOM_MAX}
                        step="1"
                        style="width:120px;"
                        value={$displayTileSize}
                        on:input={(e) => setZoom(e.target.value)}
                        aria-label="zoom slider"
                    />
                    <button
                        class="btn btn-outline-light btn-sm"
                        on:click={zoomIn}
                        title="Zoom in">+</button
                    >
                </div>

                <button
                    class="btn btn-outline-light btn-sm ms-2"
                    on:click={centerView}
                    title="Center view">Center</button
                >
            </div>
        </div>
        <div class="card-body d-flex flex-column h-100" style="min-height:0;">
            <div
                class="flex-grow-1 d-flex editor-viewport"
                style="min-height:0; overflow:auto;"
                bind:this={wrapperEl}
            >
                <MapCanvas />
            </div>
        </div>
        <div class="card-footer text-muted text-center" style="font-size:0.9em;">
            <div>Use mouse wheel to zoom, arrow keys to pan, +/- to zoom, 0 to center</div>
    </div>
</section>
