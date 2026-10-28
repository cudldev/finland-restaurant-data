import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function continuityErrors(current, baseline) {
  const errors = [];
  const byId = new Map(current.places.map(place => [place.id, place]));
  for (const old of baseline.places) {
    const next = byId.get(old.id);
    if (!next) { errors.push('Collected record removed: ' + old.id); continue; }
    for (const field of ['name', 'city', 'website', 'menuUrl', 'photo', 'address']) {
      if (old[field] && !next[field]) errors.push(`${old.id}: collected ${field} removed`);
    }
    for (const [field, value] of Object.entries(old.address ?? {})) {
      if (value && !next.address?.[field]) errors.push(`${old.id}: collected address.${field} removed`);
    }
    if (old.photo && JSON.stringify(old.photo) !== JSON.stringify(next.photo)
        && (!next.photo?.sourceUrl || !next.photo?.license || !next.photo?.attribution)) errors.push(old.id + ': replacement photo lacks provenance');
    const sources = new Set((next.sourceRecords ?? []).map(source => source.url));
    for (const source of old.sourceRecords ?? []) {
      if (!sources.has(source.url)) errors.push(old.id + ': source history removed: ' + source.url);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [current, baseline] = await Promise.all(process.argv.slice(2, 4).map(async path => JSON.parse(await readFile(path, 'utf8'))));
  if (!current || !baseline) throw Error('Usage: node scripts/validate-continuity.mjs current.json baseline.json');
  const errors = continuityErrors(current, baseline);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Collected records and source history preserved.');
}
