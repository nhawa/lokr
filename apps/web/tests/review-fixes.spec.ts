import { expect, test } from '@playwright/test';

test('edited CV requires saving and a new review', async ({ page }) => {
  await page.goto('/#/cv/CV01');
  await page.getByLabel('CV source (Markdown)').fill('# Candidate\n\n## Summary\nUpdated text');
  await expect(page.locator('#cv-preview')).toContainText('Needs review');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#cv-preview')).toContainText('Needs review');
  await page.getByRole('button', { name: 'Mark as reviewed' }).click();
  await expect(page.locator('#cv-preview')).toContainText('Reviewed');
  await page.getByLabel('CV source (Markdown)').fill('# Candidate\n\n## Summary\nAnother edit');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByLabel('CV source (Markdown)').fill('# Candidate\n\n## Summary\nUnsaved edit');
  await expect(page.getByRole('button', { name: 'Mark as reviewed' })).toBeDisabled();
});

test('interview controls reflect selection and require a focus area', async ({ page }) => {
  await page.goto('/#/interviews');
  const cv = page.getByLabel('CV for interview preparation');
  await cv.selectOption('CV02');
  await expect(cv).toHaveValue('CV02');
  await page.getByLabel('Execution').uncheck();
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeDisabled();
  await page.getByLabel('Behavioural').check();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.getByRole('heading', { name: 'Interview practice' })).toBeVisible();
});

test('a dropped file can be validated and added to the session', async ({ page }) => {
  await page.goto('/#/cv/upload');
  const files = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['%PDF-1.7\n'], 'sample.pdf', { type: 'application/pdf' }));
    return transfer;
  });
  await page.locator('.upload-dropzone').dispatchEvent('drop', { dataTransfer: files });
  await expect(page.getByText('sample.pdf', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Choose this file' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'CV editor' })).toBeVisible();
});
