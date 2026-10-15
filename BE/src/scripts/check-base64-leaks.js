/**
 * Read-only audit: warn if any document in ANY collection still contains a Base64 image
 * (a string starting with "data:image/", at any nesting depth, including design layers).
 *
 * Usage (from BE/):  node src/scripts/check-base64-leaks.js
 * Exit code: 0 = clean, 1 = leaks found.
 */
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');

const PREFIX = 'data:image/';
const MAX_REPORTED_PATHS_PER_DOC = 5;

/** Recursively collect the paths of string values that are Base64 images. */
const findLeaks = (value, currentPath, found) => {
  if (typeof value === 'string') {
    if (value.startsWith(PREFIX)) found.push({ path: currentPath, bytes: value.length });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findLeaks(item, `${currentPath}[${index}]`, found));
    return;
  }
  if (value && typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId) && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    for (const [key, child] of Object.entries(value)) findLeaks(child, currentPath ? `${currentPath}.${key}` : key, found);
  }
};

const formatSize = (chars) => (chars > 1024 * 1024 ? `${(chars / 1024 / 1024).toFixed(2)} MB` : `${(chars / 1024).toFixed(1)} KB`);

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();

  console.log(`[check] Scanning ${collections.length} collection(s): ${collections.join(', ')}\n`);
  let totalDocs = 0;
  let totalBytes = 0;
  const summary = [];

  for (const name of collections) {
    let scanned = 0;
    let leakingDocs = 0;
    let leakingBytes = 0;
    const cursor = db.collection(name).find({});
    for await (const doc of cursor) {
      scanned += 1;
      const found = [];
      findLeaks(doc, '', found);
      if (!found.length) continue;
      leakingDocs += 1;
      const bytes = found.reduce((sum, item) => sum + item.bytes, 0);
      leakingBytes += bytes;
      const shown = found.slice(0, MAX_REPORTED_PATHS_PER_DOC).map((item) => `${item.path} (${formatSize(item.bytes)})`).join(', ');
      const more = found.length > MAX_REPORTED_PATHS_PER_DOC ? ` … +${found.length - MAX_REPORTED_PATHS_PER_DOC} more` : '';
      console.warn(`⚠️  [${name}] _id=${doc._id} -> ${shown}${more}`);
    }
    totalDocs += leakingDocs;
    totalBytes += leakingBytes;
    summary.push({ collection: name, scanned, leakingDocs, size: leakingDocs ? formatSize(leakingBytes) : '-' });
  }

  console.log('\n[check] ───────────── Summary ─────────────');
  console.table(summary);
  if (totalDocs) {
    console.warn(`[check] ❌ Found Base64 images in ${totalDocs} document(s), ~${formatSize(totalBytes)} in total.`);
    process.exitCode = 1;
  } else {
    console.log('[check] ✅ No Base64 image found in any collection.');
  }
};

run()
  .catch((error) => { console.error('[check] Fatal error:', error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); process.exit(process.exitCode || 0); });
