import { test, expect } from '@playwright/test'

test('navigates real TDF 2025 data across all screens and the upcoming TDF 2026 notice', async ({ page }) => {
  await page.goto('/')

  // Default lands on the completed TDF 2025 with real standings.
  await expect(page).toHaveURL(/race=tdf-2025/)
  await expect(page.getByText('Tour de France 2025').first()).toBeVisible()
  await expect(page.getByText('228:59:22')).toBeVisible() // Aaron's winning total
  await expect(page.getByText('Yellow Jersey', { exact: true })).toBeVisible()

  // Stage tab: real stage-21 header + winner.
  await page.getByText('Stage', { exact: true }).click()
  await expect(page.getByText('Mantes-la-Ville → Paris (Champs-Élysées)')).toBeVisible()
  await expect(page.getByText('Wout van Aert')).toBeVisible()

  // Team tab: real team count + rider, then open a rider profile.
  await page.getByText('Team', { exact: true }).click()
  await expect(page.getByText('1st of 5 overall · 3 riders')).toBeVisible()
  await expect(page.getByText('Edit your picks')).toBeVisible()
  await page.getByText('Florian Lipowitz').click()
  await expect(page.getByText('Drafted by Aaron (you)')).toBeVisible()
  await page.getByText('Back').click()

  // Races tab: friendly dates; TDF 2026 marked Upcoming.
  await page.getByText('Races', { exact: true }).click()
  await expect(page.getByText('Choose competition')).toBeVisible()
  await expect(page.getByText('Jul 5 – 27, 2025 · 21 stages')).toBeVisible()
  await page.getByText('Tour de France 2026').click()
  await expect(page).toHaveURL(/race=tdf-2026/)

  // Selecting the not-yet-started race shows the Upcoming notice on the standings tab.
  await page.getByText('Standings', { exact: true }).click()
  await expect(page.getByText('Standings will appear once the race begins.')).toBeVisible()
})
