# Kisaan — Fair Crop Prices & Sowing Advisor

A UX concept + working website by **Muhammad Abbas Khan** (UI/UX Designer & Web Developer, UET Peshawar).

**Live demo:** https://abbasmomand98-jpg.github.io/kisaan-fair-mandi-prices/
**Case study:** (Behance link added on publish)

## The problem

Pakistani farmers sell blind. The day's mandi rate reaches the village days late by word of mouth, so the aarthi (middleman) names his price — often Rs 400–500 per 40 kg below the mandi rate — and the farmer takes it. Meanwhile the rabi sowing window (wheat: 25 Oct – 20 Nov in the Punjab plains) is just two weeks wide, and farmers who sow by guesswork can lose 15% of their yield.

Kisaan puts three tools in the farmer's pocket:

1. **Mandi board** — today's rates per 40 kg for 8 crops (wheat, basmati, cotton, maize, mustard, potato, onion, sugarcane) with 7-day trend sparklines.
2. **Munsif Meter** — type the middleman's offer and your maunds; get an UNDERPAID / FAIR / GOOD DEAL verdict against the mandi rate, with the exact rupees you'd lose.
3. **Sowing planner** — pick a crop and district for the ideal sowing window, recommended seed varieties, a 5-day field-weather strip, rain alerts, and a tick-off checklist (saved in your browser).
4. **Profit estimator** — acres × expected yield × mandi rate minus the real per-acre cost of cultivation.

## How it works

- `data.js` holds **all content**: crops with mandi rates and 7-day trends, the sowing calendar per crop and agro-zone, seed varieties, 5-day weather per district, per-acre cost tables, and expected yields. Change a price or add a crop here — nothing else needs editing.
- `logic.js` holds **all maths as pure functions** (no DOM): the Munsif Meter verdict bands, sowing-window date arithmetic, profit estimation, trend direction, PKR formatting. It runs identically in the browser and under Node.
- `app.js` is the **UI layer only**: it renders the four tabs from `data.js` through `logic.js` and wires the buttons. It never hard-codes a price or a date rule.
- `test.js` is a **Node smoke test** (46 assertions) covering every logic function plus data sanity. Run it with `node test.js`.

> **Honesty note:** mandi rates, weather and cost tables are realistic *sample* data for the Oct 2026 rabi season so the UI and maths are demonstrably real. A production version would pull daily rates from a mandi feed — the code is structured so that means swapping one file (`data.js`).

## What you can learn from this project

- **Separation of concerns, the practical way:** content (`data.js`) → pure logic (`logic.js`) → UI (`app.js`). Notice how `test.js` can verify every business rule without opening a browser, because `logic.js` never touches the DOM.
- **Date-window maths:** `sowingStatus()` turns a (month, day) window into "opens in N days / day X of Y / closing soon" — a reusable pattern for admissions, harvests, sales, or any seasonal window.
- **Verdict UX:** the Munsif Meter shows how to turn a comparison into a decision — a band (UNDERPAID/FAIR/GOOD), a visual meter, and the *consequence* in rupees, not just the verdict.
- **localStorage checklists:** the sowing checklist persists per crop+district with zero backend — the same 10-line pattern works for packing lists, study plans, or farm logs.

Fork it and adapt the pattern to a problem in *your* area — fishing seasons on the coast, fruit harvest windows in Swat, or livestock vaccination calendars. The structure stays the same; only `data.js` changes.
