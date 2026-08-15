// What counts as a presentation file. Kept apart from presenter-slides.ts so
// the upload form can state the rules without dragging Prisma into the browser
// bundle, and so the form and the server can never disagree about them.

export const MAX_SLIDE_MB = 100;
export const MAX_SLIDE_BYTES = MAX_SLIDE_MB * 1024 * 1024;
/** For copy, so the number in a sentence cannot drift from the number enforced. */
export const MAX_SLIDE_LABEL = `${MAX_SLIDE_MB} MB`;
export const SLIDE_NAME_RE = /\.(ppt|pptx|key|odp|pdf)$/i;
/** For the `accept` attribute on a file input. */
export const SLIDE_ACCEPT = ".ppt,.pptx,.key,.odp,.pdf";
export const SLIDE_TYPES_SENTENCE =
  "PowerPoint (.ppt, .pptx), Keynote (.key), OpenDocument (.odp), or PDF";

export const MIME_BY_EXT: Record<string, string> = {
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/vnd.apple.keynote",
  odp: "application/vnd.oasis.opendocument.presentation",
  pdf: "application/pdf",
};
