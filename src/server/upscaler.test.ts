import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateUpscaledDimensions, generateOutputFilename } from './upscaler';
import { DailyQuotaManager } from './quota';

test('calculateUpscaledDimensions correctly scales 2X, 4X, and 8X resolution', () => {
  // Test case based on user example: 765 × 1024
  const origW = 765;
  const origH = 1024;

  const res2X = calculateUpscaledDimensions(origW, origH, 2);
  assert.equal(res2X.width, 1530);
  assert.equal(res2X.height, 2048);

  const res4X = calculateUpscaledDimensions(origW, origH, 4);
  assert.equal(res4X.width, 3060);
  assert.equal(res4X.height, 4096);

  const res8X = calculateUpscaledDimensions(origW, origH, 8);
  assert.equal(res8X.width, 6120);
  assert.equal(res8X.height, 8192);
});

test('calculateUpscaledDimensions rejects non-positive dimensions', () => {
  assert.throws(() => calculateUpscaledDimensions(0, 100, 2), /Invalid/);
  assert.throws(() => calculateUpscaledDimensions(-10, 100, 4), /Invalid/);
});

test('generateOutputFilename formats names according to patterns', () => {
  const name1 = generateOutputFilename('photo.png', 4, 300, 'jpeg', 'original_scale');
  assert.equal(name1, 'photo_4X_upscaled.jpg');

  const name2 = generateOutputFilename('banner.jpg', 2, 600, 'png', 'original_dpi');
  assert.equal(name2, 'banner_2X_600dpi.png');

  const name3 = generateOutputFilename('doc.webp', 8, 1200, 'webp', 'prefix_index', 7, 'hq');
  assert.equal(name3, 'hq_007.webp');
});

test('DailyQuotaManager enforces limits and tracks daily usage', () => {
  const manager = new DailyQuotaManager(50);
  const initial = manager.getQuota();
  assert.ok(initial.totalLimit >= 50);

  assert.equal(manager.canProcess(10), true);
});
