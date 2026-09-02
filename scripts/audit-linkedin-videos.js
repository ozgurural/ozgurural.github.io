#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const cuts = require('./film-social-cuts.json');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'video');
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';
const failures = [];

function fail(film, message) {
  failures.push(`${film}: ${message}`);
}

function timestampSeconds(value) {
  const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(value);
  if (!match) return NaN;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function runFfmpeg(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { status: result.status, text: `${result.stdout || ''}\n${result.stderr || ''}` };
}

function inspectMedia(film, mp4, expectedDuration) {
  const decode = runFfmpeg(['-hide_banner', '-i', mp4, '-f', 'null', NULL_DEVICE]);
  if (decode.status !== 0) {
    fail(film, 'ffmpeg could not decode the complete file');
    return null;
  }

  const durationMatch = /Duration:\s+(\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(decode.text);
  const duration = durationMatch
    ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
    : NaN;
  if (!Number.isFinite(duration)) fail(film, 'duration was not readable');
  else if (Math.abs(duration - expectedDuration) > 0.08) {
    fail(film, `duration ${duration.toFixed(2)}s differs from expected ${expectedDuration.toFixed(2)}s`);
  }

  const video = /Video:\s+h264[^\n]*yuv420p\(tv, bt709, progressive\)[^\n]*1080x1350[^\n]*30 fps/.test(decode.text);
  if (!video) fail(film, 'video must be H.264, yuv420p BT.709 progressive, 1080x1350 at 30 fps');

  const audio = /Audio:\s+aac \(LC\)[^\n]*48000 Hz, stereo/.test(decode.text);
  if (!audio) fail(film, 'audio must be AAC-LC, 48 kHz stereo');

  const loudness = runFfmpeg([
    '-hide_banner', '-i', mp4, '-map', '0:a:0',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
    '-f', 'null', NULL_DEVICE,
  ]);
  if (loudness.status !== 0) {
    fail(film, 'loudness analysis failed');
    return { duration, loudness: NaN, peak: NaN };
  }
  const integratedMatch = /"input_i"\s*:\s*"(-?[\d.]+)"/.exec(loudness.text);
  const peakMatch = /"input_tp"\s*:\s*"(-?[\d.]+)"/.exec(loudness.text);
  const integrated = integratedMatch ? Number(integratedMatch[1]) : NaN;
  const peak = peakMatch ? Number(peakMatch[1]) : NaN;
  if (!Number.isFinite(integrated) || integrated < -19.5 || integrated > -14.0) {
    fail(film, `integrated loudness ${Number.isFinite(integrated) ? integrated.toFixed(1) : 'unknown'} LUFS is outside -19.5 to -14.0`);
  }
  if (!Number.isFinite(peak) || peak > -0.5) {
    fail(film, `true peak ${Number.isFinite(peak) ? peak.toFixed(1) : 'unknown'} dBTP is too high`);
  }
  return { duration, loudness: integrated, peak };
}

function inspectSrt(film, srtPath, expectedDuration) {
  const text = fs.readFileSync(srtPath, 'utf8').replace(/\r\n/g, '\n').trim();
  if (text.includes('—')) fail(film, 'SRT contains a visitor-visible em dash');
  const blocks = text.split(/\n{2,}/);
  let previousEnd = 0;
  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    if (Number(lines[0]) !== index + 1) fail(film, `SRT cue ${index + 1} has the wrong sequence number`);
    const timing = /^(\S+) --> (\S+)$/.exec(lines[1] || '');
    if (!timing) {
      fail(film, `SRT cue ${index + 1} has invalid timing`);
      return;
    }
    const start = timestampSeconds(timing[1]);
    const end = timestampSeconds(timing[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      fail(film, `SRT cue ${index + 1} has a non-positive duration`);
    }
    if (start + 0.002 < previousEnd) fail(film, `SRT cue ${index + 1} overlaps the previous cue`);
    if (!lines.slice(2).join(' ').trim()) fail(film, `SRT cue ${index + 1} is empty`);
    previousEnd = end;
  });
  if (previousEnd > expectedDuration + 0.01) fail(film, 'SRT extends beyond the video');
  return blocks.length;
}

for (const [film, cut] of Object.entries(cuts)) {
  const stem = `${film}-linkedin-1080x1350`;
  const mp4 = path.join(OUT, `${stem}.mp4`);
  const srt = path.join(OUT, `${stem}.srt`);
  const copy = path.join(OUT, `${stem}.txt`);
  const expectedDuration = cut.to - cut.from;

  for (const file of [mp4, srt, copy]) {
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail(film, `missing or empty ${path.basename(file)}`);
  }
  if (![mp4, srt, copy].every(file => fs.existsSync(file) && fs.statSync(file).size > 0)) continue;

  const media = inspectMedia(film, mp4, expectedDuration);
  const cues = inspectSrt(film, srt, expectedDuration);
  const post = fs.readFileSync(copy, 'utf8');
  const sourceUrl = `https://ozgurural.github.io/lab/${film}/`;
  if (!post.includes(sourceUrl)) fail(film, `post copy is missing ${sourceUrl}`);
  if (!post.includes(path.basename(mp4)) || !post.includes(path.basename(srt))) {
    fail(film, 'post copy does not name both upload files');
  }
  if (post.includes('—')) fail(film, 'post copy contains an em dash');

  if (media) {
    console.log(
      `${film.padEnd(25)} ${media.duration.toFixed(2)}s  ${cues} cues  ` +
      `${media.loudness.toFixed(1)} LUFS  ${media.peak.toFixed(1)} dBTP`
    );
  }
}

if (failures.length) {
  console.error(`\n${failures.length} LinkedIn media audit failure(s):`);
  failures.forEach(message => console.error(`  - ${message}`));
  process.exit(1);
}

console.log(`\nAudited ${Object.keys(cuts).length} LinkedIn videos: media, loudness, captions, and share copy are clean.`);
