This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Conference subdomain & presenter funnel

The app serves `conference.aalb.org` as the public landing for everything conference-related, including the presenter confirmation funnel.

### DNS / Render

1. In Render, add `conference.aalb.org` as a custom domain on this service.
2. At the DNS provider for `aalb.org`, add the CNAME Render shows you.
3. Wait for the SSL cert to provision.

### Required env vars (Render → Environment)

```
DATABASE_URL=postgres://…
NEXTAUTH_SECRET=<random 32-byte string>

# Email is sent through Resend (see src/lib/mail.ts). The MAIL_FROM domain
# must be a verified domain in Resend — see docs/deliverability.md.
RESEND_API_KEY=re_…
MAIL_FROM=Lurie Children's & AALB Conference <contact@aalb.org>
MAIL_REPLY_TO=contact@aalb.org      # optional, default Reply-To
MAIL_BCC=contact@aalb.org           # optional, BCCs every confirmation to that mailbox
MAIL_POSTAL_ADDRESS=Americans Against Language Barriers, Chicago, IL   # CAN-SPAM footer
```

Sponsor/attendee deliverability (SPF, DKIM, DMARC, one-click unsubscribe,
postal address, pacing) is documented in [docs/deliverability.md](docs/deliverability.md).

The app falls back to `RENDER_EXTERNAL_URL` (which Render injects automatically) for building presenter portal links, so you only need to set the URL vars below when you want to override, e.g. when `conference.aalb.org` goes live:

```
NEXTAUTH_URL=https://conference.aalb.org
APP_URL=https://conference.aalb.org
```

Generate the app password at <https://myaccount.google.com/apppasswords> while signed in as the sending mailbox (2FA must be enabled on that account).

### Database migration

Run once after deploy (and on every release that adds models):

```
npx prisma migrate deploy
```

### URLs

- `/`, public marketing landing
- `/presenters`, presenter confirmations dashboard (any logged-in member can view; admins can edit)
- `/presenters/[id]`, presenter detail
- `/presenters/confirm/[token]`, public, tokenized presenter wizard, sent in invitation emails
