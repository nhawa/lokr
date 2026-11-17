import { expect, test } from '@playwright/test';

test('pipeline, search, sorting, form and stage updates use one dataset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'assert') errors.push(m.text()); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Overview');
  await expect(page.locator('#dashboard-applications tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Offer: 0 applications' }).click();
  await expect(page.getByText('No applications match this filter.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filter' }).click();
  await page.getByLabel('Search role or company').fill('Infrastructure');
  await expect(page.locator('#dashboard-applications tbody tr')).toHaveCount(1);
  await page.getByLabel('Search role or company').fill('');
  await page.getByLabel('Application order', { exact: true }).selectOption('oldest');
  await expect(page.locator('tbody tr').first()).toContainText('Process Room');
  await page.getByRole('link', { name: 'Add job', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Role', { exact: true }).fill('API Engineer');
  await page.getByLabel('Company', { exact: true }).fill('Integration Room');
  await page.getByLabel('Job description', { exact: true }).fill('Design internal service APIs.');
  await page.getByRole('button', { name: 'Save job' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr').first()).toContainText('Integration Room');
  await page.goto('/#/lamaran/A01');
  await page.getByLabel('New application stage').selectOption('applied');
  await page.getByRole('button', { name: 'Save stage' }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved: 3 applications' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('add job starts with a URL and keeps AI retrieval explicitly optional', async ({ page }) => {
  await page.goto('/#/lowongan');
  await page.getByRole('link', { name: 'Add job', exact: true }).click();
  const url = page.getByLabel('Job URL');
  const role = page.getByLabel('Role', { exact: true });
  await expect(url).toBeVisible();
  expect(await url.evaluate((input, roleInput) => Boolean(input.compareDocumentPosition(roleInput) & Node.DOCUMENT_POSITION_FOLLOWING), await role.elementHandle())).toBe(true);
  await expect(page.getByRole('button', { name: 'Fetch job details with AI' })).toBeDisabled();
  const fetchAction = page.getByRole('button', { name: 'Fetch job details with AI' });
  const guidance = page.getByText('Optional. Connect an AI provider in Settings before Lokr can fetch or structure a job description.');
  await expect(guidance).toBeVisible();
  const actionBox = await fetchAction.boundingBox(), guidanceBox = await guidance.boundingBox();
  expect(guidanceBox?.y).toBeGreaterThanOrEqual((actionBox?.y || 0) + (actionBox?.height || 0));
});

test('views, document review, notes and keyboard dismissal', async ({ page }) => {
  await page.goto('/#/cv/CV02');
  await page.getByRole('button', { name: 'Mark as reviewed' }).click();
  await expect(page.getByText('Reviewed', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('#dashboard-tasks .meta')).toHaveText('2 tasks');
  await page.goto('/#/wawancara/A05');
  await page.getByLabel('Preparation notes').fill('Ask about service observability.');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByRole('status')).toContainText('Practice notes saved.');
  for (const [route, title] of [['cv', 'My CVs'], ['lowongan', 'Jobs'], ['lamaran', 'Applications'], ['wawancara', 'Interview prep'], ['pengaturan', 'Settings']]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(title);
  }
  await page.goto('/');
  await page.getByRole('link', { name: 'Add job', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('CV detail keeps a file-first Markdown editor and readable live preview', async ({ page }) => {
  await page.goto('/#/cv/CV02');
  await expect(page.getByRole('heading', { level: 1, name: 'CV editor' })).toBeVisible();
  await expect(page.locator('#cv-editor')).toContainText('Markdown editor');
  const source = page.getByLabel('CV source (Markdown)');
  await source.fill('# Candidate\n\n## Summary\n\nReviewed **source** summary.\n\n- Verified note');
  await expect(page.locator('#cv-preview').getByRole('heading', { level: 1, name: 'Candidate' })).toBeVisible();
  await expect(page.locator('#cv-preview')).toContainText('Reviewed source summary.');
  await expect(page.locator('#cv-preview').getByRole('listitem')).toHaveText('Verified note');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('CV changes saved locally.');
});

test('review tailored CV previews the approved version and uses the PDF export action', async ({ page }) => {
  await page.goto('/#/jobs/J01/flow/review');
  await expect(page.getByRole('heading', { level: 1, name: 'Review tailored CV' })).toBeVisible();
  await expect(page.locator('#flow-preview .resume-document')).toBeVisible();
  await expect(page.locator('#flow-export')).toContainText('US Letter');
  await expect(page.getByRole('button', { name: 'Export PDF' })).toBeEnabled();
});

test('interview application titles retain usable reading width', async ({ page }) => {
  await page.goto('/#/interviews');
  const firstApplication = page.locator('#interview-applications .item-list .list-item').first();
  await expect(firstApplication).toBeVisible();
  const title = firstApplication.locator('b');
  const box = await title.boundingBox();
  expect(box?.width).toBeGreaterThan(200);
});

test('CV manager exposes review state and the selected document action', async ({ page }) => {
  await page.goto('/#/cv');
  await page.getByRole('button', { name: /Backend CV v2/i }).click();
  const selected = page.locator('#cv-selection');
  await expect(selected).toContainText('CV02');
  await expect(selected).toContainText('Needs review');
  await page.getByRole('button', { name: 'Mark as reviewed' }).click();
  await expect(selected).toContainText('Reviewed');
  await expect(selected.getByRole('link', { name: 'Open document' })).toHaveAttribute('href', '#/cv/CV02');
});

test('selected and adjacent hovered list items retain separate visual states', async ({ page }) => {
  await page.goto('/#/cv');
  const items = page.locator('#cv-documents .list-item');
  await items.nth(0).click();
  await items.nth(1).hover();
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true');
  const [selected, hovered] = await Promise.all([items.nth(0), items.nth(1)].map(item => item.evaluate(element => {
    const style = getComputedStyle(element);
    return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle, radius: style.borderTopLeftRadius };
  })));
  expect(selected.boxShadow).not.toBe('none');
  expect(hovered.boxShadow).not.toBe('none');
  expect(hovered.outlineStyle).toBe('none');
  expect(selected.radius).toBe(hovered.radius);
});

test('interview preparation keeps selected and adjacent hovered applications separated', async ({ page }) => {
  await page.goto('/#/interviews');
  const items = page.locator('#interview-applications .list-item');
  await items.nth(0).click();
  await items.nth(1).hover();
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true');
  const [selectedBox, hoveredBox] = await Promise.all([items.nth(0).boundingBox(), items.nth(1).boundingBox()]);
  expect(hoveredBox?.y).toBeGreaterThanOrEqual((selectedBox?.y || 0) + (selectedBox?.height || 0) + 4);
  await expect(items.nth(1)).toHaveCSS('outline-style', 'none');
});

test('AI settings disclose unavailable secure configuration without collecting secrets', async ({ page }) => {
  await page.goto('/#/pengaturan');
  await expect(page.getByText('Configuration is unavailable in this browser-only demo. Secrets are never entered or kept in this browser.')).toBeVisible();
  await expect(page.getByText('No data is sent until you explicitly run an AI task.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Configure provider' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Test connection' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Configure runner' })).toBeDisabled();
});

test('jobs separates unavailable discovery from saved jobs and keeps local notes', async ({ page }) => {
  await page.goto('/#/jobs');
  const saved = page.locator('#jobs-list');
  await expect(saved).toContainText('3 saved');
  await expect(saved.locator('.item-list .list-item')).toHaveCount(3);
  await expect(saved.locator('.item-list .list-item svg')).toHaveCount(0);
  await page.getByRole('tab', { name: /Search jobs/i }).click();
  await expect(page.locator('#job-search-unavailable')).toContainText('Job search is not available yet');
  await expect(page.locator('#job-search-unavailable').getByRole('link', { name: 'Add job' })).toBeVisible();
  await page.goto('/#/jobs/J02');
  await expect(page.getByRole('link', { name: 'Analyze job match' })).toHaveAttribute('href', '#/jobs/J02/match');
  await page.getByLabel('Notes about this job').fill('Ask about on-call rotation.');
  await page.getByRole('button', { name: 'Save notes' }).click();
  await expect(page.getByRole('status')).toContainText('Job notes saved locally.');
});

test('dashboard and saved jobs share the same list item DOM contract', async ({ page }) => {
  await page.goto('/');
  const recentItem = page.locator('#dashboard-recent-applications .list-item').first();
  await expect(recentItem).toBeVisible();
  const recentClasses = await recentItem.locator(':scope > span').evaluateAll(items => items.map(item => item.className));
  await page.getByRole('link', { name: 'Jobs', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Jobs' })).toBeVisible();
  const savedItem = page.locator('#jobs-list .list-item').first();
  await expect(savedItem).toBeVisible();
  const savedClasses = await savedItem.locator(':scope > span').evaluateAll(items => items.map(item => item.className));
  expect(savedClasses).toEqual(recentClasses);
});

test('applications use an expandable grouped list instead of a horizontal board', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/applications');
  const grouped = page.getByRole('region', { name: /applications grouped by stage/i });
  await expect(grouped).toBeVisible();
  await expect(page.getByRole('button', { name: /collapse interview applications, 2 total/i })).toBeVisible();
  await expect(grouped.locator('.grouped-application-card:visible')).toHaveCount(2);
  const firstCard = grouped.locator('.grouped-application-card:visible').first();
  const titleBox = await firstCard.locator('.identity b').boundingBox(), companyBox = await firstCard.locator('.identity small').boundingBox(), cardBox = await firstCard.boundingBox();
  expect(companyBox?.y).toBeGreaterThan((titleBox?.y || 0) + (titleBox?.height || 0));
  expect(cardBox?.height).toBeLessThanOrEqual(82);
  await page.getByRole('button', { name: /expand applied applications, 3 total/i }).click();
  await expect(grouped.locator('.grouped-application-card:visible')).toHaveCount(3);
  expect(await grouped.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('uploads reject disguised content and keep real files unparsed', async ({ page }) => {
  await page.goto('/#/cv/unggah');
  await expect(page.getByText('Drop a CV here', { exact: true })).toBeVisible();
  await page.getByLabel('CV file').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>bad</html>') });
  await expect(page.getByText('cv.pdf', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Choose this file' }).click();
  await expect(page.locator('.form-error')).toContainText('file signature');
  await page.getByLabel('CV file').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n') });
  await page.getByRole('button', { name: 'Choose this file' }).click();
  await expect(page.locator('#document-detail')).toContainText('Text has not been extracted');
});

test('empty, loading and block error states retain their frames', async ({ page }) => {
  await page.goto('/?fixture=empty');
  await expect(page.getByText('No saved jobs yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saved: 0 applications' })).toBeVisible();
  await page.goto('/?fixture=loading&block=applications');
  await expect(page.locator('#dashboard-applications .skeleton')).toHaveCount(5);
  await page.goto('/?fixture=error&block=applications');
  await expect(page.locator('#dashboard-applications')).toContainText('Data could not be loaded.');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#dashboard-applications tbody tr')).toHaveCount(5);
});

test('fonts, responsive geometry, hit targets and reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; });
  const fonts = await page.evaluate(() => ({ check: document.fonts.check('400 14px Geist') && document.fonts.check('500 14px Geist'), loaded: [...document.fonts].some(f => f.family.replaceAll('"', '') === 'Geist' && f.status === 'loaded') }));
  expect(fonts.check && fonts.loaded).toBe(true);
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const undersized = await page.locator('button,a,input,select,textarea').evaluateAll(elements => elements.filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && (r.width < 43.9 || r.height < 43.9); }).map(el => el.outerHTML.slice(0,120)));
    expect(undersized).toEqual([]);
    await page.screenshot({ path: `test-results/dashboard-${width}.png`, fullPage: true });
  }
  await page.getByLabel('Open menu').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Open menu')).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Saved: 3 applications' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  expect(await page.getByRole('button', { name: 'Saved: 3 applications' }).getAttribute('aria-pressed')).toBe('true');
});
