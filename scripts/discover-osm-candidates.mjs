#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = 'https://overpass-api.de/api/interpreter';
const sourceName = 'OpenStreetMap Overpass API';
const license = 'ODbL-1.0';
const licenseUrl = 'https://www.openstreetmap.org/copyright';
const attribution = '© OpenStreetMap contributors';
const bounds = { south: 59.9, west: 24.3, north: 60.5, east: 25.4 };
const query = `[out:json][timeout:120];nwr["amenity"~"^(restaurant|cafe|fast_food|food_court)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});out center tags;`;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function coordinates(element) {
  if (element.type === 'node') return { lat: element.lat, lon: element.lon };
  return { lat: element.center?.lat, lon: element.center?.lon };
}

function candidate(element) {
  const tags = element.tags ?? {};
  const { lat, lon } = coordinates(element);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!tags.name && !tags.brand) return null;
  if (tags['disused:amenity'] || tags['abandoned:amenity'] || tags.access === 'private') return null;

  const id = `${element.type}/${element.id}`;
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ').trim();
  return {
    sourceId: id,
    sourceUrl: `https://www.openstreetmap.org/${id}`,
    name: tags.name ?? tags.brand,
    ...(tags.branch ? { branch: tags.branch } : {}),
    brand: tags.brand ?? null,
    city: tags['addr:city'] ?? null,
    address: street ? {
      street,
      ...(tags['addr:postcode'] ? { postalCode: tags['addr:postcode'] } : {})
    } : null,
    category: tags.amenity,
    cuisine: tags.cuisine ?? null,
    website: tags.website ?? null,
    lat,
    lon,
    source: sourceName,
    sourceLicense: license,
    sourceLicenseUrl: licenseUrl,
    attribution,
    status: 'needs_official_validation'
  };
}

async function main() {
  const outputPath = resolve(root, argValue('--output', '.local/osm-candidates.json'));
  const dataset = JSON.parse(await readFile(resolve(root, 'data/restaurants.json'), 'utf8'));
  const knownSourceIds = new Set();
  const knownPlaces = [];
  for (const place of dataset.places ?? []) {
    for (const source of place.sourceRecords ?? []) {
      if (source.recordId) knownSourceIds.add(source.recordId);
    }
    if (place.address?.street) knownPlaces.push(place);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'FinlandRestaurantData/1.0 (local candidate discovery; no hosted runner)'
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(180_000)
  });
  if (!response.ok) throw new Error(`Overpass returned HTTP ${response.status}`);
  const payload = await response.json();
  const seen = new Set();
  const candidates = [];
  let knownCount = 0;

  for (const element of payload.elements ?? []) {
    const item = candidate(element);
    if (!item || seen.has(item.sourceId)) continue;
    seen.add(item.sourceId);
    const itemNames = new Set([normalize(item.name), normalize(item.brand)].filter(Boolean));
    const sameNamedAddress = item.address && knownPlaces.some(place => {
      const placeNames = new Set([normalize(place.name), normalize(place.brand)].filter(Boolean));
      const sameStreet = normalize(item.address.street) === normalize(place.address?.street);
      const samePostcode = !item.address.postalCode || !place.address?.postalCode
        || normalize(item.address.postalCode) === normalize(place.address.postalCode);
      const sameCity = !item.city || !place.city || normalize(item.city) === normalize(place.city);
      return [...itemNames].some(name => placeNames.has(name))
        && sameStreet && samePostcode && sameCity;
    });
    const alreadyKnown = knownSourceIds.has(item.sourceId) || sameNamedAddress;
    if (alreadyKnown) {
      item.status = 'already_in_dataset_or_same_address';
      knownCount += 1;
    }
    candidates.push(item);
  }

  candidates.sort((a, b) => `${a.city ?? ''}:${a.name}:${a.address?.street ?? ''}`
    .localeCompare(`${b.city ?? ''}:${b.name}:${b.address?.street ?? ''}`, 'fi'));
  const report = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    purpose: 'Local lead and coverage report only. OSM status does not prove current operation; verify new locations against a current authoritative source before publishing.',
    source: sourceName,
    sourceUrl: endpoint,
    sourceLicense: license,
    sourceLicenseUrl: licenseUrl,
    attribution,
    bounds,
    query,
    candidateCount: candidates.length,
    alreadyKnownCount: knownCount,
    needsValidationCount: candidates.length - knownCount,
    candidates
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${candidates.length} OSM candidates to ${outputPath}`);
  console.log(`${knownCount} match current records by OSM object ID or address; ${candidates.length - knownCount} still need current-operation validation.`);
  console.log('This report stays local and is not copied into data/restaurants.json automatically.');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
