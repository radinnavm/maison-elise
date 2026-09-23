import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { createEmailProvider, emailProvider } = await import('../email/provider.js');

describe('email provider', () => {
  it('falls back to a logging provider when no API key is configured', async () => {
    const provider = createEmailProvider();

    assert.equal(provider.name, 'log');

    const result = await provider.send({
      to: 'camille@example.com',
      subject: 'Hi',
      html: '<p>Hi</p>',
    });

    assert.equal(result.provider, 'log');
    assert.equal(result.messageId, null);
  });

  it('exposes a default provider instance', () => {
    assert.ok(emailProvider.name.length > 0);
  });
});
