#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceUrl = 'https://api.hel.fi/servicemap/v2/search/';
const sourceName = 'Helsinki metropolitan area Service Map';
const sourceLicense = 'CC-BY-4.0';
const sourceLicenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
const attribution = 'Source: Helsinki metropolitan area Service Map APIs. Maintainer: City of Helsinki Digitalisation Unit; original authors: cities of Helsinki, Espoo, Vantaa and Kauniainen. Licensed under CC BY 4.0.';
const municipalities = ['helsinki', 'espoo', 'vantaa', 'kauniainen'];
const searchTerms = ['ravintola', 'lounas', 'kahvila', 'restaurant', 'cafe', 'ruokaravintola'];
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

function candidateFrom(item, municipality, term) {
  const id = item.id ?? item['unit.id'] ?? item.unit_id;
  const name = getName(item);
  if (id == null || !name) return null;
  return {
    sourceId: String(id),
    name,
    municipality: first(item.municipality, municipality),
    address: getAddress(item),
    website: first(item.www, item.website, item['www.fi'], item['www.sv'], item['www.en']),
    coordinates: item.location?.coordinates ?? item['location.coordinates'] ?? null,
    discoveredByTerms: [term],
    source: sourceName,
    sourceUrl: `${sourceUrl}?input=${encodeURIComponent(term)}&type=unit&municipality=${encodeURIComponent(municipality)}`,
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
  const maxPages = Number.parseInt(argValue('--max-pages', '100'), 10);
  const candidates = new Map();
  const queries = [];

  for (const municipality of municipalities) {
    for (const term of searchTerms) {
      const params = new URLSearchParams({ input: term, type: 'unit', language: 'fi', municipality, page_size: '100' });
      let next = `${sourceUrl}?${params}`;
      let pages = 0;
      while (next && pages < maxPages) {
        const payload = await getResults(next);
        const results = Array.isArray(payload.results) ? payload.results : [];
        for (const item of results) {
          const candidate = candidateFrom(item, municipality, term);
          if (!candidate) continue;
          const key = `${candidate.municipality}:${candidate.sourceId}`;
          const existing = candidates.get(key);
          if (existing) existing.discoveredByTerms = [...new Set([...existing.discoveredByTerms, term])];
          else candidates.set(key, candidate);
        }
        next = payload.next ?? null;
        pages += 1;
        if (next) await new Promise((r) => setTimeout(r, delayMs));
      }
      queries.push({ municipality, term, pagesFetched: pages });
      if (next) console.warn(`Stopped after ${maxPages} pages for ${municipality}/${term}; increase --max-pages to continue.`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const places = [...candidates.values()].sort((a, b) =>
    `${a.municipality}:${a.name}:${a.address ?? ''}`.localeCompare(`${b.municipality}:${b.name}:${b.address ?? ''}`, 'fi')
  );
  const report = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    purpose: 'Candidate discovery only. Verify each location on an official current branch page before adding it to restaurants.json.',
    source: sourceName,
    sourceUrl,
    sourceLicense,
    attribution,
    queries,
    candidateCount: places.length,
    candidates: places
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${places.length} distinct candidate locations to ${outputPath}`);
  console.log('Candidates are unverified leads and were not added to data/restaurants.json.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
