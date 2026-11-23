import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('academy lesson progress safely recovers invalid localStorage data', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const match = html.match(/function loadLearnedLessons\(\)\{[\s\S]*?\nlet learned=loadLearnedLessons\(\);/);
  assert.ok(match, 'lesson progress loader should be present');
  const source = match[0].replace(/\nlet learned=loadLearnedLessons\(\);$/, '');
  const load = (raw, throws = false) => {
    const context = { localStorage: { getItem() { if (throws) throw new Error('storage blocked'); return raw; } } };
    vm.runInNewContext(source + '\nthis.loadLearnedLessons=loadLearnedLessons;', context);
    return context.loadLearnedLessons();
  };

  assert.equal(JSON.stringify(load('{broken')), '[]');
  assert.equal(JSON.stringify(load('{"not":"an array"}')), '[]');
  assert.equal(JSON.stringify(load('[1,1,2,0,10,"3",null]')), '[1,2,10]');
  assert.equal(JSON.stringify(load(null, true)), '[]');
});
