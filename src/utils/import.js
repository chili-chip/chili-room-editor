import { importFromJSON } from '../stores/state.js';

export async function importJSON(file) {
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    await importFromJSON(obj);
    alert('Import complete');
  } catch (err) {
    console.error(err);
    alert('Import failed: ' + (err && err.message ? err.message : 'Unknown error'));
  }
}