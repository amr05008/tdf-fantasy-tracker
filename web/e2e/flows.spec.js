import { test, expect } from '@playwright/test'

test('full navigation flow across all screens and sub-screens', async ({ page }) => {
  await page.goto('/')

  // Standings default; leader visible
  await expect(page.getByText('Tour de France 2026').first()).toBeVisible()
  await expect(page.getByText('Yellow Jersey', { exact: true })).toBeVisible()

  // Stage tab
  await page.getByText('Stage', { exact: true }).click()
  await expect(page.getByText('Pau → Luchon-Superbagnères')).toBeVisible()

  // Team tab -> default Aaron -> open draft
  await page.getByText('Team', { exact: true }).click()
  await expect(page.getByText('Edit your picks')).toBeVisible()
  await page.getByText('Edit your picks').click()
  await expect(page.getByText('Edit your three riders')).toBeVisible()

  // Draft: add a third rider, confirm Save team, go back
  await page.getByRole('button', { name: 'add Egan Bernal' }).click()
  await expect(page.getByText('Save team')).toBeVisible()
  await page.getByText('Save team').click()
  await expect(page.getByText('Edit your picks')).toBeVisible()

  // Open a rider profile from the team screen
  await page.getByText('Tadej Pogačar').first().click()
  await expect(page.getByText('Drafted by Aaron (you)')).toBeVisible()
  await page.getByText('Back').click()

  // Races tab -> switch to Giro -> accent swatch theme changes (pink dot present)
  await page.getByText('Races', { exact: true }).click()
  await expect(page.getByText('Choose competition')).toBeVisible()
  await page.getByText("Giro d'Italia 2026").click()
  await expect(page).toHaveURL(/race=giro-2026/)
})
