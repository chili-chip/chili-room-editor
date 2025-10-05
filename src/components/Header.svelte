<script>
  import ExportPanel from './ExportPanel.svelte';
  import ImportPanel from './ImportPanel.svelte';
  import MenuItem from './MenuItem.svelte';
</script>

<header class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Chili Room Editor</a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
  <li class="nav-item"><MenuItem href="/map" label="Map Editor" /></li>
  <li class="nav-item"><MenuItem href="/tile" label="Tile Editor" /></li>
      </ul>

      <div class="d-flex align-items-center gap-2">
        <ExportPanel />
        <ImportPanel />
      </div>
    </div>
  </div>
</header>