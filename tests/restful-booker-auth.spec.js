import { test, expect } from '@playwright/test';

const AUTH_URL = 'https://restful-booker.herokuapp.com/auth';
const VALID_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};

async function authenticate(request, credentials) {
  return request.post(AUTH_URL, {
    data: credentials,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function expectBadCredentials(response) {
  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  const body = await response.json();
  expect(body).toHaveProperty('reason', 'Bad credentials');
}

test.describe('Restful Booker authentication API', () => {
  test('P1 - accepts valid credentials with HTTP 200', async ({ request }) => {
    const response = await authenticate(request, VALID_CREDENTIALS);

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
  });

  test('P2 - returns a token as a string for valid credentials', async ({ request }) => {
    const response = await authenticate(request, VALID_CREDENTIALS);
    const body = await response.json();

    expect(body.token).toEqual(expect.any(String));
  });

  test('P3 - returns a non-empty token for valid credentials', async ({ request }) => {
    const response = await authenticate(request, VALID_CREDENTIALS);
    const body = await response.json();

    expect(body.token).toBeTruthy();
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('P4 - returns JSON for a valid authentication request', async ({ request }) => {
    const response = await authenticate(request, VALID_CREDENTIALS);

    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('P5 - allows another authentication request with valid credentials', async ({ request }) => {
    const firstResponse = await authenticate(request, VALID_CREDENTIALS);
    const secondResponse = await authenticate(request, VALID_CREDENTIALS);
    const firstBody = await firstResponse.json();
    const secondBody = await secondResponse.json();

    expect(firstResponse.status()).toBe(200);
    expect(secondResponse.status()).toBe(200);
    expect(firstBody.token).toEqual(expect.any(String));
    expect(secondBody.token).toEqual(expect.any(String));
  });

  test('N1 - rejects an unknown username', async ({ request }) => {
    const response = await authenticate(request, {
      username: 'unknown-user',
      password: VALID_CREDENTIALS.password,
    });

    await expectBadCredentials(response);
  });

  test('N2 - rejects an incorrect password', async ({ request }) => {
    const response = await authenticate(request, {
      username: VALID_CREDENTIALS.username,
      password: 'wrong-password',
    });

    await expectBadCredentials(response);
  });

  test('N3 - rejects incorrect username and password', async ({ request }) => {
    const response = await authenticate(request, {
      username: 'unknown-user',
      password: 'wrong-password',
    });

    await expectBadCredentials(response);
  });

  test('N4 - rejects a request with the username omitted', async ({ request }) => {
    const response = await authenticate(request, {
      password: VALID_CREDENTIALS.password,
    });

    await expectBadCredentials(response);
  });

  test('N5 - rejects a request with the password omitted', async ({ request }) => {
    const response = await authenticate(request, {
      username: VALID_CREDENTIALS.username,
    });

    await expectBadCredentials(response);
  });
});
