---
name: image-generator
description: >
  Use this skill whenever the user asks to create, generate, design, or produce any image, graphic,
  poster, banner, logo, illustration, infographic, social media card, thumbnail, wallpaper, or
  visual asset. Triggers include: "create an image", "generate a graphic", "make a poster",
  "design a banner", "draw a logo", "make art", "generate a visual", "create a thumbnail",
  "design an infographic", "make a wallpaper", "create SVG", "generate illustration",
  "typographic poster", "text-based art", or any request to produce visual output.
  This skill provides access to a comprehensive font library (Google Fonts + system fonts),
  deep style recognition across 20+ visual styles, color palette systems, and layout guidance.
  Always read references/styles.md to identify the requested style, and references/fonts.md to
  select appropriate typefaces before generating any image.
---

# Image Generator Skill

## Overview

This skill generates images using **SVG** (for vector, scalable output), **HTML+CSS** (for
browser-rendered visuals), and **Python/Pillow** (for raster images). It has full access to
Google Fonts (1,500+ typefaces), recognizes 20+ visual styles, and follows design principles
strictly.

**Before generating any image, always:**
1. Read `references/styles.md` to match the requested or detected style
2. Read `references/fonts.md` to select the right typefaces for that style
3. Read `references/color-palettes.md` to apply the correct color system

---

## Quick Format Reference

| Output Type | Use When | Renderer |
|---|---|---|
| SVG | Logos, icons, posters, illustrations, type-heavy work | Any browser / Inkscape |
| HTML+CSS | Cards, banners, web assets, multi-element layouts | Browser |
| Python/Pillow | Photo composites, pixel manipulation, raster art | `pip install Pillow` |
| HTML Canvas | Generative/procedural art, animations | Browser |

---

## Workflow

### Step 1 — Detect or Confirm Style

If the user names a style explicitly (e.g. "brutalist", "art deco", "vaporwave"), map it via
`references/styles.md`. If no style is named, infer from keywords:

- "clean", "minimal" → Minimalist / Swiss International
- "retro", "vintage", "old school" → Retro / Vintage
- "luxury", "elegant", "gold" → Luxury / Editorial
- "fun", "playful", "kids" → Playful / Rounded
- "tech", "futuristic", "cyber" → Cyberpunk / Tech
- "nature", "earthy", "organic" → Natural / Organic
- "bold", "raw", "concrete" → Brutalist

When unsure, ask: *"What style are you going for — minimal, retro, bold, luxury, playful, or
something else?"*

### Step 2 — Select Fonts

Load `references/fonts.md` and pick from the style-mapped font pairings. Rules:
- **Never use more than 3 typefaces** in a single composition
- Always pair a display/heading font with a body/caption font
- Match font personality to style personality (see the font table)
- For SVG/HTML use Google Fonts `@import` URL; for Python use downloaded `.ttf` files

### Step 3 — Build the Color Palette

Load `references/color-palettes.md`. Each style has a canonical 5-color palette:
`background · primary · secondary · accent · text`. Apply these defaults unless the user
specifies colors.

### Step 4 — Compose the Image

Follow the layout rules in the **Composition Guidelines** section below.

### Step 5 — Deliver

- For SVG: output the full `<svg>` block ready to save as `.svg`
- For HTML: output a self-contained `.html` file with embedded CSS and Google Fonts import
- For Python: output a complete runnable script

---

## Composition Guidelines

### Typography Rules
- **Hierarchy**: One dominant headline (large), one supporting element (medium), optional caption (small)
- **Contrast ratio**: Text on background must meet WCAG AA (4.5:1 minimum)
- **Tracking**: Display type (>60pt) benefits from tight tracking (`letter-spacing: -0.02em`)
- **Leading**: Body text: 1.4–1.6× font size. Display: 1.0–1.2×
- **Alignment**: Default left-align; centered only for posters/hero; never ragged-right on short lines

### Layout Rules
- **Rule of Thirds**: Place focal elements at ⅓ intersections
- **Whitespace**: Minimum 10% of canvas width as margin
- **Visual Weight**: Balance heavy elements (dark colors, large type) with lighter areas
- **Grid**: Use 12-column grid for complex layouts; 3 or 6 column for simpler ones

### Color Rules
- **60-30-10 rule**: 60% background, 30% primary, 10% accent
- **Never use pure black** (`#000000`); prefer `#0D0D0D` or `#1A1A1A`
- **Never use pure white** on white; prefer `#FAFAFA` or `#F5F4F0`
- Limit to 3–4 active colors per composition

---

## SVG Template (Starter)

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=FONT_NAME:wght@400;700&amp;display=swap');
    </style>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="#BACKGROUND_COLOR"/>
  <!-- Headline -->
  <text x="120" y="300" font-family="'FONT_NAME', sans-serif"
        font-size="80" font-weight="700" fill="#TEXT_COLOR"
        letter-spacing="-1.5">HEADLINE TEXT</text>
  <!-- Subheadline -->
  <text x="120" y="380" font-family="'BODY_FONT', sans-serif"
        font-size="28" fill="#SECONDARY_COLOR">Supporting text here</text>
</svg>
```

> Note: Google Fonts `@import` inside SVG `<defs>` works in browsers. For standalone SVG files
> served outside a browser, embed font data as base64 or use a system font fallback.

---

## HTML Template (Starter)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=FONT_NAME:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; }
  .card {
    width: 1200px; height: 630px;
    background: #BACKGROUND;
    display: flex; align-items: center;
    padding: 80px 120px;
    font-family: 'FONT_NAME', sans-serif;
  }
  .headline {
    font-size: 80px; font-weight: 700;
    color: #TEXT_COLOR;
    letter-spacing: -1.5px;
    line-height: 1.1;
  }
</style>
</head>
<body>
<div class="card">
  <div>
    <h1 class="headline">HEADLINE</h1>
    <p class="sub">Supporting text</p>
  </div>
</div>
</body>
</html>
```

---

## Python/Pillow Template (Starter)

```python
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO

# Canvas
W, H = 1200, 630
img = Image.new("RGB", (W, H), color="#BACKGROUND_COLOR")
draw = ImageDraw.Draw(img)

# Load font (download .ttf from Google Fonts first)
# font_url = "https://github.com/google/fonts/raw/main/ofl/inter/Inter[slnt,wght].ttf"
# response = requests.get(font_url); font_data = BytesIO(response.content)
headline_font = ImageFont.truetype("Inter-Bold.ttf", 80)
body_font = ImageFont.truetype("Inter-Regular.ttf", 28)

# Draw text
draw.text((120, 260), "HEADLINE TEXT", font=headline_font, fill="#TEXT_COLOR")
draw.text((120, 380), "Supporting text", font=body_font, fill="#SECONDARY_COLOR")

img.save("output.png", "PNG")
```

---

## Common Image Sizes Reference

| Use Case | Width × Height |
|---|---|
| Social media card (OG) | 1200 × 630 |
| Twitter/X header | 1500 × 500 |
| Instagram post | 1080 × 1080 |
| Instagram story | 1080 × 1920 |
| YouTube thumbnail | 1280 × 720 |
| LinkedIn banner | 1584 × 396 |
| Desktop wallpaper | 2560 × 1440 |
| Poster (A4 at 150dpi) | 1240 × 1754 |
| Logo (SVG) | viewBox 0 0 200 60 |
| Favicon | 32 × 32 |

---

## Instruction Compliance Rules

These rules are **non-negotiable**:

1. **Follow color instructions exactly** — if the user says "use blue and gold", use blue and gold.
   Never substitute with "similar" colors without asking.
2. **Follow font instructions exactly** — if the user names a font, use that font. Only suggest
   alternatives if the named font is unavailable and explain why.
3. **Follow size/dimension instructions exactly** — never silently change requested dimensions.
4. **Include all requested text verbatim** — do not paraphrase, shorten, or "improve" copy unless
   asked.
5. **Match the requested style** — read `references/styles.md` and apply the correct conventions.
   Do not blend styles unless explicitly asked.
6. **Ask before adding elements** — do not add decorative elements, icons, or background patterns
   that were not requested.
7. **Preserve brand assets** — if the user provides a logo, hex color, or brand name, keep it
   exactly as specified.

---

## References

- **`references/fonts.md`** — Full font library: 100+ Google Fonts organized by style category,
  with personality descriptions, pairings, and CSS import snippets. Read this when selecting fonts.
- **`references/styles.md`** — 20+ visual styles: recognition keywords, canonical examples,
  typography rules, layout rules, and do/don't guidance per style.
- **`references/color-palettes.md`** — Per-style color palettes, color theory rules, gradient
  recipes, and accessibility contrast guidance.
