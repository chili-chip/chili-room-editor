<script>
  export let ariaLabel = 'Sidebar';
  export let className = '';
</script>

<aside class={"col-12 col-lg-3 px-0 h-100 " + className} aria-label={ariaLabel}>
  <div class="sticky-side d-flex flex-column gap-3 px-3">
    <slot />
  </div>
</aside>
