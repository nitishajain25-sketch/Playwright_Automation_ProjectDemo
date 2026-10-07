import { test, expect } from '@playwright/test';

const BOOKING_URL = 'https://restful-booker.herokuapp.com/booking';

async function getExistingBooking(request) {
  const listResponse = await request.get(BOOKING_URL);
  expect(listResponse.status()).toBe(200);
  const bookings = await listResponse.json();
  expect(bookings.length).toBeGreaterThan(0);

  const bookingId = bookings[0].bookingid;
  const response = await request.get(`${BOOKING_URL}/${bookingId}`);
  expect(response.status()).toBe(200);

  return { bookingId, response };
}

test.describe('GET /booking/:id - Restful Booker', () => {
  test('P1 - returns HTTP 200 for an existing booking ID', async ({ request }) => {
    const { response } = await getExistingBooking(request);

    await expect(response).toBeOK();
  });

  test('P2 - returns booking details as JSON', async ({ request }) => {
    const { response } = await getExistingBooking(request);

    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('P3 - returns all expected booking fields', async ({ request }) => {
    const { response } = await getExistingBooking(request);
    const booking = await response.json();

    expect(booking).toEqual(expect.objectContaining({
      firstname: expect.any(String),
      lastname: expect.any(String),
      totalprice: expect.any(Number),
      depositpaid: expect.any(Boolean),
      bookingdates: expect.objectContaining({
        checkin: expect.any(String),
        checkout: expect.any(String),
      }),
    }));
  });

  test('P4 - returns booking dates in YYYY-MM-DD format', async ({ request }) => {
    const { response } = await getExistingBooking(request);
    const booking = await response.json();

    expect(booking.bookingdates.checkin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(booking.bookingdates.checkout).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('P5 - returns valid values for price and guest names', async ({ request }) => {
    const { response } = await getExistingBooking(request);
    const booking = await response.json();

    expect(booking.firstname.trim().length).toBeGreaterThan(0);
    expect(booking.lastname.trim().length).toBeGreaterThan(0);
    expect(booking.totalprice).toBeGreaterThanOrEqual(0);
  });

  test('N1 - returns 404 for a nonexistent booking ID', async ({ request }) => {
    const response = await request.get(`${BOOKING_URL}/999999999`);

    expect(response.status()).toBe(404);
  });

  test('N2 - returns 404 for booking ID zero', async ({ request }) => {
    const response = await request.get(`${BOOKING_URL}/0`);

    expect(response.status()).toBe(404);
  });

  test('N3 - returns 404 for a negative booking ID', async ({ request }) => {
    const response = await request.get(`${BOOKING_URL}/-1`);

    expect(response.status()).toBe(404);
  });

  test('N4 - returns 404 for a non-numeric booking ID', async ({ request }) => {
    const response = await request.get(`${BOOKING_URL}/not-a-number`);

    expect(response.status()).toBe(404);
  });

  test('N5 - returns 404 for an ID with an invalid numeric format', async ({ request }) => {
    const response = await request.get(`${BOOKING_URL}/999999999999999999999999999`);

    expect(response.status()).toBe(404);
  });
});