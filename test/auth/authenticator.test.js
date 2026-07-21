import test from 'node:test';
import assert from 'node:assert/strict';
import Authenticator from '../../src/auth/authenticator.js';

test('loads the public key from the local .env file', () => {
  const authenticator = new Authenticator();
  const publicKey = authenticator.getCertificate();

  assert.ok(publicKey, 'public key should be loaded from the environment');
  assert.match(publicKey, /BEGIN CERTIFICATE/, 'public key should contain a certificate header');
});
