import { test, expect } from '@playwright/test';

const BOOKING_URL = 'https://restful-booker.herokuapp.com/booking';
const NO_MATCH_FIRST_NAME = 'NoMatchFirstName_9f3a7c';
const NO_MATCH_LAST_NAME = 'NoMatchLastName_9f3a7c';

test.describe('GET /booking - Restful Booker', () => {
  test('P1 - returns HTTP 200 for the booking collection', async ({ request }) => {
    const response = await request.get(BOOKING_URL);

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
  });

  test('P2 - returns the booking collection as JSON', async ({ request }) => {
    const response = await request.get(BOOKING_URL);

    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('P3 - returns an array of booking records', async ({ request }) => {
    const response = await request.get(BOOKING_URL);
    const bookings = await response.json();

    expect(Array.isArray(bookings)).toBe(true);
  });

  test('P4 - booking collection entries have positive integer booking IDs', async ({ request }) => {
    const response = await request.get(BOOKING_URL);
    const bookings = await response.json();

    expect(bookings.length).toBeGreaterThan(0);
    for (const booking of bookings) {
      expect(booking).toHaveProperty('bookingid');
      expect(Number.isInteger(booking.bookingid)).toBe(true);
      expect(booking.bookingid).toBeGreaterThan(0);
    }
  });

  test('P5 - filters bookings by the first and last name of an existing booking', async ({ request }) => {
    const collectionResponse = await request.get(BOOKING_URL);
    const bookings = await collectionResponse.json();
    expect(bookings.length).toBeGreaterThan(0);

    const bookingId = bookings[0].bookingid;
    const detailResponse = await request.get(`${BOOKING_URL}/${bookingId}`);
    expect(detailResponse.status()).toBe(200);
    const details = await detailResponse.json();

    const filteredResponse = await request.get(BOOKING_URL, {
      params: {
        firstname: details.firstname,
        lastname: details.lastname,
      },
    });
    const filteredBookings = await filteredResponse.json();

    expect(filteredResponse.status()).toBe(200);
    expect(filteredBookings.some((booking) => booking.bookingid === bookingId)).toBe(true);
  });

  test('N1 - returns no results for a first name with no matching booking', async ({ request }) => {
    const response = await request.get(BOOKING_URL, {
      params: { firstname: NO_MATCH_FIRST_NAME },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test('N2 - returns no results for a last name with no matching booking', async ({ request }) => {
    const response = await request.get(BOOKING_URL, {
      params: { lastname: NO_MATCH_LAST_NAME },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test('N3 - returns no results when neither supplied name matches a booking', async ({ request }) => {
    const response = await request.get(BOOKING_URL, {
      params: {
        firstname: NO_MATCH_FIRST_NAME,
        lastname: NO_MATCH_LAST_NAME,
      },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test('N4 - returns no results for a check-in date far in the future', async ({ request }) => {
    const response = await request.get(BOOKING_URL, {
      params: {
        checkin: '2099-01-01',
        checkout: '2099-01-02',
      },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test('N5 - returns no results when a name filter and future date range cannot match', async ({ request }) => {
    const response = await request.get(BOOKING_URL, {
      params: {
        firstname: NO_MATCH_FIRST_NAME,
        checkin: '2099-01-01',
        checkout: '2099-01-02',
      },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});