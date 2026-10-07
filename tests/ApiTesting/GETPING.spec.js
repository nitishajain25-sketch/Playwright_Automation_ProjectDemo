import { test, expect } from '@playwright/test';

const PING_URL = 'https://restful-booker.herokuapp.com/ping';

test.describe('GET /ping - Restful Booker health check', () => {
  test('P1 - returns HTTP 201 for a health check request', async ({ request }) => {
    const response = await request.get(PING_URL);

    expect(response.status()).toBe(201);
    await expect(response).toBeOK();
  });

  test('P2 - returns the Created health-check response', async ({ request }) => {
    const response = await request.get(PING_URL);

    expect(await response.text()).toBe('Created');
  });

  test('P3 - returns a non-empty response body', async ({ request }) => {
    const response = await request.get(PING_URL);

    expect((await response.text()).trim().length).toBeGreaterThan(0);
  });

  test('P4 - responds successfully to repeated health check requests', async ({ request }) => {
    const firstResponse = await request.get(PING_URL);
    const secondResponse = await request.get(PING_URL);

    expect(firstResponse.status()).toBe(201);
    expect(secondResponse.status()).toBe(201);
  });

  test('P5 - remains healthy when a harmless query parameter is provided', async ({ request }) => {
    const response = await request.get(PING_URL, {
      params: { source: 'playwright-test' },
    });

    expect(response.status()).toBe(201);
    expect(await response.text()).toBe('Created');
  });

  test('N1 - rejects POST on the GET-only health check endpoint', async ({ request }) => {
    const response = await request.post(PING_URL);

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('N2 - rejects PUT on the health check endpoint', async ({ request }) => {
    const response = await request.put(PING_URL);

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('N3 - rejects PATCH on the health check endpoint', async ({ request }) => {
    const response = await request.patch(PING_URL);

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('N4 - rejects DELETE on the health check endpoint', async ({ request }) => {
    const response = await request.delete(PING_URL);

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('N5 - returns not found for an invalid ping path', async ({ request }) => {
    const response = await request.get(`${PING_URL}/invalid`);

    expect(response.status()).toBe(404);
  });
});