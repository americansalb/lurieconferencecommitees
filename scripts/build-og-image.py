#!/usr/bin/env python3
"""Generate the social share (Open Graph) card for the conference.

Renders a branded 1200x630 image so links to conference.aalb.org preview
with our logos and theme instead of whatever image a scraper finds first.
Composited from the real Lurie + AALB wordmarks over a warm cream brand
background. Supersampled 2x then downscaled for crisp type.

Run:  python3 scripts/build-og-image.py
Out:  public/og/conference-og.png
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = "/home/user/lurieconferencecommitees"
S = 2  # supersample factor
W, H = 1200 * S, 630 * S


def px(v):
    return int(round(v * S))


# --- brand palette (from src/components/landing/tokens.ts) ---
TEAL = (14, 85, 102)
TEAL_DARK = (14, 68, 86)
BLUE = (42, 143, 204)
GOLD = (201, 161, 75)
GOLD_DEEP = (176, 138, 58)
GOLD_SOFT = (244, 233, 205)
INK = (11, 31, 37)
INK_SOFT = (40, 71, 82)
MUTED = (90, 110, 118)
PAPER_TOP = (251, 250, 247)
CREAM_BOTTOM = (242, 233, 214)

FONT_DIR = "/usr/share/fonts/truetype/liberation"
F_BOLD = f"{FONT_DIR}/LiberationSans-Bold.ttf"
F_REG = f"{FONT_DIR}/LiberationSans-Regular.ttf"
F_ITAL = f"{FONT_DIR}/LiberationSans-Italic.ttf"


def font(path, size):
    return ImageFont.truetype(path, px(size))


# --- background: vertical cream gradient ---
base = Image.new("RGB", (W, H), PAPER_TOP)
top = Image.new("RGB", (1, H))
for y in range(H):
    t = y / (H - 1)
    # ease the blend so most of the canvas stays light, warming toward the floor
    t = t * t * (3 - 2 * t)
    r = int(PAPER_TOP[0] + (CREAM_BOTTOM[0] - PAPER_TOP[0]) * t)
    g = int(PAPER_TOP[1] + (CREAM_BOTTOM[1] - PAPER_TOP[1]) * t)
    b = int(PAPER_TOP[2] + (CREAM_BOTTOM[2] - PAPER_TOP[2]) * t)
    top.putpixel((0, y), (r, g, b))
base = top.resize((W, H))

draw = ImageDraw.Draw(base, "RGBA")

# --- soft gold glow, upper-center (echoes the landing sections) ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
cx, cy = W // 2, px(40)
rad = px(560)
gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(GOLD[0], GOLD[1], GOLD[2], 46))
glow = glow.filter(ImageFilter.GaussianBlur(px(120)))
base = Image.alpha_composite(base.convert("RGBA"), glow).convert("RGB")
draw = ImageDraw.Draw(base, "RGBA")

# --- top accent bar (teal -> gold), slim ---
bar_h = px(9)
bar = Image.new("RGB", (W, 1))
for x in range(W):
    t = x / (W - 1)
    r = int(TEAL_DARK[0] + (GOLD[0] - TEAL_DARK[0]) * t)
    g = int(TEAL_DARK[1] + (GOLD[1] - TEAL_DARK[1]) * t)
    b = int(TEAL_DARK[2] + (GOLD[2] - TEAL_DARK[2]) * t)
    bar.putpixel((x, 0), (r, g, b))
base.paste(bar.resize((W, bar_h)), (0, 0))

# --- delicate inset frame (premium "invitation" feel) ---
inset = px(30)
draw.rounded_rectangle(
    [inset, inset, W - inset, H - inset],
    radius=px(18),
    outline=(GOLD[0], GOLD[1], GOLD[2], 90),
    width=max(1, px(1.2)),
)


def paste_logo(name, target_h, center_y, *, left=None, right=None):
    logo = Image.open(f"{ROOT}/public/logos/{name}").convert("RGBA")
    scale = px(target_h) / logo.height
    new = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.LANCZOS)
    y = int(center_y - new.height / 2)
    if left is not None:
        x = px(left)
    else:
        x = W - px(right) - new.width
    base.paste(new, (x, y), new)


# --- logos row: Lurie left, AALB right ---
logo_cy = px(100)
paste_logo("lurie.png", 94, logo_cy, left=80)
paste_logo("aalb.png", 98, logo_cy, right=80)


def text_center(y, s, fpath, size, fill, tracking=0):
    f = font(fpath, size)
    if tracking == 0:
        draw.text((W // 2, y), s, font=f, fill=fill, anchor="mm")
        return
    widths = [f.getlength(c) for c in s]
    total = sum(widths) + tracking * (len(s) - 1) * S
    x = W // 2 - total / 2
    for c, w in zip(s, widths):
        draw.text((x, y), c, font=f, fill=fill, anchor="lm")
        x += w + tracking * S


# --- eyebrow: gold caps with flanking rules ---
eb_y = px(214)
eb_text = "THE 2ND JOINT CONFERENCE"
eb_font = font(F_BOLD, 17)
eb_track = 6
eb_w = sum(eb_font.getlength(c) for c in eb_text) + eb_track * (len(eb_text) - 1) * S
text_center(eb_y, eb_text, F_BOLD, 17, GOLD_DEEP, tracking=eb_track)
rule_gap = px(22)
rule_len = px(34)
lx2 = W // 2 - eb_w / 2 - rule_gap
draw.line([lx2 - rule_len, eb_y, lx2, eb_y], fill=GOLD_DEEP, width=max(1, px(1.2)))
rx1 = W // 2 + eb_w / 2 + rule_gap
draw.line([rx1, eb_y, rx1 + rule_len, eb_y], fill=GOLD_DEEP, width=max(1, px(1.2)))

# --- hero theme ---
text_center(px(298), "True Language Access", F_BOLD, 66, INK)
text_center(px(372), "Yesterday, Today, and Tomorrow", F_ITAL, 44, TEAL)

# --- short gold rule ---
ry = px(432)
draw.line([W // 2 - px(58), ry, W // 2 + px(58), ry], fill=GOLD, width=px(2.5))

# --- meta line: dates + city ---
meta_y = px(480)
mf_b = font(F_BOLD, 27)
dates = "August 15–16, 2026"
city = "Chicago, Illinois"
dot = "   •   "
mf_dot = font(F_BOLD, 27)
total_w = mf_b.getlength(dates) + mf_dot.getlength(dot) + mf_b.getlength(city)
x = W // 2 - total_w / 2
draw.text((x, meta_y), dates, font=mf_b, fill=INK_SOFT, anchor="lm")
x += mf_b.getlength(dates)
draw.text((x, meta_y), dot, font=mf_dot, fill=GOLD, anchor="lm")
x += mf_dot.getlength(dot)
draw.text((x, meta_y), city, font=mf_b, fill=INK_SOFT, anchor="lm")

# --- url ---
text_center(px(528), "conference.aalb.org", F_BOLD, 21, TEAL)

# --- downscale for crisp anti-aliasing ---
out = base.resize((1200, 630), Image.LANCZOS)
out.save(f"{ROOT}/public/og/conference-og.png", optimize=True)
print("wrote public/og/conference-og.png", out.size)
