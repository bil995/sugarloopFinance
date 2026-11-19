#!/usr/bin/env node
/**
 * Restores a backup made by scripts/backup.js. REPLACES the current data.
 * Usage:  node scripts/restore.js <backup.zip>                 (dry run: shows what would change)
 *         node scripts/restore.js <backup.zip> --confirm       (actually restores)
 *         add --db <name> to restore into a different database, e.g. to inspect it first.
 * Stop the API first (sudo -u ubuntu pm2 stop sugarloop-api) and start it again afterwards.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dbNameFromUri } from './backup.js';

const { MongoClient, BSON: { EJSON } } = mongoose.mongo;
const UPLOADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const args = process.argv.slice(2);
const zipPath = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--db');
const confirm = args.includes('--confirm');
const dbOverride = args.includes('--db') ? args[args.indexOf('--db') + 1] : null;

async function run() {
  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error('Usage: node scripts/restore.js <backup.zip> [--db <name>] [--confirm]');
    process.exit(1);
  }
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sugarloop-restore-'));
  execFileSync('unzip', ['-q', path.resolve(zipPath), '-d', tmpDir], { stdio: 'inherit' });

  // Older backups put collection files at the top level and used plain JSON.
  const dbDir = fs.existsSync(path.join(tmpDir, 'db')) ? path.join(tmpDir, 'db') : tmpDir;
  const files = fs.readdirSync(dbDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  const dbName = dbOverride || dbNameFromUri(uri);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`${confirm ? 'Restoring' : 'DRY RUN — would restore'} into database "${dbName}":`);
  for (const file of files) {
    const name = file.replace(/\.json$/, '');
    const docs = EJSON.parse(fs.readFileSync(path.join(dbDir, file), 'utf8'), { relaxed: false });
    const current = await db.collection(name).countDocuments();
    console.log(`  ${name}: ${current} now -> ${docs.length} from backup`);
    if (!confirm) continue;
    await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs, { ordered: false });
  }
  await client.close();

  const backupUploads = path.join(tmpDir, 'uploads');
  if (fs.existsSync(backupUploads)) {
    console.log(`  uploads: ${fs.readdirSync(backupUploads).length} files`);
    if (confirm) fs.cpSync(backupUploads, UPLOADS_DIR, { recursive: true });
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(confirm ? '\nRestore complete. Start the API again.' : '\nNothing changed. Re-run with --confirm to restore.');
}

run().catch((err) => { console.error(err.message); process.exit(1); });
