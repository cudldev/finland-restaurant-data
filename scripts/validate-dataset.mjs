#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const datasetPath = resolve(root, process.argv[2] ?? 'data/restaurants.json');
const errors = [];

try {
  const dataset = JSON.parse(await readFile(datasetPath, 'utf8'));
  if (dataset.schema !== 2) errors.push(`Expected schema 2, got ${dataset.schema}`);
  if (!Array.isArray(dataset.places) || dataset.places.length === 0) errors.push('places must be a non-empty array');
  const ids = new Set();
  for (const [index, place] of (dataset.places ?? []).entries()) {
    const label = `places[${index}]`;
    for (const field of ['id', 'name', 'city', 'checkedAt']) {
      if (!place[field]) errors.push(`${label}.${field} is required`);
    }
    if (ids.has(place.id)) errors.push(`${label}.id duplicates ${place.id}`);
    ids.add(place.id);
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) errors.push(`${label} needs numeric lat and lon`);
    if (!Array.isArray(place.sourceRecords) || place.sourceRecords.length === 0) errors.push(`${label}.sourceRecords must not be empty`);
    if (!place.sourceRecords?.some((source) => source.url && source.fields?.length && source.checkedAt)) {
      errors.push(`${label} needs a dated source URL with the fields it supports`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(place.checkedAt ?? '')) errors.push(`${label}.checkedAt must use YYYY-MM-DD`);
    if (place.photo && (!place.photo.url || !place.photo.sourceUrl || !place.photo.attribution || !place.photo.license || !place.photo.licenseUrl)) {
      errors.push(`${label}.photo needs URL, file page, attribution, license and license URL`);
    }
  }
} catch (error) {
  errors.push(`Could not read ${datasetPath}: ${error.message}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Dataset is valid: ${datasetPath}`);
}
