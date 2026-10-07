import { test, expect } from '@playwright/test';

const API_BASE = 'https://restful-booker.herokuapp.com';
const AUTH_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};

const BOOKING = {
  firstname: 'Delete',
  lastname: 'Test',
  totalprice: 125,
  depositpaid: true,
  bookingdates: {
    checkin: '2025-02-01',
    checkout: '2025-02-05',
  },
  additionalneeds: 'Breakfast',
};

async function createBookingAndToken(request) {
  const [bookingResponse, authResponse] = await Promise.all([
    request.post(`${API_BASE}/booking`, { data: BOOKING }),
    request.post(`${API_BASE}/auth`, { data: AUTH_CREDENTIALS }),
  ]);

  expect(bookingResponse.status()).toBe(200);
  const { bookingid } = await bookingResponse.json();
  expect(bookingid).toEqual(expect.any(Number));

  expect(authResponse.status()).toBe(200);
  const { token } = await authResponse.json();
  expect(token).toEqual(expect.any(String));
  expect(token.length).toBeGreaterThan(0);

  return { bookingId: bookingid, token };
}

async function deleteBooking(request, bookingId, token) {
  return request.delete(`${API_BASE}/booking/${bookingId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `token=${token}` } : {}),
    },
  });
}

test.describe('DELETE /booking/:id - Restful Booker', () => {
  test('P1 - deletes an existing booking and returns HTTP 201', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await deleteBooking(request, bookingId, token);

    expect(response.status()).toBe(201);
    await expect(response).toBeOK();
  });

  test('P2 - returns a success message after deleting a booking', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await deleteBooking(request, bookingId, token);

    expect(response.status()).toBe(201);
    expect(await response.text()).toMatch(/created/i);
  });

  test('P3 - deleted booking can no longer be retrieved', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const deleteResponse = await deleteBooking(request, bookingId, token);
    expect(deleteResponse.status()).toBe(201);

    const getResponse = await request.get(`${API_BASE}/booking/${bookingId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('P4 - deletes one booking without deleting a different booking', async ({ request }) => {
    const first = await createBookingAndToken(request);
    const second = await createBookingAndToken(request);

    const deleteResponse = await deleteBooking(request, first.bookingId, first.token);
    expect(deleteResponse.status()).toBe(201);

    const remainingResponse = await request.get(`${API_BASE}/booking/${second.bookingId}`);
    expect(remainingResponse.status()).toBe(200);
    expect(await remainingResponse.json()).toMatchObject(BOOKING);
  });

  test('P5 - can delete another booking using a valid token', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await deleteBooking(request, bookingId, token);

    expect(response.status()).toBe(201);
    expect((await request.get(`${API_BASE}/booking/${bookingId}`)).status()).toBe(404);
  });

  test('N1 - rejects deleting a booking without an authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);
    const response = await deleteBooking(request, bookingId);

    expect(response.status()).toBe(403);
  });

  test('N2 - rejects deleting a booking with an invalid authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);
    const response = await deleteBooking(request, bookingId, 'invalid-token');

    expect(response.status()).toBe(403);
  });

  test('N3 - rejects deleting a nonexistent booking ID', async ({ request }) => {
    const { token } = await createBookingAndToken(request);
    const response = await deleteBooking(request, 999999999, token);

    expect(response.status()).toBe(405);
  });

  test('N4 - rejects deleting a booking with a non-numeric ID', async ({ request }) => {
    const { token } = await createBookingAndToken(request);
    const response = await deleteBooking(request, 'not-a-number', token);

    expect(response.status()).toBe(405);
  });

  test('N5 - rejects deleting the same booking a second time', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const firstResponse = await deleteBooking(request, bookingId, token);
    expect(firstResponse.status()).toBe(201);

    const secondResponse = await deleteBooking(request, bookingId, token);
    expect(secondResponse.status()).toBe(405);
  });
});