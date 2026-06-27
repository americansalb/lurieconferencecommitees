# Food sponsors — Chicago vegan/vegetarian restaurants

The conference is **fully plant-based (no meat served)**, so these are asked to
**donate or cater a meal in kind** and are recognized as Food Sponsors. They get
the dedicated food letter (`sponsorFoodLetterEmail`) and the "food" tier, and
can be filtered apart from the rest of the pipeline (the **Food / Non-food**
dropdown on the Sponsors page).

## ⚠️ Emails need verifying (one-time, ~20 min)

This environment's network policy blocked opening any restaurant website, so the
research could confirm each restaurant is **real and currently operating**
(identity, cuisine, neighborhood, details — all cross-checked via search, and
closures were screened out) but **could not verify a single contact email** off
the live page. A couple of search snippets even returned fabricated contacts, so
nothing unverified was trusted.

**To go live:** open each restaurant's Contact/Catering page (below), confirm the
real email, and paste it into the matching row's empty Email field in
`src/lib/prospect-targets.ts` → `FOOD_TARGETS`. Then on the Sponsors page click
**Load food prospects** (only rows with an email are loaded) and auto-send as
usual. Candidate emails below are **unverified leads** — confirm on the page
before trusting them.

## The list (20)

| # | Restaurant | Area | Cuisine | Verify email on | Candidate (unverified) |
|---|-----------|------|---------|-----------------|------------------------|
| 1 | The Chicago Diner | Lakeview / Logan Sq | Vegetarian comfort, vegan bakery | veggiediner.com/contact-us/ | `orders@veggiediner.com` (catering) |
| 2 | Handlebar | Wicker Park | Vegetarian gastropub | handlebarchicago.com (catering via Tock) | — |
| 3 | Soul Veg City | Chatham | Vegan soul | soulvegcity.com/page/catering | `loriseay10@gmail.com` ⚠️ unconfirmed; catering 773-443-0033 |
| 4 | Kale My Name | Irving Park | Vegan global | kalemyname.com (footer/contact) | — |
| 5 | Alice & Friends' Vegan Kitchen | Edgewater | Vegan global | aliceandfriendsvegankitchen.com/contact-3/ | — |
| 6 | Amitabul | Norwood Park | Vegan Korean Buddhist | amitabulvegan.com/contact | — |
| 7 | Arya Bhavan | West Ridge (Devon) | Vegan Indian | aryabhavan.com/vegan-catering-chicago/ | ❌ ignore the `@aol` one search showed |
| 8 | Penelope's Vegan Taqueria | River North + 2 | Vegan Mexican | site footer; ezCater | ❌ snippet `info@` came with a fake phone — verify only |
| 9 | Urban Vegan | Uptown | Vegan Thai | urbanveganthai.com/contact | — |
| 10 | Veggie House | Chinatown | Vegan Chinese | veggiehouseusa.com | — |
| 11 | Healthy Substance | Pilsen | Vegan Mexican | healthysubstance.com | — |
| 12 | Fancy Plants Catering | Lakeview | 100% vegan caterer | fancyplantscatering.com/contact/ | `fancyplantskitchen@gmail.com` |
| 13 | Soul Vegan | Far South Side | Vegan soul caterer | soulvegan.com/contact | `info@thesoulvegan.com` |
| 14 | Vegan Now 2 Go | South Shore | Vegan deli/bakery/caterer | vegannow2go.com | no email found; phone 773-891-1433 |
| 15 | Can't Believe It's Not Meat | Hyde Park | Vegan caterer | cantbelieveitsnotmeat.com/page/contact-us | `cantbelieveitsnotmeat@yahoo.com` ⚠️ |
| 16 | Vegan World Café | Austin | Vegan soul caterer | veganworldcafe.com/contact-us | `elihu@veganworldcafe.com` |
| 17 | Pie, Pie My Darling | Ukrainian Village | Vegan bakery (dessert) | piepiemydarling.net/pages/contact | `piepiemydarling@gmail.com` |
| 18 | PLANTA Queen | River North | Upscale plant-based Asian | plantarestaurants.com (events form) | no email; use events form |
| 19 | Majani | South Shore | Vegan soul (catering; restaurant on hiatus) | majani.biz | `Majani7167@gmail.com` ⚠️ confirm catering for the date |
| 20 | Bloom Plant Based Kitchen | Wicker Park | Vegan + GF (Michelin Bib) | bloompb.com | no email; phone 312-363-3110 — **confirm still open first** (conflicting reports) |

**Strongest catering leads to start with:** Fancy Plants, Soul Vegan, Vegan World
Café, The Chicago Diner, Can't Believe It's Not Meat (all explicitly do
large-event catering with the clearest contact paths).

## Do NOT contact (closed / ineligible — caught during research)

- **Kitchen 17 / The Veggie Diner** — dine-in closed Nov 2025 (frozen pizza only).
- **Kal'ish** (Uptown) — closed.
- **Bloom** — listed above but re-confirm; one source reported a 2026 closure, another shows it open. Verify before sending.
- **Demera** (Ethiopian) — excluded: serves meat (not a fully veg kitchen).
- **Native Foods / Veggie Grill** — no current Chicago locations.
- **Karyn's Raw** — sit-down status unconfirmed; verify by phone (312-255-1590) before adding.

> Chicago saw a wave of vegan closures in 2025–2026, so re-check "open" status
> near the send date regardless.
