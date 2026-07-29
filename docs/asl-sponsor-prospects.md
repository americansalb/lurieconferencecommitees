# ASL Interpreter Sponsor prospects

A registered attendee asked for ASL interpretation. These are the organizations
we ask to donate interpreter hours for it, in the room in Chicago or on camera
for the livestream. Either answers the request, so the letter does not make the
donor pick our preference for us.

The list lives in `src/lib/prospect-targets.ts` (`ASL_TARGETS`), and the
**Load ASL prospects** button on the Sponsors page adds the loadable rows to
Pending invite with the `asl` tier. No email is sent by loading.

## The decision date

`src/lib/asl-request.ts` holds the whole ask in one place: the decision date
(**Thursday, August 6**), the coverage options, the scope, and the
`ASL_REQUEST_OPEN` switch. While that switch is `true`, every `asl`-tier
invitation sends the urgent letter about the real request instead of the
general sponsorship pitch. Flip it to `false` once interpretation is staffed or
paid for, and the ASL tier goes back to being an ordinary sponsorship offer.

The date is stated in the letter with its actual reason: past it we book a paid
team and cover it ourselves, because the person who asked deserves an answer
either way. It is not scarcity framing and should not be rewritten into any.

Preview the letter at `/dev/email-preview/asl-urgent`, and the general version
at `/dev/email-preview/asl-invite`.

## Email verification status

This session's network policy blocked opening any of these organizations'
websites, so an address is filled in **only** where the organization's own
published contact details surfaced in search results. Rows with a blank email
are real organizations that are not loadable until someone reads the address off
their contact page.

### Loadable now (address was published)

| Organization | Email | Where it came from |
|---|---|---|
| Chicago Hearing Society (Anixter Center) | `CHSInterp@anixter.org` | Their interpreter request page, and a state DHH resource directory |
| Illinois Registry of Interpreters for the Deaf | `info@irid.org` | Their own site listing |
| Illinois Association of the Deaf | `eb@iadeaf.org` | Their contact page. **Least certain of the six**, confirm before relying on it |
| Deaf Services Unlimited | `Talktous@deafservicesunlimited.com` | Their site and directory listings |
| TransCultures | `info@TransCultures.com` | Published on their Chicago ASL interpreter page |
| American Language Services | `interpreting@alsglobal.net` | Published on their Chicago ASL and CART page |

### Needs an email before it can load

Check the page listed, paste the address into `ASL_TARGETS`, and it becomes
loadable automatically.

| Organization | Page to check | Why it is on the list |
|---|---|---|
| Columbia College Chicago, ASL-English Interpretation | `directory.colum.edu/departments/29`, or the ASL department page | The only nationally accredited BA in ASL-English Interpretation in the Chicago metro area. Chair is Peter Cook; the college's pattern looks like first-initial plus last name at `colum.edu`, so **verify rather than guess**. Faculty hours or a mentored team both work |
| 5 Star Interpreting | `5starinterpreting.com/contact-us` | Deaf-owned, covers Chicago on-site and by video, used as a referral agency by universities here |
| Metaphrasis Language & Cultural Solutions | `metaphrasislcs.com/contact` | Chicago-based, places ASL interpreters into hospitals and schools. Site may be form-only |
| Illinois Language Services | `illinoislanguageservices.com` | ASL into medical centers and hospitals statewide |
| Linguabee | `linguabee.com` | Deaf-owned, nationwide, remote-capable |
| Convo Communications | `convo.io` | Deaf-owned and Deaf-run, on-demand remote interpreters |

## Amplifiers, to email by hand and not as sponsors

These can reach interpreters far faster than we can, but pitching a state
agency a sponsorship tier would be the wrong ask, so they are deliberately not
in the loadable list.

- **Illinois Deaf and Hard of Hearing Commission** — `DHH.Communications@Illinois.gov`
  for general and program questions, `DHH.Interpreter@Illinois.gov` for
  licensure and testing. They maintain the licensed interpreter directory for
  the state. Ask them to circulate the request, not to sponsor it.
- **IRID** is in the loadable list, but the realistic ask is the same one:
  circulate it to the membership. The letter already says so, and offers to
  credit IRID either way.

## Two things worth knowing before spending time

- **Sorenson runs a real sponsorship program but requires requests at least six
  weeks in advance**, with a form, a letter on letterhead, and a W-9. The
  conference is inside that window, so they are not a route for this year. Worth
  a calendar note for 2027.
- **ICRID is Indiana, not Illinois.** `icrid.org` turns up first in searches for
  the Illinois registry. The Illinois chapter is IRID at `irid.org`, which also
  describes itself as rebuilding its organizational compliance, so expect a
  slower reply than the phone-answering agencies.
