import test from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../src/handler/handler.js';

test('login creates a token when credentials are valid', () => {
  const authenticator = {
    verifyUserCredentials() {
      return { user_id: 'user-1', role: 'admin' };
    },
    createTokenPayload(user_id, username, role) {
      return { user_id, username, role };
    },
    generateToken(payload) {
      return `token:${payload.user_id}`;
    }
  };

  const handler = new Handler({}, {}, {}, authenticator);
  const req = {
    body: { username: 'Misty', password: 'Rainforest' }
  };

  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  handler.login(req, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { token: 'token:user-1' });
});
