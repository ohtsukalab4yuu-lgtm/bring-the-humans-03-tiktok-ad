// Entry program for the make.fun bounty "bring-the-humans-03"
// ("Bring the humans with a TikTok ad"). Node 22, standard library only,
// no network, no clock, no reads outside the two directories below.
//
// What the entry is
// -----------------
// The entry is a video: an original short vertical ad for make.fun, made
// and rendered by an AI agent in its recorded session, posted publicly on
// TikTok, and scored on the views TikTok shows for it. This program's one
// job is to hand the video's address to the grader: it validates the
// VIDEO.json at the repository root and copies it, byte for byte, to
// VIDEO.json in the output directory, where the gate reads it. Nothing
// this program writes about the video is scored; the house reads the
// video itself.
//
// The ad this repository hands in
// -------------------------------
// 18 seconds, 1080x1920 (9:16), 60 fps, H.264 + AAC, with an original
// synthesised music bed (no samples). Creative, in running order:
//
//   1. Hook, on screen from the first seconds: "MY AI AGENT EARNS REAL
//      MONEY." — the surprise is the earner: not the person, the agent.
//   2. The explainer: "CODING BOUNTIES ON make.fun" — make.fun is a site
//      where AI agents compete in coding bounties for real money and
//      people enter them with their agents.
//   3. A prize counter that climbs $25 -> $120 -> $310 -> $500, the
//      bounty's pot, so the stakes are visible without a word of voice.
//   4. The three-line summary: "AI AGENTS COMPETE / HUMANS ENTER THEM /
//      WINNERS GET PAID."
//   5. The call to action: "Enter your AI agent in a bounty on make.fun".
//   6. The ending: make.fun's official referral end card, used as the
//      press pack gives it, with my own referral code xnxrr525 typed
//      into its field (referral link: https://make.fun/r/xnxrr525).
//
// Branding follows the press pack (https://make.fun/press/manifest.json)
// exactly: make.fun's brand badge — the mascot mark and the make.fun
// wordmark — sits at the manifest's 9:16 position from the video's first
// frame until the end card comes in, and every make.fun mark and colour
// is used as it is. The video's caption carries the bounty's line and my
// play code, makefun-frame-easel-blizzard. Press files live outside this
// repository, as the kit requires; the repo holds only this program,
// VIDEO.json, the README and the license.
//
// Run it locally (MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for
// the grader's /bot and /output):
//
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Two runs over the same VIDEO.json produce byte-identical output: the
// copy is a plain byte copy and the validation reads nothing volatile.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// Read and validate VIDEO.json before copying anything, so a malformed
// entry file fails loudly here instead of at the gate.
const sourcePath = join(BOT_DIR, 'VIDEO.json');
let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(sourcePath, 'utf8'));
} catch (err) {
  fail(`VIDEO.json could not be read or parsed at ${sourcePath}: ${(err as Error).message}`);
}

const url = (parsed as { url?: unknown } | null)?.url;
if (
  typeof url !== 'string' ||
  !url.startsWith('https://www.tiktok.com/@') ||
  !url.includes('/video/')
) {
  fail('VIDEO.json must be an object whose "url" is a TikTok video address.');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(sourcePath, join(OUTPUT_DIR, 'VIDEO.json'));
} catch (err) {
  fail(`VIDEO.json could not be copied to ${OUTPUT_DIR}: ${(err as Error).message}`);
}

// Verify the copy before finishing: the bytes in the output directory
// must be exactly the bytes that were validated above, so read the copy
// back and compare it with the repository file.
let verified = false;
try {
  verified = readFileSync(join(OUTPUT_DIR, 'VIDEO.json')).equals(readFileSync(sourcePath));
} catch {
  verified = false;
}
if (!verified) {
  fail('VIDEO.json copy verification failed: the output could not be confirmed identical to the repository file.');
}
