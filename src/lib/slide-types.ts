// What counts as a presentation file. Kept apart from presenter-slides.ts so
// the upload form can state the rules without dragging Prisma into the browser
// bundle, and so the form and the server can never disagree about them.

export const MAX_SLIDE_MB = 100;
export const MAX_SLIDE_BYTES = MAX_SLIDE_MB * 1024 * 1024;
/** For copy, so the number in a sentence cannot drift from the number enforced. */
export const MAX_SLIDE_LABEL = `${MAX_SLIDE_MB} MB`;
export const SLIDE_NAME_RE = /\.(ppt|pptx|key|odp|pdf|mp4|mov|m4v|webm)$/i;
/** For the `accept` attribute on a file input. */
export const SLIDE_ACCEPT = ".ppt,.pptx,.key,.odp,.pdf,.mp4,.mov,.m4v,.webm";
export const SLIDE_TYPES_SENTENCE =
  "PowerPoint (.ppt, .pptx), Keynote (.key), OpenDocument (.odp), PDF, or video (.mp4, .mov)";

export const MIME_BY_EXT: Record<string, string> = {
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/vnd.apple.keynote",
  odp: "application/vnd.oasis.opendocument.presentation",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
};

/**
 * Whether the browser can show this in a tab rather than only saving it.
 *
 * Videos and PDFs open where you click them, which is how somebody checks that
 * what arrived is what they expected. Everything else downloads, because a
 * browser cannot render a Keynote file and would just show a page of nonsense.
 */
export function opensInBrowser(mime: string | null): boolean {
  return mime === "application/pdf" || (mime || "").startsWith("video/");
}
