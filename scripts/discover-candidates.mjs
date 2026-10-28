#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preserveReviewState, readPreviousCandidates, retainMissingReviews } from './review-state.mjs';
import { assertCandidateOutput, writeCandidateReport } from './candidate-output.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = 'https://api.hel.fi/servicemap/v2/';
const sourceName = 'Helsinki metropolitan area Service Map';
const sourceLicense = 'CC-BY-4.0';
const sourceLicenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
const attribution = 'Source: Helsinki metropolitan area Service Map APIs. Maintainer: City of Helsinki Digitalisation Unit; original authors: cities of Helsinki, Espoo, Vantaa and Kauniainen. Licensed under CC BY 4.0.';
const municipalities = ['helsinki', 'espoo', 'vantaa', 'kauniainen'];
const serviceCategories = [
  { id: 577, label: 'restaurants' },
  { id: 221, label: 'public administration staff restaurants' },
  { id: 239, label: 'cafes' }
];
const delayMs = 250;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function first(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? null;
}

function getName(item) {
  return first(item['name.fi'], item['name.sv'], item['name.en'], item.name?.fi, item.name?.sv, item.name?.en, item.name);
}

function getAddress(item) {
  return first(item['street_address.fi'], item['street_address.sv'], item['street_address.en'], item.street_address?.fi, item.street_address?.sv, item.street_address?.en, item.street_address);
}

function getWebsite(item) {
  return first(item.www?.fi, item.www?.sv, item.www?.en, item.www?.url, item.www, item.website);
}

function candidateFrom(item, municipality, category) {
  const id = item.id ?? item['unit.id'] ?? item.unit_id;
  const name = getName(item);
  if (id == null || !name) return null;
  const coordinates = item.location?.coordinates ?? item['location.coordinates'];
  return {
    sourceId: String(id),
    name,
    municipality: first(item.municipality, municipality),
    address: getAddress(item),
    postalCode: first(item.address_zip, item.postal_code),
    website: getWebsite(item),
    lat: Array.isArray(coordinates) && Number.isFinite(coordinates[1]) ? coordinates[1] : null,
    lon: Array.isArray(coordinates) && Number.isFinite(coordinates[0]) ? coordinates[0] : null,
    lastModifiedAt: first(item.last_modified_time),
    serviceCategories: [category.label],
    source: sourceName,
    sourceUrl: `${apiUrl}unit/?service=${category.id}&municipality=${encodeURIComponent(municipality)}`,
    sourceRecordUrl: `${apiUrl}unit/${id}/`,
    sourceLicense,
    sourceLicenseUrl,
    attribution,
    status: 'needs_official_verification',
    operationStatus: 'unverified'
  };
}

async function getResults(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'FinlandRestaurantData/1.0 (open-source candidate discovery; https://github.com/cudldev/finland-restaurant-data)'
    },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Service Map returned HTTP ${response.status} for ${url}`);
  return response.json();
}

async function main() {
  const outputPath = resolve(root, argValue('--output', '.local/candidates.json'));
  await assertCandidateOutput(root, outputPath);
  const maxPages = Number.parseInt(argValue('--max-pages', '20'), 10);
  const previousCandidates = await readPreviousCandidates(outputPath);
  const dataset = JSON.parse(await readFile(resolve(root, 'data/restaurants.json'), 'utf8'));
  const datasetIds = new Set((dataset.places ?? []).map((place) => place.id));
  const candidates = new Map();
  const queries = [];

  for (const municipality of municipalities) {
    for (const category of serviceCategories) {
      const params = new URLSearchParams({ service: String(category.id), municipality, page_size: '100' });
      let next = `${apiUrl}unit/?${params}`;
      let pages = 0;
      while (next && pages < maxPages) {
        const payload = await getResults(next);
        const results = Array.isArray(payload.results) ? payload.results : [];
        for (const item of results) {
          const candidate = candidateFrom(item, municipality, category);
          if (!candidate) continue;
          preserveReviewState(candidate, previousCandidates.get(candidate.sourceId), datasetIds);
          const key = `${candidate.municipality}:${candidate.sourceId}`;
          const existing = candidates.get(key);
          if (existing) existing.serviceCategories = [...new Set([...existing.serviceCategories, category.label])];
          else candidates.set(key, candidate);
        }
        next = payload.next ?? null;
        pages += 1;
        if (next) await new Promise((r) => setTimeout(r, delayMs));
      }
      queries.push({ municipality, categoryId: category.id, category: category.label, pagesFetched: pages });
      if (next) console.warn(`Stopped after ${maxPages} pages for ${municipality}/${category.label}; increase --max-pages to continue.`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const places = retainMissingReviews([...candidates.values()], previousCandidates).sort((a, b) =>
    `${a.municipality}:${a.name}:${a.address ?? ''}`.localeCompare(`${b.municipality}:${b.name}:${b.address ?? ''}`, 'fi')
  );
  const report = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    purpose: 'Candidate discovery only. Verify each location on an official current branch page before adding it to restaurants.json.',
    source: sourceName,
    sourceUrl: apiUrl,
    sourceLicense,
    attribution,
    queries,
    candidateCount: places.length,
    candidates: places
  };
  await writeCandidateReport(root, outputPath, report);
  console.log(`Wrote ${places.length} distinct candidate locations to ${outputPath}`);
  console.log('Candidates are unverified leads and were not added to data/restaurants.json.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
