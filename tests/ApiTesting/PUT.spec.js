import { test, expect } from '@playwright/test';

const API_BASE = 'https://restful-booker.herokuapp.com';
const AUTH_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};

function bookingPayload(overrides = {}) {
  return {
    firstname: 'James',
    lastname: 'Brown',
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: '2018-01-01',
      checkout: '2019-01-01',
    },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

async function createBookingAndToken(request) {
  const [bookingResponse, authResponse] = await Promise.all([
    request.post(`${API_BASE}/booking`, { data: bookingPayload() }),
    request.post(`${API_BASE}/auth`, { data: AUTH_CREDENTIALS }),
  ]);

  expect(bookingResponse.status()).toBe(200);
  const booking = await bookingResponse.json();
  expect(booking.bookingid).toEqual(expect.any(Number));

  expect(authResponse.status()).toBe(200);
  const auth = await authResponse.json();
  expect(auth.token).toEqual(expect.any(String));
  expect(auth.token.length).toBeGreaterThan(0);

  return { bookingId: booking.bookingid, token: auth.token };
}

async function putBooking(request, bookingId, token, data, extraHeaders = {}) {
  return request.put(`${API_BASE}/booking/${bookingId}`, {
    data,
    headers: {
      Accept: 'application/json',
      ...(token ? { Cookie: `token=${token}` } : {}),
      ...extraHeaders,
    },
  });
}

function expectInvalidBookingIdStatus(status) {
  expect([404, 405]).toContain(status);
}

test.describe('PUT /booking/:id - Restful Booker', () => {
  test('P1 - updates an existing booking and returns HTTP 200', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const updatedBooking = bookingPayload();

    const response = await putBooking(request, bookingId, token, updatedBooking);

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
  });

  test('P2 - returns the updated booking details in the response', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const updatedBooking = bookingPayload({ firstname: 'UpdatedFirstName' });

    const response = await putBooking(request, bookingId, token, updatedBooking);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject(updatedBooking);
  });

  test('P3 - persists the updated booking when retrieved by ID', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const updatedBooking = bookingPayload({
      firstname: 'PersistedFirstName',
      lastname: 'PersistedLastName',
      totalprice: 250,
    });

    const updateResponse = await putBooking(request, bookingId, token, updatedBooking);
    expect(updateResponse.status()).toBe(200);

    const getResponse = await request.get(`${API_BASE}/booking/${bookingId}`);
    expect(getResponse.status()).toBe(200);
    expect(await getResponse.json()).toMatchObject(updatedBooking);
  });

  test('P4 - updates all booking fields including additional needs', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const updatedBooking = bookingPayload({
      firstname: 'Alex',
      lastname: 'Morgan',
      totalprice: 375,
      depositpaid: false,
      bookingdates: {
        checkin: '2025-06-10',
        checkout: '2025-06-15',
      },
      additionalneeds: 'Airport pickup',
    });

    const response = await putBooking(request, bookingId, token, updatedBooking);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(updatedBooking);
  });

  test('P5 - repeating the same PUT update returns the same booking data', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const updatedBooking = bookingPayload({ firstname: 'IdempotentUpdate' });

    const firstResponse = await putBooking(request, bookingId, token, updatedBooking);
    const secondResponse = await putBooking(request, bookingId, token, updatedBooking);

    expect(firstResponse.status()).toBe(200);
    expect(secondResponse.status()).toBe(200);
    expect(await secondResponse.json()).toMatchObject(updatedBooking);
  });

  test('N1 - rejects a PUT request without an authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);

    const response = await putBooking(request, bookingId, undefined, bookingPayload());

    expect(response.status()).toBe(403);
  });

  test('N2 - rejects a PUT request with an invalid authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);

    const response = await putBooking(request, bookingId, 'invalid-token', bookingPayload());

    expect(response.status()).toBe(403);
  });

  test('N3 - rejects an update for a nonexistent booking ID', async ({ request }) => {
    const { token } = await createBookingAndToken(request);

    const response = await putBooking(request, 999999999, token, bookingPayload());

    expectInvalidBookingIdStatus(response.status());
  });

  test('N4 - rejects an update when the booking ID is not numeric', async ({ request }) => {
    const { token } = await createBookingAndToken(request);

    const response = await putBooking(request, 'not-a-number', token, bookingPayload());

    expectInvalidBookingIdStatus(response.status());
  });

  test('N5 - rejects an update when the booking ID is zero', async ({ request }) => {
    const { token } = await createBookingAndToken(request);

    const response = await putBooking(request, 0, token, bookingPayload());

    expectInvalidBookingIdStatus(response.status());
  });
});