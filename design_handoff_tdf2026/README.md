# Handoff: Fantasy Grand Tours — TdF 2026 Redesign

## Overview
A redesign of the "Sunshine Fantasy" fantasy-cycling app for the Tour de France 2026. Six players each draft three pro riders for the whole tour; a team's score is the **sum of its three riders' GC (general classification) times**, and the **lowest total wins**. The app is checked during the race to see who's leading, how your own riders are doing, and what changed after each stage.

This is a redesign of an existing Streamlit/Python app — the goal is a cleaner, more minimal, mobile-and-desktop-friendly UI inspired by the Escape Collective Fantasy app (stage-focused, light, editorial-minimal). The existing scoring model (3 drafted riders, summed GC time) is **unchanged**.

## About the Design Files
The file in this bundle (`Standings.dc.html`) is a **design reference created in HTML** — a working prototype showing intended look and behavior, **not production code to copy directly**. It is authored in a small internal templating runtime (`<x-dc>` / `DCLogic`), which you should **not** reproduce.

Your task is to **recreate these designs in the target codebase's environment**. The current app is **Python + Streamlit** (see the existing repo: `app.py`, `races_config.py`). You have two reasonable paths:
1. **Stay in Streamlit** — recreate the layouts with Streamlit components + custom CSS/HTML blocks, matching the visual spec below as closely as the framework allows.
2. **Move to a web stack** (React/Next, Vue, etc.) if a richer, app-like feel is wanted — the prototype maps cleanly to a component tree with simple local state.

Either way, treat the HTML as the **visual + interaction source of truth**, and lift the exact tokens (colors, type, spacing) listed below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all specified. Recreate the UI to match. The one caveat: the **rider rosters, pro teams, times, and stage data are realistic but illustrative placeholders** — wire them to the real procyclingstats feed and the league's actual 2026 picks.

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| App background | `#E7E5DF` | Page behind the card (warm light gray) |
| Card surface | `#FCFBF8` | Main app panel |
| Surface white | `#FFFFFF` | Inner cards, expanded rows, draft rows |
| Surface sand | `#F4F2EC` | Rider GC chip, form tiles |
| Surface sand 2 | `#FAF9F5` | (alt inner tiles) |
| Ink (primary text) | `#1A1813` | Headings, names, numbers |
| Ink 2 | `#2A2820` | Secondary headings |
| Body text | `#3A382F` / `#5E5A50` / `#6E6A62` | Paragraph / labels |
| Muted text | `#9A968D` | Sublines, captions |
| Faint text | `#A8A49C` / `#B4B0A6` | Uppercase eyebrows, column labels |
| Hairline border | `#ECEAE4` / `#E4E1D8` / `#E8E5DD` | Row dividers, card borders |
| Divider faint | `#F2F0EA` | Inner list dividers |
| Positive (gain) | `#3E8F5F` | Upward movement arrows |
| Negative (loss) | `#C25B43` | Downward movement arrows |
| Neutral move | `#B0ACA2` / `#9A968D` | "hold" / no change |
| Live badge | bg `#E6F4EC`, text `#2F7D52` | Race status = Live |
| Complete badge | bg `#F0EEE8`, text `#8C8881` | Race status = Complete |
| Upcoming badge | bg `#F4F2EC`, text `#9A968D` | Race status = Upcoming |

### Accent (jersey) — themeable per race
The leader accent is a CSS-variable theme switched by race. Three presets:
| Theme | `--accent` | `--accent-tint` | `--accent-border` | `--accent-ink` |
|---|---|---|---|---|
| **Tour Yellow** (default) | `#F2C200` | `#FEFAE6` | `#F2E4A0` | `#6E5300` |
| Giro Pink | `#E83E8C` | `#FCEAF2` | `#F6C9DE` | `#8E1A55` |
| Vuelta Red | `#DC143C` | `#FDEAEC` | `#F4C5CD` | `#8E0E26` |

`--accent` = solid jersey color; `--accent-tint` = leader row / callout background; `--accent-border` = tint border; `--accent-ink` = text/number on tint or on the solid accent.

### Typography
- **Family:** `Archivo` (Google Fonts), weights 400/500/600/700/800. Fallback `-apple-system, BlinkMacSystemFont, sans-serif`.
- **Numbers:** always `font-variant-numeric: tabular-nums` for times, ranks, gaps.
- **Scale used:**
  - Eyebrow label: 10–11px, weight 700, `letter-spacing: .14–.18em`, uppercase, faint color
  - Column labels: 10px, weight 700, `.08em`, uppercase
  - Screen title: 23–25px, weight 700, `letter-spacing: -.015em`
  - Rider profile name: 27px, weight 700, `letter-spacing: -.02em`
  - Team name (row): 17px, weight 600; (header) 23px, weight 700
  - Rank number: 19px (list) / 22px weight 800 (profile chip)
  - Total time: 18px weight 700; gap: 12px weight 600
  - Body/sublines: 11–13.5px
  - Brand wordmark: 12px, weight 800, `letter-spacing: .16em`, uppercase

### Spacing / Radius / Shadow
- Card radius: **20px** (main panel), **12px** (inner cards), **11px** (rows/buttons), **10px** (GC chip), **8–9px** (callouts), **999px** (chips/pills/badges).
- Panel shadow: `0 6px 28px rgba(40,38,30,.10)`.
- Standard inner padding: 18px horizontal on the panel; 13–14px inside cards.
- Max content width: **460px**, centered; page padding `40px 20px 56px`.
- Row vertical padding: 13px; expanded rider rows 7px.

---

## Screens / Views

The app is a single centered panel (max-width 460px) with a **brand bar** (wordmark "SUNSHINE FANTASY" + a small jersey-color swatch) and a **tab nav** with four tabs: **Standings · Stage · Team · Races**. Two sub-screens (**Draft**, **Rider profile**) replace the whole panel and have a back affordance.

### 1. Standings (default tab)
- **Purpose:** See who's winning the league at a glance.
- **Layout:** Header block → column labels (`# / Team / Total time`) → 6 ranked rows → footer note.
- **Header:** eyebrow "THE SUNSHINE LEAGUE" + "Updated 2 min ago"; title "Tour de France 2026"; a **stage progress bar** ("Stage 11 of 21" / "52% done", dark fill on `#ECEAE4` track, 4px tall, ~52% width); a **daily recap callout** (accent-tint background, accent dot, one sentence).
- **Rows (per team):** rank number + movement arrow beneath (▲/▼/hold, green/red/neutral); team name; **Yellow Jersey** badge on the leader (solid accent bg, accent-ink text, uppercase 8px) and a 🐼 panda on last place ("lanterne rouge"); a muted subline of the three riders' surnames · separated; right-aligned total time + gap (leader shows "Leader" in accent-ink, others "+m:ss" muted); a chevron (▸/▾).
- **Leader row** has an accent-tint full-row background + a 3px accent left bar.
- **Interaction:** tapping a row expands it to show its three riders (GC rank `#n`, full name, today's GC delta ▲/▼, cumulative time). Multiple rows can be open; Nate (leader) is open by default.
- **Footer:** "Score = sum of your three riders' GC times. Lowest total wins. Data via procyclingstats."

### 2. Stage
- **Purpose:** What happened in the most recent stage and how it moved the league.
- **Layout:** stage header → winner callout → "League shake-up" list → "Your riders today" list.
- **Header:** eyebrow "STAGE 11 · Thu Jul 16"; title "Pau → Luchon-Superbagnères"; meta "High mountain · 183 km".
- **Winner callout:** accent-tint card, 🏆 tile (solid accent), "STAGE WINNER" eyebrow, winner name + pro team, finish time right-aligned.
- **League shake-up:** rows of `▲1 / ▼1` (green/red) + player name + note ("Takes the yellow jersey", "Up to 4th overall", etc.).
- **Your riders today:** tappable cards — finish place (e.g. "2nd"), rider name, note ("Holds GC #1"), GC gap. Tapping opens the **Rider profile**.

### 3. Team
- **Purpose:** Inspect any player's roster in detail; edit your own.
- **Layout:** horizontal scrollable **player chip row** (Aaron, Nate, Leo, Charles, Aly, Jeremy) → selected team header → 3 rider cards → (your team only) "Edit your picks" button.
- **Selected chip** uses solid accent bg + accent-ink text; others white with hairline border.
- **Team header:** name + badges ("You" = dark pill on Aaron; "Yellow Jersey" on leader; 🐼 on last); big total time + gap line ("Leads by 1:18" / "+6:41 behind"); standing line ("3rd of 6 overall · 3 riders").
- **Rider card (tappable → profile):** 44px GC chip (label "GC" + big rank number), rider name + pro team, right-aligned cumulative time + gap-to-leader; a "Today" footer row with movement ("▲ Gained 1 place" / "▼ Lost 2 places" / "– Held position").
- **"Edit your picks"** button (white, hairline border) only shows on your team (Aaron) → opens **Draft**.

### 4. Races
- **Purpose:** Switch the competition being viewed.
- **Layout:** eyebrow "CHOOSE COMPETITION" → list of race cards.
- **Race card:** colored status dot (jersey color of that race), race name + "Viewing" badge on the active one, dates + "21 stages" subline, right-aligned **status badge** (Live = green / Complete = gray / Upcoming = sand) + a short note ("Won by Aaron", "Stage 11 / 21", "Starts May").
- **Races:** TdF 2025 (Complete), Giro 2026 (Upcoming), **TdF 2026 (Live, viewing)**, Vuelta 2026 (Upcoming).
- **Note for build:** in the prototype this only sets a `viewing` highlight. Intended full behavior: selecting a race **swaps the entire dataset and the accent theme** (Giro→pink, Vuelta→red).

### 5. Draft (sub-screen)
- **Purpose:** Edit your three rider picks.
- **Layout:** back link ("‹ Standings") → header ("Edit your three riders" + lock note) → **3 pick slots** → "Available riders" pool list → confirm button.
- **Pick slot (filled):** numbered accent tile, rider name + "team · role", an × remove button. **(empty):** dashed border, "Empty — add a rider below".
- **Pool row:** rider name + team, a role pill (GC/Climber/Sprinter/…), a **+ add** button (accent when slots remain, disabled gray when 3/3).
- **Header note + count:** "Pick N more · picks lock when Stage 12 starts"; "N / 3 picked" (red until full, green at 3).
- **Confirm button:** disabled sand "Pick N more riders" until full, then solid-accent "Save team".
- **Behavior:** add fills the next empty slot; remove empties it; adds are blocked at 3 picks.

### 6. Rider profile (sub-screen)
- **Purpose:** Detail on a single rider.
- **Layout:** back link → header (role · nationality · age; big name; pro team) → 3 stat cards (GC rank / GC time / to-leader gap) → "Recent form — last 3 stages" (three tiles with stage number + finish ordinal) → owner callout ("Drafted by Aaron (you)" / another player / "Not drafted in your league").

---

## Interactions & Behavior
- **Tab nav:** switches the four main screens; active tab is ink-colored with a 2px ink underline, inactive faint. Switching tabs clears any open sub-screen.
- **Standings rows:** toggle expand/collapse independently.
- **Team → rider card / Stage → "your riders today" card:** open Rider profile (sub-screen).
- **Team (your team) → "Edit your picks":** open Draft (sub-screen).
- **Draft add/remove:** mutate the pick list; gate adds at 3.
- **Back links:** clear the sub-screen, return to the main tabbed view.
- No page-level animations required; keep transitions minimal/subtle (this app is intentionally minimal). Optional: gentle row expand.
- **Movement arrows** are globally toggleable (a "showMovement" flag) — when off, all ▲/▼ indicators hide.

## State Management
Local UI state only (no global store needed):
- `screen`: `'standings' | 'stage' | 'team' | 'races'`
- `sub`: `null | 'draft' | { type:'rider', name }` — active sub-screen
- `expanded`: map of teamName→bool (standings rows)
- `team`: selected player on the Team tab
- `race`: selected race id
- `draftPicks`: array of rider names (max 3)
- Tweak flags: `accent` (`'Tour Yellow' | 'Giro Pink' | 'Vuelta Red'`), `showMovement` (bool)

### Data fetching
- Replace the hardcoded `data()` (teams + riders + GC times + daily deltas), `racesData()`, `draftPoolData()`, and the Stage screen's stage/movers/yourToday objects with the real **procyclingstats** GC feed for the active race.
- Day-over-day movement (`move` per team, `d` per rider) is derived by diffing today's GC vs. yesterday's snapshot — persist a daily standings snapshot to compute it.

## The Players (2026)
Aaron *(you)*, Nate, Leo, Charles, Aly, Jeremy. Each drafts 3 riders. (Rider assignments in the prototype are illustrative — replace with the league's real picks.)

## Assets
- **Font:** Archivo via Google Fonts.
- **Emoji:** 🏆 (stage winner), 🐼 (lanterne rouge / last place). Keep these two only — the redesign deliberately strips other emoji.
- No image assets required. (The old app's `public/images/fantasy-og.png` OG image can be reused for social/meta.)

## Files
- `Standings.dc.html` — the complete prototype (all six screens + interactions + data). Open in a browser to click through every flow. All copy, colors, and layout values are in this file's inline styles and its logic class (`data()` / `racesData()` / `draftPoolData()` / `renderVals()`).
- Existing app for reference: `app.py`, `races_config.py` (current Streamlit implementation + multi-race config).
