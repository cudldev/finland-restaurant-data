import { readFile } from 'node:fs/promises';

const REVIEW_FIELDS = ['status', 'operationStatus', 'datasetId', 'lastReviewedAt', 'reviewNote'];
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
  if (!previous) return candidate;
  if (alreadyKnown) {
    candidate.status = 'already_in_dataset_or_same_address';
    return candidate;
  }

  const reviewed = previous.lastReviewedAt || !UNREVIEWED_STATUSES.has(previous.status);
  if (!reviewed) return candidate;
  if (previous.status === 'added_to_dataset'
      && (!previous.datasetId || !datasetIds.has(previous.datasetId))) return candidate;

  for (const field of REVIEW_FIELDS) {
    if (previous[field] !== undefined) candidate[field] = previous[field];
  }
  return candidate;
}
