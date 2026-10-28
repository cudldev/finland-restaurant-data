import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { assertCandidateOutput, writeCandidateReport } from './candidate-output.mjs';
import { preserveReviewState, retainMissingReviews, identitySourceIds } from './review-state.mjs';
import { continuityErrors } from './validate-continuity.mjs';
import { spawnSync } from 'node:child_process';

async function testRoot(prefix) {
  const local = resolve('.local');
  await mkdir(local, { recursive: true });
  return mkdtemp(join(local, prefix));
}

test('both discovery commands reject curated output before fetching sources', () => {
  for (const script of ['discover-candidates.mjs', 'discover-osm-candidates.mjs']) {
    const result = spawnSync(process.execPath, ['scripts/' + script, '--output', 'data/restaurants.json'], { encoding: 'utf8', timeout: 3000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Candidate output must stay inside .local/);
  }
});

test('discovery cannot target published data, escape .local, or overwrite a dataset disguised as a report', async () => {
  const root = await testRoot('restaurant-guard-');
  await assert.rejects(assertCandidateOutput(root, join(root, 'data/restaurants.json')));
  await assert.rejects(assertCandidateOutput(root, join(root, '.local/../README.md')));
  await mkdir(join(root, '.local'), { recursive: true });
  const output = join(root, '.local/candidates.json');
  await writeFile(output, JSON.stringify({ schema: 2, places: [{ id: 'kept' }] }));
  await assert.rejects(writeCandidateReport(root, output, { schema: 1, candidates: [] }));
  assert.equal(JSON.parse(await readFile(output)).places[0].id, 'kept');
});
test('candidate refresh retains full previous report as a backup', async () => {
  const root = await testRoot('restaurant-report-');
  const output = join(root, '.local/candidates.json');
  const old = { schema: 1, candidates: [{ sourceId: '1', reviewNote: 'verified manually' }] };
  await writeCandidateReport(root, output, old);
  await writeCandidateReport(root, output, { schema: 1, candidates: [] });
  const backup = (await readdir(join(root, '.local'))).find(name => name.includes('.backup-'));
  assert.deepEqual(JSON.parse(await readFile(join(root, '.local', backup))), old);
});
test('matched map object cannot erase a deferred identity review or its evidence', () => {
  const old = { sourceId: '1', status: 'deferred_coordinate_reconciliation', lastReviewedAt: '2026-10-28', reviewSources: ['https://example.com'], relatedDatasetId: 'a', geographicAudit: 'boundary' };
  const next = { sourceId: '1', status: 'already_in_dataset_or_same_address', name: 'fresh map name' };
  preserveReviewState(next, old, new Set(['a']), true);
  assert.equal(next.status, old.status);
  assert.deepEqual(next.reviewSources, old.reviewSources);
  assert.equal(next.relatedDatasetId, 'a');
  assert.equal(next.geographicAudit, 'boundary');
  assert.equal(next.name, 'fresh map name');
});
test('missing reviewed leads survive discovery without being declared closed', () => {
  const old = { sourceId: '1', status: 'deferred_public_meal_review', reviewNote: 'needs meals' };
  const items = retainMissingReviews([], new Map([['1', old]]));
  assert.equal(items[0].missingFromLatestDiscovery, true);
  assert.equal(items[0].status, old.status);
});
test('address-only geocodes do not establish restaurant identity', () => {
  assert.deepEqual([...identitySourceIds([{ sourceRecords: [{ recordId: 'way/1', fields: ['lat', 'lon'] }, { recordId: 'node/2', fields: ['name', 'lat'] }] }])], ['node/2']);
});
test('continuity rejects lost records, menu links, photos and source history but permits additions', () => {
  const old = { id: 'a', name: 'A', city: 'Helsinki', menuUrl: 'https://example.com/menu', photo: { url: 'x', sourceUrl: 's', license: 'CC BY', attribution: 'Author' }, sourceRecords: [{ url: 'https://example.com' }] };
  const baseline = { places: [old] };
  assert.equal(continuityErrors({ places: [old, { id: 'b' }] }, baseline).length, 0);
  assert.match(continuityErrors({ places: [] }, baseline).join(), /record removed/);
  assert.match(continuityErrors({ places: [{ ...old, menuUrl: undefined, photo: undefined, sourceRecords: [] }] }, baseline).join(), /menuUrl removed/);
});
