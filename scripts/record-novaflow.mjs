import { chromium } from 'playwright';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath =
  process.argv[2] ||
  'C:\\Users\\lenvoo\\Desktop\\fake websites\\nova flow\\index.html';

const outputDir = path.resolve('recordings');
const framesDir = path.join(outputDir, 'novaflow-frames');
const outputPath = path.join(outputDir, 'novaflow-scroll.webm');
const viewport = { width: 430, height: 932 };
const fps = 60;
const scrollSeconds = 28;
const holdTopFrames = 45;
const holdBottomFrames = 60;
const scrollFrames = fps * scrollSeconds;
const totalFrames = holdTopFrames + scrollFrames + holdBottomFrames;
const deviceScaleFactor = 2;
const frameSettleMs = 16;

const findFfmpeg = async () => {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  const wingetPackages = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'Microsoft',
    'WinGet',
    'Packages'
  );

  try {
    const packages = await readdir(wingetPackages, { withFileTypes: true });
    const ffmpegPackage = packages.find((entry) =>
      entry.isDirectory() && entry.name.toLowerCase().includes('gyan.ffmpeg')
    );

    if (ffmpegPackage) {
      const packagePath = path.join(wingetPackages, ffmpegPackage.name);
      const builds = await readdir(packagePath, { withFileTypes: true });
      const build = builds.find((entry) =>
        entry.isDirectory() && entry.name.toLowerCase().includes('ffmpeg')
      );
      const ffmpegPath = build
        ? path.join(packagePath, build.name, 'bin', 'ffmpeg.exe')
        : '';

      if (ffmpegPath && existsSync(ffmpegPath)) {
        return ffmpegPath;
      }
    }
  } catch {
    // Fall back to PATH below.
  }

  return 'ffmpeg';
};

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });

await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true
});

const context = await browser.newContext({
  viewport,
  deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'no-preference'
});

const page = await context.newPage();
await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'networkidle' });
await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.waitForTimeout(500);

const maxScroll = await page.evaluate(() => {
  const scroller = document.scrollingElement || document.documentElement;

  return Math.max(0, scroller.scrollHeight - window.innerHeight);
});

for (let frame = 0; frame < totalFrames; frame += 1) {
  const scrollFrame = Math.min(Math.max(frame - holdTopFrames, 0), scrollFrames);
  const progress = scrollFrame / scrollFrames;
  const scrollY = maxScroll * progress;
  const filename = `frame-${String(frame + 1).padStart(5, '0')}.png`;

  await page.evaluate((y) => {
    const scroller = document.scrollingElement || document.documentElement;
    window.scrollTo(0, y);
    scroller.scrollTop = y;
    window.dispatchEvent(new Event('scroll'));
  }, scrollY);
  await page.waitForTimeout(frameSettleMs);

  await page.screenshot({
    path: path.join(framesDir, filename),
    type: 'png'
  });

  if ((frame + 1) % fps === 0 || frame + 1 === totalFrames) {
    console.log(`Captured ${frame + 1}/${totalFrames} frames`);
  }
}

await browser.close();

await run(await findFfmpeg(), [
  '-y',
  '-framerate',
  String(fps),
  '-i',
  path.join(framesDir, 'frame-%05d.png'),
  '-vf',
  'scale=860:1864:flags=lanczos,format=yuv420p',
  '-c:v',
  'libvpx-vp9',
  '-b:v',
  '0',
  '-crf',
  '24',
  '-deadline',
  'good',
  '-cpu-used',
  '2',
  '-row-mt',
  '1',
  outputPath
]);

console.log(`Saved ${outputPath}`);
