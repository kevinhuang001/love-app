import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureDate, imageCaptureDate, videoCaptureDate } from '../src/capture-date.js';

test('broken metadata cannot invent a date or prevent uploading a photo', async () => {
  for (const value of [
    undefined,
    new Date(),
    '',
    '0000:00:00 00:00:00',
    '2025:02:29 12:00:00',
    '2024:02:29 24:00:00',
    '2024:02:29 12:60:00',
    '2024:02:29 12:00:60',
  ])
    assert.equal(captureDate(value), null);
  assert.equal(await imageCaptureDate(Buffer.from('Exif\0\0broken')), null);
  assert.equal(await imageCaptureDate(), null);
  assert.equal(videoCaptureDate({ creation_time: 'broken' }), null);
  assert.equal(videoCaptureDate({ creation_time: '1904-01-01T00:00:00Z' }), null);
  assert.equal(videoCaptureDate({ creation_time: '2026-02-14T00:00:00' }), null);
});

test('camera local dates stay local; UTC video timestamps use the application timezone', () => {
  assert.equal(captureDate('2024:02:29 23:59:58'), '2024-02-29');
  assert.equal(captureDate('2024-02-29T23:59:58-08:00'), '2024-02-29');
  assert.equal(
    videoCaptureDate({
      'com.apple.quicktime.creationdate': '2024-02-29T23:59:58-08:00',
      creation_time: '2024-03-01T07:59:58Z',
    }),
    '2024-02-29',
  );
  assert.equal(videoCaptureDate({}, { creation_time: '2024-02-29T16:05:00Z' }), '2024-03-01');
});
