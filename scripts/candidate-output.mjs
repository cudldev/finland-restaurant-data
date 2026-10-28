import { mkdir, readFile, writeFile, rename, realpath, lstat, copyFile } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function assertCandidateOutput(root, output) {
  const local = resolve(root, '.local');
  const path = resolve(output);
  const inside = relative(local, path);
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw Error('Candidate output must stay inside .local; curated data and tracked files cannot be discovery outputs.');
  await mkdir(local, { recursive: true });
  const actualLocal = await realpath(local);
  let parent = dirname(path);
  while (true) {
    try {
      const actual = await realpath(parent);
      const rel = relative(actualLocal, actual);
      if (rel.startsWith('..') || isAbsolute(rel)) throw Error('Candidate output follows a link outside .local.');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      parent = dirname(parent);
    }
  }
  try {
    if ((await lstat(path)).isSymbolicLink()) throw Error('Candidate output cannot be a symbolic link.');
    const previous = JSON.parse(await readFile(path, 'utf8'));
    if (previous.schema !== 1 || !Array.isArray(previous.candidates)) throw Error('Refusing to replace a file that is not a candidate report.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

export async function writeCandidateReport(root, output, report) {
  await assertCandidateOutput(root, output);
  await mkdir(dirname(output), { recursive: true });
  // Preserve the full previous report, including review evidence, before replacement.
  try { await copyFile(output, output + '.backup-' + randomUUID()); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = output + '.tmp-' + randomUUID();
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  try { await rename(temporary, output); }
  catch (error) {
    if (!['EPERM', 'EEXIST'].includes(error.code)) throw error;
    // Windows may refuse replacement of an existing file. Move it aside and
    // restore it if installing the new report fails; never discard review data.
    const displaced = output + '.backup-' + randomUUID();
    await rename(output, displaced);
    try { await rename(temporary, output); }
    catch (installError) { await rename(displaced, output); throw installError; }
  }
}
