# Push notifications — setup and operations

The system has three moving parts:

1. **Backend** (this Next.js app) holds device tokens, user preferences, the
   scheduled-notification queue, and the dispatcher that talks to APNs and
   FCM.
2. **iOS app** (`/ios`) registers for APNs and posts its token to the
   backend.
3. **Android app** (`/android`) registers for FCM and posts its token to
   the backend.

Reminders are produced two ways: **scheduled** (e.g. "30 minutes before this
event") rows live in `lcc_scheduled_notifications` and get drained by the
cron endpoint; **live** triggers (discussion replies, admin broadcasts,
task assignments) push inline.

## Backend env vars

| Variable             | Used for                                           | Required for      |
| -------------------- | -------------------------------------------------- | ----------------- |
| `APNS_KEY_ID`        | Apple .p8 key id (10 chars)                        | iOS push          |
| `APNS_TEAM_ID`       | Apple developer team id                            | iOS push          |
| `APNS_BUNDLE_ID`     | Bundle id of the iOS app                           | iOS push          |
| `APNS_AUTH_KEY`      | Contents of the .p8 file (BEGIN/END PRIVATE KEY)   | iOS push          |
| `APNS_ENV`           | `production` or `sandbox`                          | iOS push (debug)  |
| `FCM_PROJECT_ID`     | Firebase project id                                | Android push      |
| `FCM_CLIENT_EMAIL`   | Service-account email                              | Android push      |
| `FCM_PRIVATE_KEY`    | Service-account private key (PEM)                  | Android push      |
| `CRON_SECRET`        | Shared secret to gate `/api/cron/dispatch-reminders` | All scheduled  |

The system no-ops gracefully when keys are missing; logs say
`"APNs not configured"` or `"FCM not configured"`. Preferences and devices
still work without keys, so you can wire the apps before keys are in place.

## Generating the APNs auth key

1. Go to <https://developer.apple.com/account/resources/authkeys/list>.
2. *Create a new key* → check **Apple Push Notifications service (APNs)**.
3. Download the `.p8` file (Apple lets you do this once). Save the
   10-character Key ID it shows you.
4. Find your Team ID at <https://developer.apple.com/account>.
5. Set `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_AUTH_KEY` (paste the entire `.p8`
   contents — backslash-n escapes are fine; the server normalises them).

## Setting up Firebase for FCM

1. Create a project at <https://console.firebase.google.com>.
2. *Add app → Android*, package name `org.aalb.lurieconference` (or your
   override). Download `google-services.json` into `android/app/`.
3. *Project Settings → Service Accounts → Generate new private key*. The
   JSON contains `project_id`, `client_email`, and `private_key`. Put
   these into `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`.
4. (Optional) Also register an iOS app in Firebase if you want analytics;
   the iOS app uses APNs directly, so it doesn't need
   `GoogleService-Info.plist` for push to work.

## Running the scheduler

The cron endpoint is `POST /api/cron/dispatch-reminders`. It claims up to
200 due rows per invocation, fans them through the dispatcher, marks them
`sent`/`failed`/`skipped`, and logs every result to
`lcc_notification_log`.

If `CRON_SECRET` is set, requests must include
`X-Cron-Secret: <value>` or `Authorization: Bearer <value>`.

### Render

Add this snippet to a `render.yaml` (or configure equivalent in the UI):

```yaml
services:
  - type: cron
    name: lurie-dispatch-reminders
    runtime: node
    schedule: "* * * * *"        # every minute
    buildCommand: "npm ci"
    startCommand: "node -e \"fetch(process.env.SCHEDULER_URL, { method: 'POST', headers: { 'x-cron-secret': process.env.CRON_SECRET || '' } }).then(r => r.text()).then(console.log).catch(e => { console.error(e); process.exit(1) })\""
    envVars:
      - key: SCHEDULER_URL
        value: https://conference.aalb.org/api/cron/dispatch-reminders
      - key: CRON_SECRET
        sync: false
```

### Vercel

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/dispatch-reminders", "schedule": "* * * * *" }
  ]
}
```

Vercel signs cron requests with `Authorization: Bearer $CRON_SECRET` —
just set `CRON_SECRET` on the project.

## Trigger map

| Trigger                              | When fires                  | Channel       |
| ------------------------------------ | --------------------------- | ------------- |
| New discussion reply                 | inline                      | `discussions` |
| Task assigned (assignee changed)     | inline                      | `tasks`       |
| Task status changed (other actor)    | inline                      | `tasks`       |
| Admin broadcast                      | inline                      | `broadcast`   |
| Event start in N minutes             | cron drains `scheduled`     | `events`      |
| Task due in N minutes                | cron drains `scheduled`     | `tasks`       |

Lead-time fan-out happens at the moment an event or task is created,
updated, or a user changes their preferences:
`rebuildScheduleForEvent`, `rebuildScheduleForTask`, and
`rebuildScheduleForUser` recompute the queued rows.

## Preferences shape

`lcc_notification_preferences.settings` is a JSON blob. The canonical shape
is in `src/lib/notification-prefs.ts` (`DEFAULT_SETTINGS`). All four channels
have an `enabled` toggle; quiet hours and muted days apply to every channel
except `broadcast` (broadcasts bypass do-not-disturb).

## Testing the pipeline

- `POST /api/notifications/test` (with the user's session or a mobile
  bearer token) fires a `broadcast`-channel push to all the user's devices.
  The web "Notifications" page has a button for this.
- Without APNs/FCM keys, the dispatcher still logs to
  `lcc_notification_log` with `status: "failed"` and a clear "not configured"
  message — useful for sanity checks during development.

## Failure handling

- 410/Unregistered responses from APNs and `UNREGISTERED`/`NOT_FOUND` from
  FCM cause the device row to be deleted automatically.
- The dispatcher catches per-device errors so one bad token never breaks
  the whole fan-out.
- Provider JWTs (APNs ES256, FCM OAuth) are cached in-memory with a sane
  TTL; we don't sign on every send.
