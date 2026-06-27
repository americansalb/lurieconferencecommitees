# Email deliverability

Everything in this app that emails a sponsor or attendee goes out through
**Resend** (`src/lib/mail.ts` → `https://api.resend.com/emails`). Whether those
messages land in the inbox instead of spam depends on three things being right:
domain authentication (SPF/DKIM/DMARC), the unsubscribe + postal-address
signals required of bulk senders, and sending hygiene. The code half is done;
this doc is the operational half that lives in DNS and environment config.

## 1. Authenticate the sending domain in Resend

The `from` address is `MAIL_FROM` (currently
`Lurie Children's & AALB Conference <contact@aalb.org>`), so the domain that
must be authenticated is **`aalb.org`** — the From-header domain has to match
the DKIM-signing domain for DMARC to pass with alignment.

1. In Resend → **Domains**, add `aalb.org` (or a dedicated sending subdomain such
   as `mail.aalb.org`; if you use a subdomain, set `MAIL_FROM` to send from it,
   e.g. `…<contact@mail.aalb.org>`, so alignment still holds).
2. Resend shows a set of DNS records. Add **all** of them at the `aalb.org` DNS
   provider:
   - **DKIM** — usually one or more CNAMEs like `resend._domainkey` →
     `…resend.com`. This is what cryptographically signs every message.
   - **SPF / Return-Path (MAIL FROM)** — a CNAME for the custom return path
     (e.g. `send.aalb.org` → `feedback-smtp.<region>.amazonses.com`) plus a TXT
     `v=spf1 include:amazonses.com ~all` on that return-path host. This aligns
     the bounce domain with your domain so SPF passes *and* aligns for DMARC.
3. Wait for Resend to show **Verified** (DNS can take up to a few hours).

> If `aalb.org` already has an SPF record for Google Workspace, do **not** add a
> second `v=spf1` TXT — a domain may have only one. Merge the includes into the
> existing record instead (e.g. `v=spf1 include:_spf.google.com include:amazonses.com ~all`).

## 2. Publish a DMARC record

Add a TXT record at `_dmarc.aalb.org`. Start in monitor mode, then tighten once
the aggregate reports show SPF+DKIM passing for legitimate mail:

```
# Phase 1 — monitor (safe to deploy immediately)
_dmarc.aalb.org  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@aalb.org; fo=1"

# Phase 2 — enforce (after a week or two of clean reports)
_dmarc.aalb.org  TXT  "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@aalb.org"
```

Gmail and Yahoo now **require** a DMARC record for anyone sending bulk mail. Even
`p=none` satisfies the requirement; the stricter policies protect the domain
from spoofing.

## 3. One-click unsubscribe + postal address (already in code)

Bulk-sender rules (Gmail/Yahoo 2024, and CAN-SPAM) require a working unsubscribe
and a physical mailing address. Both are implemented:

- **List-Unsubscribe + List-Unsubscribe-Post** headers are attached to every
  sponsor send (`sponsorUnsubHeaders` in `src/lib/sponsors.ts`), pointing at
  `POST /api/sponsors/unsubscribe/[token]`, which honors the one-click POST per
  RFC 8058.
- A **visible unsubscribe link** and the **postal address** render in the footer
  of both the formal letter and the comp "claim your table" email.
- Unsubscribing sets `Sponsor.unsubscribedAt`; every send path (`send-invite`,
  `send-letter`, single/bulk `invite`, and the queue runner) checks it first and
  refuses to send to anyone who opted out.

Set the postal address via env (CAN-SPAM requires a real one):

```
MAIL_POSTAL_ADDRESS=Americans Against Language Barriers, 123 Example St, Chicago, IL 60601
```

If unset, it falls back to `Americans Against Language Barriers, Chicago, IL`.
Use the real registered address before any large send.

## 4. Sending hygiene (pacing & warm-up)

- Sponsor bulk invites go through the **paced queue** (`src/lib/email-queue.ts`),
  not a single blast — this spreads sends over time, which protects domain
  reputation. Keep the pacing policy conservative for the first few hundred
  messages from a newly-authenticated domain (a cold domain that suddenly sends
  500 messages in an hour looks like spam).
- Replies to the letter go to `kevin@aalb.org, contact@aalb.org`; real replies
  from recipients are a strong positive engagement signal — good.
- Keep the suppression list clean: never re-add or re-email an unsubscribed org.
  The code enforces this, but don't defeat it by recreating records.

## 5. Quick verification checklist

Before a large send:

- [ ] Resend shows `aalb.org` (or the sending subdomain) **Verified**.
- [ ] `dig +short txt _dmarc.aalb.org` returns a `v=DMARC1` record.
- [ ] Send one test to a Gmail address; in the message, **Show original** shows
      `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
- [ ] That test message shows an "Unsubscribe" affordance at the top in Gmail
      (proves the List-Unsubscribe header is valid).
- [ ] `MAIL_POSTAL_ADDRESS` is set to the real address and appears in the footer.
- [ ] `RESEND_API_KEY` and `MAIL_FROM` are set (`/api/...` mail-config debug, or
      `isMailConfigured()`), and `MAIL_FROM`'s domain matches the verified domain.
