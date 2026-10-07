import { test, expect } from '@playwright/test';

const API_BASE = 'https://restful-booker.herokuapp.com';
const AUTH_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};

function newBooking() {
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
  };
}

async function createBookingAndToken(request) {
  const [bookingResponse, authResponse] = await Promise.all([
    request.post(`${API_BASE}/booking`, { data: newBooking() }),
    request.post(`${API_BASE}/auth`, { data: AUTH_CREDENTIALS }),
  ]);

  expect(bookingResponse.status()).toBe(200);
  const created = await bookingResponse.json();
  expect(created.bookingid).toEqual(expect.any(Number));

  expect(authResponse.status()).toBe(200);
  const auth = await authResponse.json();
  expect(auth.token).toEqual(expect.any(String));
  expect(auth.token.length).toBeGreaterThan(0);

  return { bookingId: created.bookingid, token: auth.token };
}

async function patchBooking(request, bookingId, token, data) {
  return request.patch(`${API_BASE}/booking/${bookingId}`, {
    data,
    headers: {
      Accept: 'application/json',
      ...(token ? { Cookie: `token=${token}` } : {}),
    },
  });
}

function expectInvalidBookingIdStatus(status) {
  expect([404, 405]).toContain(status);
}

test.describe('PATCH /booking/:id - Restful Booker', () => {
  test('P1 - updates only the first name', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, token, {
      firstname: 'UpdatedFirstName',
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.firstname).toBe('UpdatedFirstName');
    expect(body.lastname).toBe('Brown');
  });

  test('P2 - updates only the last name', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, token, {
      lastname: 'UpdatedLastName',
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.lastname).toBe('UpdatedLastName');
    expect(body.firstname).toBe('James');
  });

  test('P3 - updates both first and last names', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, token, {
      firstname: 'Alex',
      lastname: 'Morgan',
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({ firstname: 'Alex', lastname: 'Morgan' });
  });

  test('P4 - preserves other booking fields when names are partially updated', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const beforeResponse = await request.get(`${API_BASE}/booking/${bookingId}`);
    expect(beforeResponse.status()).toBe(200);
    const before = await beforeResponse.json();

    const patchResponse = await patchBooking(request, bookingId, token, {
      firstname: 'PartialUpdate',
    });
    expect(patchResponse.status()).toBe(200);

    const afterResponse = await request.get(`${API_BASE}/booking/${bookingId}`);
    expect(afterResponse.status()).toBe(200);
    const after = await afterResponse.json();

    expect(after.firstname).toBe('PartialUpdate');
    expect(after.lastname).toBe(before.lastname);
    expect(after.totalprice).toBe(before.totalprice);
    expect(after.depositpaid).toBe(before.depositpaid);
    expect(after.bookingdates).toEqual(before.bookingdates);
    expect(after.additionalneeds).toBe(before.additionalneeds);
  });

  test('P5 - returns the updated booking as JSON', async ({ request }) => {
    const { bookingId, token } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, token, {
      firstname: 'JsonResponse',
      lastname: 'Verified',
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    expect(await response.json()).toMatchObject({
      firstname: 'JsonResponse',
      lastname: 'Verified',
    });
  });

  test('N1 - rejects a partial update without an authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, undefined, {
      firstname: 'Unauthorized',
    });

    expect(response.status()).toBe(403);
  });

  test('N2 - rejects a partial update with an invalid authentication token', async ({ request }) => {
    const { bookingId } = await createBookingAndToken(request);
    const response = await patchBooking(request, bookingId, 'invalid-token', {
      firstname: 'Unauthorized',
    });

    expect(response.status()).toBe(403);
  });

  test('N3 - rejects an update for a nonexistent booking ID', async ({ request }) => {
    const { token } = await createBookingAndToken(request);
    const response = await patchBooking(request, 999999999, token, {
      firstname: 'MissingBooking',
    });

    expectInvalidBookingIdStatus(response.status());
  });

  test('N4 - rejects an update when the booking ID is not numeric', async ({ request }) => {
    const { token } = await createBookingAndToken(request);
    const response = await patchBooking(request, 'not-a-number', token, {
      firstname: 'InvalidId',
    });

    expectInvalidBookingIdStatus(response.status());
  });

  test('N5 - rejects an update when the booking ID is zero', async ({ request }) => {
    const { token } = await createBookingAndToken(request);
    const response = await patchBooking(request, 0, token, {
      firstname: 'InvalidId',
    });

    expectInvalidBookingIdStatus(response.status());
  });
});