import { readFile } from 'node:fs/promises';

const REVIEW_FIELDS = ['status', 'operationStatus', 'datasetId', 'relatedDatasetId', 'lastReviewedAt', 'reviewNote', 'reviewSources'];
const UNREVIEWED_STATUSES = new Set(['needs_official_verification', 'needs_official_validation', 'unverified']);

export async function readPreviousCandidates(path) {
  try {
    const report = JSON.parse(await readFile(path, 'utf8'));
    return new Map((report.candidates ?? []).map((candidate) => [String(candidate.sourceId), candidate]));
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

export function preserveReviewState(candidate, previous, datasetIds, alreadyKnown = false) {
  candidate.missingFromLatestDiscovery = false;
  if (!previous) return candidate;
  const reviewed = previous.lastReviewedAt || !UNREVIEWED_STATUSES.has(previous.status);
  if (!reviewed) {
    if (alreadyKnown) candidate.status = 'already_in_dataset_or_same_address';
    return candidate;
  }
  if (previous.status === 'added_to_dataset'
      && (!previous.datasetId || !datasetIds.has(previous.datasetId))) return candidate;

  // Retain extra human annotations (including geographic scope evidence).
  for (const [field, value] of Object.entries(previous)) {
    if (!(field in candidate)) candidate[field] = value;
  }
  for (const field of REVIEW_FIELDS) {
    if (previous[field] !== undefined) candidate[field] = previous[field];
  }
  return candidate;
}

export function retainMissingReviews(candidates, previous) {
  const seen = new Set(candidates.map(candidate => String(candidate.sourceId)));
  for (const old of previous.values()) {
    if (!seen.has(String(old.sourceId)) && (old.lastReviewedAt || !UNREVIEWED_STATUSES.has(old.status))) {
      candidates.push({ ...old, missingFromLatestDiscovery: true });
    }
  }
  return candidates;
}

export function identitySourceIds(places) {
  return new Set(places.flatMap(place => (place.sourceRecords ?? [])
    .filter(source => source.recordId && source.fields?.includes('name'))
    .map(source => source.recordId)));
}
