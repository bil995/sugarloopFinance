#!/usr/bin/env node
/**
 * Full backup: every MongoDB collection (as Extended JSON, so ObjectIds and dates survive)
 * plus the uploads folder, zipped. Keeps the newest KEEP archives.
 * Usage:  npm run backup --prefix server
 * Output: ~/backups/sugarloop/sugarloop-YYYY-MM-DD_HH-MM-SS.zip
 * Restore with scripts/restore.js.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const { MongoClient, BSON: { EJSON } } = mongoose.mongo;
const BACKUP_DIR = path.join(os.homedir(), 'backups', 'sugarloop');
const UPLOADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const KEEP = 30;

export const dbNameFromUri = (uri) =>
  new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'https://')).pathname.slice(1) || 'test';

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();

  const dbName = dbNameFromUri(uri);
  const db = client.db(dbName);
  const collections = await db.listCollections({ type: 'collection' }).toArray();

  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const tmpDir = path.join(os.tmpdir(), `sugarloop-backup-${ts}`);
  fs.mkdirSync(path.join(tmpDir, 'db'), { recursive: true });

  console.log(`Backing up database "${dbName}" — ${collections.length} collections`);

  let total = 0;
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(tmpDir, 'db', `${name}.json`), EJSON.stringify(docs, { relaxed: false }));
    total += docs.length;
    console.log(`  ${name}: ${docs.length} documents`);
  }
  await client.close();

  if (fs.existsSync(UPLOADS_DIR)) {
    fs.cpSync(UPLOADS_DIR, path.join(tmpDir, 'uploads'), { recursive: true });
    console.log(`  uploads: ${fs.readdirSync(UPLOADS_DIR).length} files`);
  }
  fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({ dbName, createdAt: new Date(), documents: total }, null, 2));

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const zipPath = path.join(BACKUP_DIR, `sugarloop-${ts}.zip`);
  execSync(`zip -qr "${zipPath}" .`, { cwd: tmpDir, stdio: 'inherit' });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nBackup saved: ${zipPath}`);

  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('sugarloop-') && f.endsWith('.zip'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);

  for (const { f } of files.slice(0, Math.max(0, files.length - KEEP))) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`Rotated out: ${f}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((err) => { console.error(err.message); process.exit(1); });
}
