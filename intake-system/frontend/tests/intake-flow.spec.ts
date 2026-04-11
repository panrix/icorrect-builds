import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/customer/lookup**', async (route) => {
    const url = new URL(route.request().url());
    const email = url.searchParams.get('email');

    if (email === 'booked@example.com') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          found: true,
          mondayItems: [
            {
              id: 'booking-123',
              name: 'John Smith',
              device: 'iPhone 16',
              service: 'Screen repair',
              status: 'Booked',
              group: { id: 'new_group34198', title: 'Incoming Future' },
              bookingDate: '2026-04-08T10:30:00.000Z',
              intercomLink: null,
            },
          ],
          isReturningCustomer: true,
          previousRepairCount: 1,
          intercomLink: null,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: false,
        mondayItems: [],
        isReturningCustomer: false,
        previousRepairCount: 0,
        intercomLink: null,
      }),
    });
  });

  await page.route('**/api/intake', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'session-123',
        mondayItemId: 'item-123',
        mondaySyncStatus: 'synced',
        status: 'submitted',
      }),
    });
  });
});

test('welcome screen renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to iCorrect' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
});

test('appointment lookup path works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'I have an appointment' }).click();
  await page.getByLabel('Full name').fill('John Smith');
  await page.getByLabel('Email address').fill('booked@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByText('We found your booking')).toBeVisible();
  await expect(page.getByText('iPhone 16')).toBeVisible();
  await page.getByRole('button', { name: "Yes, that's right" }).click();
  await page.getByLabel('Arrival note').fill('Parking outside, will wait in reception.');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, John Smith' })).toBeVisible();
  await expect(page.getByText('A member of our team will be with you shortly. Please take a seat.')).toBeVisible();
});

test('appointment zero-match can switch to walk-in while preserving identity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'I have an appointment' }).click();
  await page.getByLabel('Full name').fill('Taylor Lane');
  await page.getByLabel('Email address').fill('nomatch@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByText("We couldn't find your booking")).toBeVisible();
  await page.getByRole('button', { name: 'Switch to walk-in' }).click();

  await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toHaveValue('Taylor Lane');
  await expect(page.getByLabel('Email address')).toHaveValue('nomatch@example.com');
  await expect(page.getByLabel('Phone number')).toHaveValue('');
});

test('collection path works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'Collect my device' }).click();
  await page.getByLabel('Full name').fill('Mina Shah');
  await page.getByLabel('Email address').fill('mina@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'iPad' }).click();
  await page.getByLabel('Collection question').fill('Please confirm whether the screen protector was refitted.');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, Mina Shah' })).toBeVisible();
  await expect(page.getByText('We’ll bring your ipad out shortly. Please wait at reception.')).toBeVisible();
});

test('walk-in happy path works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'Drop off for repair' }).click();
  await page.getByLabel('Full name').fill('John Smith');
  await page.getByLabel('Email address').fill('john@example.com');
  await page.getByLabel('Phone number').fill('07123456789');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'iPhone' }).click();
  await page.getByRole('button', { name: 'iPhone 16', exact: true }).click();
  await page.getByRole('button', { name: 'Screen' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, book in my repair' }).click();
  await page.getByTestId('question-repaired-before').getByRole('button', { name: 'No' }).click();
  await page.getByTestId('question-apple-seen').getByRole('button', { name: 'No' }).click();
  await page.getByTestId('question-data-backed-up').getByRole('button', { name: 'Yes' }).click();
  await page.getByTestId('question-passcode').getByLabel("I'll have my passcode ready for testing.").check();
  await page.getByTestId('question-delivery').getByRole('button', { name: "I'll collect" }).click();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, John Smith' })).toBeVisible();
  await expect(page.getByText('A member of our team will be with you shortly. Please take a seat.')).toBeVisible();
});

test('walk-in decline path works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'Drop off for repair' }).click();
  await page.getByLabel('Full name').fill('Taylor Lane');
  await page.getByLabel('Email address').fill('taylor@example.com');
  await page.getByLabel('Phone number').fill('07123456789');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'iPhone' }).click();
  await page.getByRole('button', { name: 'iPhone 16', exact: true }).click();
  await page.getByRole('button', { name: 'Screen' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.getByRole('button', { name: 'Email the quote' }).click();
  await page.getByLabel('Any reason you’d prefer not to drop off today?').fill('Need to come back after work.');
  await page.getByRole('button', { name: 'Submit quote request' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, Taylor Lane' })).toBeVisible();
  await expect(page.getByText('Please hand the iPad back to reception.')).toBeVisible();
});

test('enquiry path works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('button', { name: 'I have a question' }).click();
  await page.getByLabel('Full name').fill('Chris Long');
  await page.getByLabel('Email address').fill('chris@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'iPhone' }).click();
  await page.getByRole('button', { name: 'Battery' }).click();
  await page.getByLabel('Describe the issue').fill('Wanted to ask about turnaround before booking.');
  await page.getByRole('button', { name: 'Submit enquiry' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, Chris Long' })).toBeVisible();
  await expect(page.getByText('A member of our team will help you shortly. Please wait at reception.')).toBeVisible();
});
