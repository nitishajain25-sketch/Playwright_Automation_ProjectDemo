import { test, expect } from '@playwright/test';

const AUTH_URL = 'https://restful-booker.herokuapp.com/auth';
const VALID_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};

async function postAuth(request, credentials) {
  return request.post(AUTH_URL, {
    data: credentials,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function expectBadCredentials(response) {
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toEqual({ reason: 'Bad credentials' });
}

test.describe('POST /auth - Restful Booker', () => {
  test('P1 - authenticates with valid credentials and returns HTTP 200', async ({ request }) => {
    const response = await postAuth(request, VALID_CREDENTIALS);

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
  });

  test('P2 - returns a token property for valid credentials', async ({ request }) => {
    const response = await postAuth(request, VALID_CREDENTIALS);
    const body = await response.json();

    expect(body).toHaveProperty('token');
  });

  test('P3 - returns the token as a string', async ({ request }) => {
    const response = await postAuth(request, VALID_CREDENTIALS);
    const body = await response.json();

    expect(typeof body.token).toBe('string');
  });

  test('P4 - returns a non-empty token', async ({ request }) => {
    const response = await postAuth(request, VALID_CREDENTIALS);
    const body = await response.json();

    expect(body.token).toBeTruthy();
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('P5 - returns JSON content for valid authentication', async ({ request }) => {
    const response = await postAuth(request, VALID_CREDENTIALS);

    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('N1 - rejects an unknown username', async ({ request }) => {
    const response = await postAuth(request, {
      username: 'unknown-user',
      password: VALID_CREDENTIALS.password,
    });

    await expectBadCredentials(response);
  });

  test('N2 - rejects an incorrect password', async ({ request }) => {
    const response = await postAuth(request, {
      username: VALID_CREDENTIALS.username,
      password: 'incorrect-password',
    });

    await expectBadCredentials(response);
  });

  test('N3 - rejects an incorrect username and password', async ({ request }) => {
    const response = await postAuth(request, {
      username: 'unknown-user',
      password: 'incorrect-password',
    });

    await expectBadCredentials(response);
  });

  test('N4 - rejects a request with username omitted', async ({ request }) => {
    const response = await postAuth(request, {
      password: VALID_CREDENTIALS.password,
    });

    await expectBadCredentials(response);
  });

  test('N5 - rejects a request with password omitted', async ({ request }) => {
    const response = await postAuth(request, {
      username: VALID_CREDENTIALS.username,
    });

    await expectBadCredentials(response);
  });
});