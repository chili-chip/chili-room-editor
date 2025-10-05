<script>
  import { route, navigate } from '../lib/router.js';
  import { derived } from 'svelte/store';

  export let href = '#';
  export let label = '';
  export let active = false;

  // Normalize href to route path (strip .html if present)
  const to = href && href.endsWith('.html') ? href.replace(/\.html$/, '') : href;
  const isActive = derived(route, $r => $r === to || $r === (to || '/'));

  function go(e) {
    e.preventDefault();
    navigate(to || '/');
  }
</script>

<a class:active class="nav-link" href={href} on:click={go} aria-current={$isActive ? 'page' : undefined}>
  {label}
</a>

<style>
  .nav-link { color: inherit; }
  .nav-link.active { font-weight: 600; }
</style>
