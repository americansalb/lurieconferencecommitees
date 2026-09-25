// Rendered per request. The admin page is client-side and behind a login, so
// a prebuilt static copy has nothing to offer and can be served stale after a
// deploy; the per-presenter pages under it are dynamic already.
export const dynamic = "force-dynamic";

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
