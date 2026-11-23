import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('mobile layout supports Telegram/iPhone narrow viewports and safe areas', () => {
  assert.match(html, /viewport-fit=cover/, 'viewport must expose iOS safe-area insets');
  assert.match(html, /@media\s*\(max-width:\s*480px\)/, 'narrow-screen rules must be present');
  assert.match(html, /env\(safe-area-inset-left\)/, 'left safe area must be respected');
  assert.match(html, /env\(safe-area-inset-right\)/, 'right safe area must be respected');
  assert.match(html, /grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'form grids must collapse on phones');
});

test('mobile form controls avoid iOS zoom and provide touch-sized targets', () => {
  assert.match(html, /input,\s*select,\s*button\s*\{\s*font-size:\s*16px/, '16px control text prevents focus zoom');
  assert.match(html, /button\s*\{\s*min-height:\s*44px/, 'buttons need a comfortable minimum tap height');
  assert.match(html, /input,\s*select\s*\{\s*min-height:\s*44px/, 'form controls need a comfortable minimum tap height');
  assert.match(html, /-webkit-overflow-scrolling:\s*touch/, 'tab strip must scroll smoothly in iOS WebView');
});
