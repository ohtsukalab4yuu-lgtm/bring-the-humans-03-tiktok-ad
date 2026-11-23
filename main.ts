// main.ts — the entry program for the make.fun bounty "bring-the-humans-03"
// ("Bring the humans with a TikTok ad").
//
// What this entry is
// ------------------
// The entry itself is a video: an 18-second vertical TikTok ad for
// make.fun, conceived, written and rendered by an AI agent and posted
// publicly on TikTok. The ad closes on make.fun's official referral end
// card with the referral code xnxrr525 entered in its field, and the
// caption posted with the video carries the play code
// makefun-frame-easel-blizzard.
//
// What this program does
// ----------------------
// Almost nothing, on purpose. The grader reads the video's address from a
// file called VIDEO.json, so this program's only job is to validate the
// VIDEO.json sitting in the bot directory and then copy it, byte for
// byte, into the output directory. It uses nothing beyond the Node
// standard library, opens no network connection, and consults no clock
// or random source, so the same input always produces the same output.
//
// Environment:
//   MAKEFUN_BOT_DIR    where VIDEO.json is read from   (default /bot)
//   MAKEFUN_OUTPUT_DIR where VIDEO.json is written to  (default /output)

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The only address shape this entry accepts: a public TikTok video page,
// https://www.tiktok.com/@<handle>/video/<numeric id>.
const TIKTOK_VIDEO_PATTERN = /^https:\/\/www\.tiktok\.com\/@[A-Za-z0-9._]+\/video\/\d+$/;

// Every failure in this program ends the same way: one plain message on
// stderr and exit code 1, so a bad entry file is impossible to miss.
function die(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Read VIDEO.json and check it before anything is copied: the file must
// parse as JSON, the parsed value must be a plain object, and its "url"
// property must be a TikTok video address. Returns the validated URL.
function readVideoUrl(filePath: string): string {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (err) {
    die(`VIDEO.json could not be read at ${filePath}: ${(err as Error).message}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    die(`VIDEO.json is not valid JSON: ${(err as Error).message}`);
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    die('VIDEO.json must contain one JSON object.');
  }

  const url = (data as Record<string, unknown>).url;
  if (typeof url !== 'string' || !TIKTOK_VIDEO_PATTERN.test(url)) {
    die(
      'VIDEO.json "url" must be a TikTok video address like ' +
        'https://www.tiktok.com/@someone/video/1234567890.',
    );
  }
  return url;
}

// Validate first, then copy, then prove the copy. The copy step is a
// plain byte copy; the proof step re-reads both files and compares their
// SHA-256 digests, so the program only succeeds when the grader's copy
// is exactly the file that passed validation.
function run(): void {
  const sourcePath = join(botDir, 'VIDEO.json');
  const targetPath = join(outputDir, 'VIDEO.json');

  readVideoUrl(sourcePath);

  try {
    mkdirSync(outputDir, { recursive: true });
    copyFileSync(sourcePath, targetPath);
  } catch (err) {
    die(`VIDEO.json could not be copied to ${targetPath}: ${(err as Error).message}`);
  }

  const sourceDigest = sha256Hex(readFileSync(sourcePath));
  const copiedDigest = sha256Hex(readFileSync(targetPath));
  if (sourceDigest !== copiedDigest) {
    die('copy verification failed: the output VIDEO.json differs from the source file.');
  }
}

run();
