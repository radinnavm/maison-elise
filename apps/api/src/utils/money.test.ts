import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toMinorUnits } from './money.js';

describe('toMinorUnits', () => {
  it('converts major units to the smallest currency unit', () => {
    assert.equal(toMinorUnits(189), 18900);
    assert.equal(toMinorUnits(100.5), 10050);
    assert.equal(toMinorUnits(0), 0);
  });

  it('rounds to the nearest cent and avoids float drift', () => {
    assert.equal(toMinorUnits(10.005), 1001);
    assert.equal(toMinorUnits(0.1 + 0.2), 30);
  });
});
