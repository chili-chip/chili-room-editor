<script>
  import { onMount } from "svelte";
  import Header from "./components/Header.svelte";
  import Footer from "./components/Footer.svelte";
  import MapEditor from "./pages/MapEditor.svelte";
  import TileEditor from "./pages/TileEditor.svelte";
  import { route } from "./lib/router.js";
  import { initFromStorage } from "./stores/state.js";

  onMount(() => {
    initFromStorage();
  });
</script>

<Header />
<main class="container-fluid">
  {#if $route === "/tile"}
    <TileEditor />
  {:else}
    <MapEditor />
  {/if}
</main>

<Footer />
