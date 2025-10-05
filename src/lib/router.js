import { writable } from 'svelte/store';

// Simple hash-based router. Routes are strings like '/map' or '/tile'.
const initial = (typeof window !== 'undefined' && window.location.hash) ? window.location.hash.slice(1) : '/map';
export const route = writable(initial || '/map');

export function navigate(path) {
  if (!path.startsWith('/')) path = '/' + path;
  if (typeof window !== 'undefined') window.location.hash = path;
  route.set(path);
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.set(window.location.hash.slice(1) || '/map');
  });
}
