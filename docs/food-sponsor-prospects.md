# Food sponsors — Chicago vegan/vegetarian restaurants

The conference is **fully plant-based (no meat served)**, so these are asked to
**donate or cater a meal in kind** and are recognized as Food Sponsors. They get
the dedicated food letter (`sponsorFoodLetterEmail`) and the "food" tier, and
can be filtered apart from the rest of the pipeline (the **Food / Non-food**
dropdown on the Sponsors page).

## Status

**50 restaurants now have an email filled in and will load** via "Load food
prospects" (the original 28 plus 22 added in the 2026 round-2 expansion). The
emails are **search-sourced** (domain-matched or business-name-matched
addresses found in search listings) but were **not confirmed on the live page**
(the network policy blocks opening restaurant sites), so give each a quick
confirm before enabling Auto-send. Bloom was removed (permanently closed Feb
2026). The table below is the original research reference.

### Round-2 expansion (2026)

A second sweep roughly doubled the list, with a deliberate push into the
region's deepest plant-based catering pool: **pure-vegetarian Indian caterers**
(Devon Avenue plus the Naperville/Warrenville/Schaumburg suburbs), alongside
vegan caterers, vegan bakeries/coffee for dessert and breakfast sponsorships,
near-venue spots, and suburban kitchens. Every candidate was re-verified as
**currently open and meat-free**; the second pass rejected four that turned out
to serve meat or had closed (Madhura Cafe, Idly Vada Bistro, Shimla Peppers,
Mindful Baking).

**Vegan ask for vegetarian kitchens.** The conference is fully vegan, but many
of the new prospects are *vegetarian* (not vegan), so a lacto-vegetarian kitchen
could send ghee, paneer, or yogurt by default. Each vegetarian row's note now
makes a **gentle, explicit ask for a dairy-free / vegan version**, framed as an
easy, familiar lift rather than a demand (e.g. Govinda's temple kitchen: "we
would simply ask for a spread set without ghee, paneer, or dairy, which your
cooks can prepare with grace"). The existing Handlebar and Annapurna rows were
updated the same way. The Chicago Diner row is left as-is (already confirmed).

The **form-only** additions below have no email published by the business, so
they are worked by hand through the linked catering/contact form or phone
(email left blank in `FOOD_TARGETS` so they do not auto-load).

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

---

## Round-2 form-only kitchens (no published email, work by hand)

Real, currently-open, meat-free kitchens where research found no business-published
email. Contact via the linked form/phone. Vegetarian rows carry the gentle vegan ask in
their note. If you later find a published address, move the row into `FOOD_TARGETS` with
the email filled in so it auto-loads.

| Restaurant | Area | Cuisine | Form / phone | Note |
|---|---|---|---|---|
| The Vegan Palace | Streamwood, IL | Vegan Mexican | https://www.facebook.com/p/The-Vegan-Palace-100064067645975/ | The Vegan Palace brings a fully plant-based take on Mexican cooking to Streamwood, with tacos, burritos, and more, all vegan, seven days a week. A conference that has committed to an all-vegan table would love to bring that kind of flavor to our guests. We would be glad to talk with you about catering or donating a meal. |
| Chicago Not Dogs | Chicago, IL | Vegan Chicago-style (Italian beef, hot dogs) | https://www.chicagonotdogs.com/ | Chicago Not Dogs makes heart-healthy, 100 percent vegan versions of Chicago classics, from plant based Italian beef to Chicago style hot dogs. Now a roving kitchen after the XMarket food hall closed, they still bring their menu to events around the city. A hometown, all-vegan spin on Chicago food would be a fun fit for our table. Could we talk about catering? |
| Conscious Plates | Woodlawn, Chicago, IL | Alkaline vegan (whole-food, plant-based) | https://www.consciousplates.com/ | Conscious Plates is Chef Latrell Garnett's alkaline, whole food vegan kitchen in Woodlawn, where every dish is plant based and made without soy, wheat or starch. A conference committed to an all-plant-based table would value a partner rooted so deeply in food as healing. We would love to talk about catering, once we confirm the best time to reach you. |
| Your Organic Inner G | Ashburn, Chicago, IL | Vegan / organic plant-based (globally inspired healthy) | https://www.yourorganicinnerg.fun/ | Your Organic Inner G brought a fully plant-based, organic kitchen to Ashburn in 2024, a warm neighborhood spot focused on healthy, feel-good vegan cooking. A conference that has committed to an entirely meat-free table would be happy to bring your food to the room. We would love to talk with you about catering or donating a meal. |
| Mindful Indulgences | Chicago, IL | Vegan chocolate / artisan confections | https://www.facebook.com/MindfulIndulgencesLLC/ | Mindful Indulgences crafts organic, fair-trade vegan chocolate truffles right here in Chicago, proof that plant-based confections can be every bit as elegant as the classics. A conference that has committed to an all-vegan table would love to close a meal with your chocolates. We would be glad to talk about a dessert donation or a small catering order. |
| Upton's Naturals | Chicago, IL vegan food manufacturer | Vegan seitan and jackfruit food maker | https://uptonsnaturals.com/contact-info/ | Upton's Naturals has made Chicago a home for approachable vegan food since 2006, crafting the seitan and jackfruit that restaurants and home cooks across the country rely on. The company has long donated product to plant based causes. Our conference has committed to an entirely plant based table, and your foods would help feed it. Could we talk about donating product or foodservice support? |
| The Black Vegan | 2300 S Kedzie Ave, Chicago, IL 60623, Little Village | Vegan soul food and comfort | https://www.shopblackvegan.com/catering | The Black Vegan brings serious flavor to Chicago's Little Village, from portabella gyros to jackfruit sliders and crispy vegan wings, all fully plant based. Our conference has committed to an entirely meat free table, and your bold, soul forward cooking would fit it beautifully. Could we talk about catering a meal for our guests? |
| Govinda's of Naperville | Naperville, IL | Vegetarian Indian / Chinese (temple kitchen) | https://www.iskconnaperville.org/new-temple-project/govindas-catering/ | Govinda's, the vegetarian kitchen at Naperville's Radha Shyamasundara Temple, serves North and South Indian and Chinese dishes with real devotion and caters weddings and events, all of it meat-free. Since our conference is fully vegan, we would simply ask for a spread set without ghee, paneer, or dairy, which your cooks can prepare with grace. We would love to talk about catering. |
| Blind Faith Cafe | Evanston, IL | Vegetarian American / global | https://www.blindfaithcafe.com/catering-services | Blind Faith has been Evanston's vegetarian anchor since 1979, a certified green kitchen serving globally inspired plates and catering everything from small dinners to weddings for hundreds. Our conference is fully vegan, so we would simply ask for your plant-based dishes, the ones without dairy or eggs, which your kitchen handles with ease. We would love to talk about a meal. |
| Shree Restaurant (Naperville) | Naperville | Pure-vegetarian Gujarati and Rajasthani Indian | https://shreerestaurants.com/contact.html | Shree Restaurant is a pure vegetarian Gujarati and Rajasthani kitchen in Naperville, serving thalis and homestyle specialties with a caterer's touch. Because our table is fully vegan, we would be hoping for dishes prepared without ghee or dairy, an easy adaptation for your cooks. Could we talk about catering or donating a meal? |
| Honest | Naperville | Pure-vegetarian Gujarati and Jain Indian | https://honestrestaurantsusa.com/contact-us.php | Honest is a pure vegetarian favorite in Naperville, loved for Gujarati and Jain cooking, from pav bhaji to spring dosa and pani puri. Since our table is entirely vegan, we would simply ask for a menu shaped without dairy or ghee, an easy turn for a kitchen already rooted in Jain cooking. Could we talk about catering a meal? |
| Sukhadia's Sweets and Snacks | West Ridge | Vegetarian Indian sweets, farsan and chaat | https://www.sukhadiasweetschicago.com/catering | For decades Sukhadia's has been a beloved all-vegetarian sweets and snacks shop on Devon Avenue, turning out farsan, chaat, and mithai passed down through generations. Many of your snacks are already vegan, and since our table is fully plant-based, we would simply ask for the dairy-free ones. Could we talk about catering a spread or donating dessert? |
| Good Foods Vegan/Vegetarian Deli | South Shore, Chicago, IL | Vegan/vegetarian deli (raw and cooked, organic) | https://krea-tek.net/goodfoods/ | Good Foods is a longtime South Shore deli where everything is meat-free, an easygoing counter of raw and cooked organic plates, sandwiches, and salads. Since our conference table is fully vegan, we would be hoping for the dairy-free side of your menu, which is already much of what you do. We would love to talk about catering a meal. |
| Vanam Indian Vegetarian | 337 W Golf Rd, Schaumburg, IL 60195, NW suburb | Pure-vegetarian South Indian | https://vanamil.com/catering-services/ | Vanam is a pure vegetarian South Indian kitchen near Woodfield, turning out fresh dosas, thalis, and chaat made daily. Since everything at our conference is fully vegan, we would just ask for the dairy-free side of your menu, an easy and familiar request for a kitchen like yours. We would be glad to talk about catering a meal. |
| Udupi Palace | 2543 W Devon Ave, Chicago, IL 60659, Little India | Pure-vegetarian South Indian | https://udupichicago.com/contact-us/ | Udupi Palace has anchored Devon Avenue since 1993 as a pure vegetarian South Indian kitchen, famous for its crisp dosas and generous thalis. Our whole conference table is vegan, so we would simply be hoping for a spread made without ghee or dairy, which we know your cooks do beautifully every day. We would love to talk with you about catering from Chicago's Little India. |

---

## Vegan-capable kitchens (serve meat, work by hand ONLY)

These restaurants **serve meat**, so they are deliberately kept OUT of
`FOOD_TARGETS` and must **never** get the standard food letter, whose whole
framing is that the conference is fully plant-based (blasting that to a
steak-and-jerk kitchen reads as tone-deaf). They earn a place here because each
has a **genuinely, verifiably vegan offering** (a naturally-vegan fasting
tradition, olive-oil masa, or a dedicated vegan menu) that could be donated as
an **entirely plant-based tray**. Approach these ONE AT A TIME, by form or
phone, with the tailored note below, which is honest about the meat menu and
makes the fully-vegan ask explicit.

Two verified gotchas to state on the call: **Klay Oven Kitchen's** dal makhani
contains cream (ask for plain lentil dal instead), and **El Taco Azteca's**
"market mushrooms" is topped with queso fresco (specify the clearly-vegan items).
All seven were verified open and meat-free-capable in 2026; re-check open status
near the send date, as with the rest of this list.
| Restaurant | Area | Cuisine | Contact (form / phone) | Note |
|---|---|---|---|---|
| Klay Oven Kitchen | Chicago French Market / West Loop, Chicago, IL | Indian, fast-service (serves meat) | Phone (312) 454-6117; catering via ezCater and CaterCow | Klay Oven Kitchen is a full-service Indian kitchen in the French Market, and its naturally vegan dishes are what drew us in: chana masala, vegetable biryani, and lentil dal cooked in olive oil. We know your menu also includes meat, so we wanted to ask directly. Would you consider donating or catering an entirely vegan tray for our all-plant-based conference, with everything kept free of meat, dairy, and eggs? |
| Ethiopian Diamond Restaurant & Bar | Edgewater, Chicago, IL | Ethiopian (serves meat) | https://www.ezcater.com/catering/ethiopian-diamond-restaurant-chicago ; phone 773-338-6100 | Ethiopian Diamond is a full-service kitchen, and what draws us is that your whole vegetarian side is naturally and fully vegan thanks to the fasting tradition: misir wot, gomen, kik alicha, and shiro on injera, all made without butter, eggs, or milk. We know the full menu includes meat. Would you consider donating or catering an entirely plant-based veggie combo for our all-vegan conference, with nothing containing meat, dairy, or eggs? |
| Dynamic African Restaurant | Edgewater, Chicago, IL | Nigerian / West African (serves meat) | https://dynamicafrican.com/contact/ ; phone 773-728-0082 | Dynamic African is a full-service Nigerian kitchen, and your naturally plant-based dishes are the real draw for us: jollof rice, vegetable stew, beans, plantains, and fufu. We know the wider menu includes meat, so we wanted to reach out directly. Would you consider donating or catering an entirely vegan tray for our all-plant-based conference, keeping every dish free of meat, dairy, and eggs? |
| Yvolina's Tamales | Pilsen, Chicago, IL | Oaxacan Mexican (serves meat) | Phone (312) 731-3167; email yvolinas1@gmail.com; Facebook page | Yvolina's is a full-service tamale shop, and what drew us is that your masa is made with olive oil instead of lard, so your vegan tamales like quinoa and lentil and kale are entirely plant-based. We know you also sell meat fillings. Would you consider donating or catering a tray of fully vegan tamales for our all-plant-based conference, with nothing containing meat, dairy, or eggs? |
| El Taco Azteca (Pilsen) | Pilsen / Lower West Side, Chicago, IL | Mexican (serves meat and seafood) | https://www.eltacoaztecapilsen.com/contact ; phone (773) 247-1103; event/venue space available | El Taco Azteca is a full-service kitchen, and your dedicated vegan dishes are what caught our eye: tofu al pastor and mushroom carnitas flautas. We know the full menu also includes meat and seafood, so we wanted to ask directly. Would you consider donating or catering an entirely vegan spread for our all-plant-based conference, with every dish kept free of meat, dairy, and eggs? |
| Garifuna Flava | Chicago Lawn / Marquette Park, Chicago, IL | Belizean / Garifuna Caribbean (serves meat) | https://garifunaflava.net/affordable-corporate-lunch-catering-chicago/ ; phone (773) 776-7440 | Garifuna Flava is a full-service Belizean kitchen, and your dedicated vegan Caribbean catering is exactly the draw for us, with coconut-milk sauces and plant-based protein entrees. We know you also serve jerk chicken and fish, so we wanted to reach out directly. Would you consider donating or catering an entirely vegan tray for our all-plant-based conference, with everything free of meat, dairy, and eggs? |
| Arepa George | Humboldt Park / Logan Square border, Chicago, IL | Colombian (serves meat) | https://www.ezcater.com/catering/arepa-george-3 ; phone (773) 969-7945 | Arepa George is a full-service Colombian kitchen, and your clearly marked vegan arepas are the draw for us, like the vegan cornmeal cake with cabbage, carrots, broccoli, avocado, plantains, and chimichurri. We know the full menu also includes meat. Would you consider donating or catering an entirely vegan arepa spread for our all-plant-based conference, keeping every item free of meat, dairy, and eggs? |
