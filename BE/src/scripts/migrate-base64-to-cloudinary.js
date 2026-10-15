/**
 * One-off cleanup: convert legacy Base64 images to Cloudinary URLs and remove duplicate library entries.
 *
 * Usage (from BE/):
 *   node src/scripts/migrate-base64-to-cloudinary.js --dry-run   # report only, no writes
 *   node src/scripts/migrate-base64-to-cloudinary.js             # real run
 *
 * Steps:
 *   1. Design:        previewImage / customImage        Base64 -> Cloudinary URL
 *   2. UploadedImage: url / thumbnailUrl                Base64 -> Cloudinary URL
 *   3. UploadedImage: remove duplicates (keep newest). Removed docs are backed up to
 *      BE/src/scripts/backup/ as JSON before deletion.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');
const Design = require('../models/Design');
const UploadedImage = require('../models/UploadedImage');
const { uploadImage } = require('../utils/cloudinary');

const DRY_RUN = process.argv.includes('--dry-run');
const BASE64_REGEX = '^data:image/';
const isBase64 = (value) => typeof value === 'string' && value.startsWith('data:image/');
const toThumbnail = (url) => (url && url.includes('/upload/') ? url.replace('/upload/', '/upload/w_320,h_320,c_fill,q_auto,f_auto/') : url);
const tag = DRY_RUN ? '[migrate:DRY-RUN]' : '[migrate]';
const log = (...args) => console.log(tag, ...args);

const stats = { designs: 0, designImages: 0, library: 0, libraryImages: 0, failed: 0, duplicatesFound: 0, duplicatesRemoved: 0 };

/** Upload a Base64 string once; reuse the URL when the same string appears in several fields. */
const makeUploader = (folder) => {
  const cache = new Map();
  return async (value) => {
    if (cache.has(value)) return cache.get(value);
    const url = DRY_RUN ? 'https://dry-run.invalid/image' : (await uploadImage(value, folder)).url;
    cache.set(value, url);
    return url;
  };
};

// ── Step 1: Design ──────────────────────────────────────────────────────────
const migrateDesigns = async () => {
  const fields = ['previewImage', 'customImage'];
  const filter = { $or: fields.map((f) => ({ [f]: { $regex: BASE64_REGEX } })) };
  const total = await Design.countDocuments(filter);
  log(`Design: ${total} document(s) contain Base64`);

  const cursor = Design.find(filter).lean().cursor();
  for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
    try {
      const upload = makeUploader('altera/designs/generated');
      const $set = {};
      for (const field of fields) {
        if (!isBase64(doc[field])) continue;
        $set[field] = await upload(doc[field]);
        stats.designImages += 1;
      }
      if (Object.keys($set).length) {
        if (!DRY_RUN) await Design.updateOne({ _id: doc._id }, { $set });
        stats.designs += 1;
        log(`Design OK ${doc._id} (${stats.designs}/${total})`);
      }
    } catch (error) {
      stats.failed += 1;
      console.error(`${tag} Design FAILED ${doc._id}: ${error.message || error}`);
    }
  }
};

// ── Step 2: UploadedImage ───────────────────────────────────────────────────
const migrateLibrary = async () => {
  const filter = { $or: [{ url: { $regex: BASE64_REGEX } }, { thumbnailUrl: { $regex: BASE64_REGEX } }] };
  const total = await UploadedImage.countDocuments(filter);
  log(`UploadedImage: ${total} document(s) contain Base64`);

  const cursor = UploadedImage.find(filter).lean().cursor();
  for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
    try {
      const upload = makeUploader(doc.source === 'AI' ? 'altera/designs/generated' : 'altera/designs/uploads');
      const $set = {};
      let finalUrl = doc.url;

      if (isBase64(doc.url)) {
        finalUrl = await upload(doc.url);
        $set.url = finalUrl;
        stats.libraryImages += 1;
      }
      if (isBase64(doc.thumbnailUrl)) {
        // If url was Base64 we already have the Cloudinary URL; otherwise upload the thumbnail itself
        // only when the url cannot be used to derive it.
        $set.thumbnailUrl = isBase64(finalUrl) ? await upload(doc.thumbnailUrl) : toThumbnail(finalUrl);
        if (isBase64(finalUrl)) stats.libraryImages += 1;
      }
      if (Object.keys($set).length) {
        if (!DRY_RUN) await UploadedImage.updateOne({ _id: doc._id }, { $set });
        stats.library += 1;
        log(`UploadedImage OK ${doc._id} (${stats.library}/${total})`);
      }
    } catch (error) {
      stats.failed += 1;
      console.error(`${tag} UploadedImage FAILED ${doc._id}: ${error.message || error}`);
    }
  }
};

// ── Step 3: remove duplicate UploadedImage ──────────────────────────────────
const dedupeLibrary = async () => {
  // Only light fields are loaded: Base64 has already been converted above.
  const docs = await UploadedImage.find({}, 'userId designId prompt source url createdAt').sort({ createdAt: -1 }).lean();
  const groups = new Map();
  const add = (key, doc) => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(doc); };

  for (const doc of docs) {
    const uid = String(doc.userId);
    if (doc.designId) add(`design:${uid}:${doc.designId}`, doc);
    else if (doc.source === 'AI' && doc.prompt && doc.prompt.trim()) add(`prompt:${uid}:${doc.prompt.trim()}`, doc);
    else if (doc.url && !isBase64(doc.url)) add(`url:${uid}:${doc.url}`, doc); // identical file in a user's library
  }

  const toDelete = new Map(); // _id string -> doc
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    // list is already sorted newest-first: keep list[0], drop the rest.
    const [keep, ...extra] = list;
    log(`Duplicate group "${key.slice(0, 80)}": keep ${keep._id}, remove ${extra.map((d) => d._id).join(', ')}`);
    extra.forEach((d) => toDelete.set(String(d._id), d));
  }
  stats.duplicatesFound = toDelete.size;
  log(`UploadedImage: ${toDelete.size} duplicate document(s) to remove`);
  if (!toDelete.size || DRY_RUN) return;

  const backupDir = path.join(__dirname, 'backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `uploadedimage-duplicates-${Date.now()}.json`);
  const full = await UploadedImage.find({ _id: { $in: [...toDelete.keys()] } }).lean();
  fs.writeFileSync(backupFile, JSON.stringify(full, null, 2));
  log(`Backup of removed documents written to ${backupFile}`);

  const res = await UploadedImage.deleteMany({ _id: { $in: [...toDelete.keys()] } });
  stats.duplicatesRemoved = res.deletedCount || 0;
};

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  log(`MongoDB connected${DRY_RUN ? ' (no data will be modified)' : ''}`);
  await migrateDesigns();
  await migrateLibrary();
  await dedupeLibrary();
  log('───────────── Summary ─────────────');
  log(`Design converted          : ${stats.designs} doc(s), ${stats.designImages} image(s)`);
  log(`UploadedImage converted   : ${stats.library} doc(s), ${stats.libraryImages} image(s) uploaded`);
  log(`Duplicates found/removed  : ${stats.duplicatesFound} / ${stats.duplicatesRemoved}`);
  log(`Failed                    : ${stats.failed}`);
};

run()
  .catch((error) => { console.error(`${tag} Fatal error:`, error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); process.exit(process.exitCode || 0); });
