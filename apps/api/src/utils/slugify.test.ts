import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { slugify } from './slugify.js';

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    assert.equal(slugify('Aurelia Satin Dress'), 'aurelia-satin-dress');
  });

  it('strips accents', () => {
    assert.equal(slugify('Noémie Silk Blouse'), 'noemie-silk-blouse');
    assert.equal(slugify('Amélie Knit Dress'), 'amelie-knit-dress');
  });

  it('collapses whitespace and trims separators', () => {
    assert.equal(slugify('  Wide   Leg  '), 'wide-leg');
    assert.equal(slugify('--Edge--'), 'edge');
  });
});
