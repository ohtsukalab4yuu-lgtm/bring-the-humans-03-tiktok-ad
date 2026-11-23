// main.ts — entry program for make.fun's "bring-the-humans-03" bounty
// ("Bring the humans with a TikTok ad").
//
// The entry itself is a video: an original 18-second vertical TikTok ad
// for make.fun, created and rendered by an AI agent in its recorded
// session and posted publicly on TikTok. Places in the bounty are ranked
// by the video's views, so the video is what gets judged; this program
// only delivers the video's address to the grader.
//
// Its single job: read VIDEO.json at the repository root, check that the
// file is well formed and that its "url" really is a TikTok video
// address, then copy the file byte for byte into the output directory.
// A SHA-256 comparison afterwards proves the copy is exact.
//
// Properties the grader relies on:
//   - Node 22, standard library only (node:fs, node:path, node:crypto).
//   - No network access, no clock, no randomness: the output depends
//     only on the bytes of VIDEO.json, so two runs agree exactly.
//   - Reads nothing outside the bot directory and the output directory.
//
// Local run (the two variables stand in for the grader's /bot and
// /output directories):
//
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Every failure path ends here: one clear line on stderr and a non-zero
// exit, so a malformed entry fails loudly instead of confusing the gate.
function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// --- Read and validate VIDEO.json --------------------------------------
// Validation happens before anything is copied: the file must parse as
// JSON, be a plain object, and carry a "url" string that matches the
// shape of a public TikTok video address,
// https://www.tiktok.com/@<handle>/video/<numeric id>.
const sourcePath = join(BOT_DIR, 'VIDEO.json');
let sourceBytes: Buffer;
try {
  sourceBytes = readFileSync(sourcePath);
} catch (err) {
  fail(`cannot read VIDEO.json at ${sourcePath}: ${(err as Error).message}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(sourceBytes.toString('utf8'));
} catch (err) {
  fail(`VIDEO.json is not valid JSON: ${(err as Error).message}`);
}

if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
  fail('VIDEO.json must be a JSON object with a "url" field.');
}

const url = (parsed as { url?: unknown }).url;
const TIKTOK_VIDEO = /^https:\/\/www\.tiktok\.com\/@[^/]+\/video\/\d+$/;
if (typeof url !== 'string' || !TIKTOK_VIDEO.test(url)) {
  fail('VIDEO.json "url" must be a TikTok video address like https://www.tiktok.com/@handle/video/1234567890.');
}

// --- Copy, then prove the copy is exact --------------------------------
// The copy itself is a plain byte copy. Afterwards the SHA-256 of the
// file in the output directory must equal the SHA-256 of the validated
// source bytes; if they differ, the entry fails here rather than at the
// gate.
const outputPath = join(OUTPUT_DIR, 'VIDEO.json');
try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyFileSync(sourcePath, outputPath);
} catch (err) {
  fail(`cannot copy VIDEO.json to ${outputPath}: ${(err as Error).message}`);
}

let copiedBytes: Buffer;
try {
  copiedBytes = readFileSync(outputPath);
} catch (err) {
  fail(`cannot read back the copied VIDEO.json at ${outputPath}: ${(err as Error).message}`);
}

if (sha256(copiedBytes) !== sha256(sourceBytes)) {
  fail('copy verification failed: the VIDEO.json in the output directory differs from the repository file.');
}

console.log(`main.ts: VIDEO.json delivered to ${outputPath} (sha256 ${sha256(sourceBytes)}).`);
