# Visual Style Recognition Guide

For each style: recognition keywords, canonical examples, typography rules, color tendencies,
layout rules, and what to avoid.

---

## 1. Minimalist / Swiss International Style

**Recognition keywords:** minimal, clean, simple, white space, Swiss, Bauhaus-inspired, flat,
modern, uncluttered

**Canonical references:** Apple marketing 2010s, Dieter Rams product design, Swiss poster design,
muji aesthetic, Helvetica documentary

**Typography:**
- Primary: Inter, Helvetica Now (system), Aktiv Grotesk
- Body: Inter, DM Sans, Open Sans
- Weight range: Light (300) to Bold (700) — never Extra Bold
- Generous tracking on small text (`letter-spacing: 0.05em` at 12–14px)
- Tight tracking on large display (`letter-spacing: -0.03em` at 60px+)
- Left-aligned by default

**Color:**
- Mostly white or near-white backgrounds
- Single accent color maximum
- Black text: `#1A1A1A` not pure `#000`
- Accent examples: `#0071E3` (Apple blue), `#FF3B30` (alert red), `#34C759` (green)

**Layout:**
- Extreme whitespace — content occupies 40–60% of canvas
- Grid-based, strong alignment
- No decorative borders, no drop shadows, no gradients
- Photography: always high quality, full bleed or precisely cropped

**Do:** Use negative space as a design element. Let one element breathe.
**Don't:** Add texture, noise, decorative elements, multiple font weights, busy backgrounds.

---

## 2. Brutalist

**Recognition keywords:** brutalist, brutalism, raw, concrete, aggressive, chaotic, anti-design,
overlapping, ugly-on-purpose, Balenciaga, Virgil Abloh

**Canonical references:** Balenciaga website, early craigslist, Bloomberg Businessweek covers,
Virgil Abloh's OFF-WHITE

**Typography:**
- Primary: Space Grotesk, Epilogue, Times New Roman (system), Arial Black (system)
- Monospace accent: IBM Plex Mono, Courier New
- Unconventional sizing — huge and tiny coexist
- Mixed weights deliberately
- Text overlaps images or other text
- ALL CAPS or all lowercase, rarely title case

**Color:**
- High contrast: black + white dominates
- Accent: single harsh color — `#FF0000`, `#FFFF00`, `#00FF00`
- Industrial: raw concrete grey (`#808080`), off-white (`#F5F5F0`)
- Anti-gradient: flat solid fills only

**Layout:**
- Break the grid intentionally but purposefully
- Asymmetric, collision-based layouts
- Visible structure (borders, rules) or deliberately none
- Text and images overlap
- Elements may be rotated (90°, 180°)

**Do:** Let the rawness show. Constraint violation is the aesthetic.
**Don't:** Make it look "designed" or polished. No drop shadows, no rounded corners, no softness.

---

## 3. Editorial / Luxury

**Recognition keywords:** luxury, editorial, high-end, fashion, premium, refined, elegant,
Vogue, Harper's Bazaar, couture

**Canonical references:** Vogue magazine, Harper's Bazaar, Chanel ads, Hermès visual identity

**Typography:**
- Display: Playfair Display, Cormorant Garamond, DM Serif Display, Didot (system)
- Body: Cormorant Garamond, Source Serif 4
- Extreme weight contrast: hairline (100–200) and bold (700–900)
- Generous leading in body (1.7×)
- Generous whitespace around text

**Color:**
- Black and white as primary
- Gold accent: `#C9A84C`, `#B8962E`, `#D4AF37`
- Champagne: `#F7E7CE`
- Deep navy: `#0A1628`
- Never bright or saturated — always muted, rich

**Layout:**
- Asymmetric but balanced
- Text and image relationship: text very small vs. large image
- Generous margins (15–20% of canvas)
- Single-column or two-column maximum
- Drop caps on long-form text

**Do:** Restraint. One image, one statement, lots of air.
**Don't:** Use more than 2 font families, use bright colors, crowd the layout.

---

## 4. Retro / Vintage

**Recognition keywords:** retro, vintage, old school, 1950s, 1960s, 1970s, nostalgic, aged,
worn, grunge, distressed, rockabilly

**Canonical references:** old travel posters, diner signage, record covers, cigarette ads

**Typography:**
- Display: Bebas Neue, Alfa Slab One, Lobster, Righteous
- Body: Lora, Special Elite, Libre Baskerville
- ALL CAPS headlines common
- Condensed or slab serifs preferred
- Slight text distress/texture overlay

**Color:**
- Muted, desaturated — everything slightly "aged"
- Cream: `#F5EDD6`, `#EDE0C4`
- Brick red: `#C0392B`, `#A93226`
- Mustard: `#D4A017`, `#E8A020`
- Teal: `#148F77`, `#1ABC9C`
- Sepia overlay: `rgba(139, 90, 43, 0.15)`

**Layout:**
- Badge or seal-style compositions
- Strong central focal point
- Halftone dot patterns, grain textures
- Borders: double-rule, ornate, dashed
- Starburst, ribbon, banner shapes

**Do:** Add noise/grain texture overlay. Use warm aged paper colors. Arc text around badges.
**Don't:** Use clean flat colors or modern sans-serifs. Avoid anything that looks "digital."

---

## 5. Cyberpunk / Tech

**Recognition keywords:** cyberpunk, neon, glitch, dark, hacker, matrix, vaporwave-dark,
futuristic, Blade Runner, Ghost in the Shell, synthwave

**Canonical references:** Blade Runner 2049, Ghost in the Shell, Cyberpunk 2077 UI

**Typography:**
- Display: Orbitron, Exo 2, Rajdhani, Audiowide
- Body: Share Tech Mono, Rajdhani, IBM Plex Mono
- Mixed case: often ALL CAPS for headlines
- Glitch effect: text duplicated and offset 1–3px with color channels split

**Color:**
- Background: near-black `#0A0A0F`, `#05050A`
- Neon cyan: `#00FFFF`, `#00E5FF`
- Neon magenta: `#FF00FF`, `#E040FB`
- Neon green: `#39FF14`, `#00FF41`
- Amber: `#FF6B00`, `#FF8C00`
- Grid lines: `rgba(0, 255, 255, 0.15)`

**Layout:**
- Dark background mandatory
- Neon glow effects (CSS `text-shadow`, SVG `filter: drop-shadow`)
- Horizontal scan lines at 1–2px
- Grid overlays, perspective grids (vanishing point)
- Text truncated with `>` prefixes, `//` comment style
- Status bars, HUD elements, hex codes as decoration

**Do:** Use glow effects. Dark background with neon text. Grid overlays.
**Don't:** Use light backgrounds, soft colors, or rounded friendly fonts.

---

## 6. Vaporwave / 80s / Lo-fi

**Recognition keywords:** vaporwave, aesthetic, 80s, retrowave, synthwave, sunset, pastel neon,
Miami, outrun, lo-fi, nostalgic tech

**Canonical references:** Macintosh Plus - Floral Shoppe album art, Miami Vice, outrun art

**Typography:**
- Display: Syne, Righteous, Audiowide, VT323 (pixel)
- Body: Chakra Petch, Rajdhani
- Wide tracking, sometimes Japanese characters as decoration
- All caps or small caps for subtext

**Color:**
- Background: deep purple `#1A0533` or gradient purple→pink
- Hot pink: `#FF2D78`, `#FF1493`
- Cyan: `#00FFFF`, `#22D3EE`
- Lavender: `#B388FF`, `#CE93D8`
- Gold/yellow: `#FFD700`
- Gradient: `linear-gradient(180deg, #1A0533 0%, #6B21A8 40%, #FF2D78 80%, #FF7E5F 100%)`

**Layout:**
- Checkerboard floor in perspective
- Palm trees, Greek busts, grids
- Horizontal stripe bands
- Sun/grid horizon line
- Glitch/chromatic aberration on key elements
- Retro CRT screen effect (scanlines + slight barrel distortion)

**Do:** Bold gradients, perspective grids, retro computer aesthetics.
**Don't:** Use muted or natural colors. Avoid corporate or clean design.

---

## 7. Art Deco

**Recognition keywords:** art deco, 1920s, 1930s, geometric, gold, black, symmetry, Gatsby,
Chrysler Building, jazz age, opulent

**Canonical references:** Chrysler Building, The Great Gatsby, Pan Am posters, Mucha (transitional)

**Typography:**
- Display: Josefin Sans, Cinzel, Poiret One
- Body: Josefin Slab, Josefin Sans (Light)
- ALL CAPS is canonical for art deco
- Wide, even tracking (`letter-spacing: 0.15–0.25em`)
- Thin and thick weight contrast

**Color:**
- Black: `#0D0D0D`
- Gold: `#C9A84C`, `#D4AF37`, `#B8960C`
- Cream/ivory: `#F5EDD6`, `#FFFFF0`
- Deep teal: `#006666`, `#004D4D`
- Burgundy: `#800020`

**Layout:**
- Strict bilateral symmetry
- Sunburst / fan patterns radiating outward
- Chevron zigzag borders
- Stepped/layered geometric shapes
- Thin rule lines as decorative elements
- Strong vertical emphasis

**Do:** Symmetry, gold and black, geometric patterns, tall proportions.
**Don't:** Use asymmetry, rounded shapes, casual fonts, or bright non-gold colors.

---

## 8. Playful / Children / Rounded

**Recognition keywords:** fun, playful, kids, children, bubbly, cheerful, rounded, friendly,
bright, toy, cartoon

**Canonical references:** LEGO, Mailchimp Freddie, Duolingo, KidRobot

**Typography:**
- Display: Fredoka, Nunito Black, Baloo 2
- Body: Nunito, Poppins, Cabin
- Mixed case (not all caps, not formal)
- Rounded letterforms only
- Loose tracking, generous leading

**Color:**
- Saturated primaries
- Yellow: `#FFD93D`, `#FFC200`
- Coral: `#FF6B6B`, `#FF4757`
- Teal: `#1DD1A1`, `#00B894`
- Sky blue: `#54A0FF`, `#2980B9`
- Purple: `#A29BFE`, `#6C5CE7`
- White backgrounds usually `#FFFFFF` or `#FFF9F0`

**Layout:**
- Asymmetric but balanced
- Organic shapes, blob-like backgrounds
- Illustrations with thick outlines
- Rounded rectangles everywhere
- Shadow: flat `2–4px` offset with no blur (retro-toy feel)

**Do:** Use bright saturated colors, rounded shapes, playful illustrations.
**Don't:** Use sharp edges, muted colors, tight layouts, formal serifs.

---

## 9. Natural / Organic / Artisan

**Recognition keywords:** natural, organic, earthy, artisan, handcraft, farm-to-table, botanical,
linen, kraft, sustainable, eco

**Canonical references:** Aesop packaging, craft beer labels, farmers market branding

**Typography:**
- Display: Fraunces, Merriweather, EB Garamond
- Body: Source Serif 4, Lora, Cabin
- Mixed weight — some bold display, lighter body
- Slightly imperfect — variable fonts with optical size variation preferred

**Color:**
- Warm neutrals: `#F5EDD6` (cream), `#E8D5C0` (linen), `#C4A882` (sand)
- Forest green: `#2D6A4F`, `#40916C`
- Earth brown: `#6B4226`, `#8B5E3C`
- Dusty terracotta: `#C97D4E`, `#B5634A`
- Off-white: `#FAFAF5`

**Layout:**
- Hand-drawn elements, botanical illustrations
- Rough-edge textures (paper grain, linen)
- Oval, circular, or irregular label shapes
- Dense botanical borders
- Centered, symmetrical compositions

**Do:** Warm palette, natural textures, organic shapes, imperfect details.
**Don't:** Use bright synthetics, cold blues/purples, perfect geometric precision.

---

## 10. Street / Urban / Streetwear

**Recognition keywords:** street, urban, streetwear, hype, skateboard, graffiti, bold, raw,
New York, Supreme, Palace, Stüssy

**Canonical references:** Supreme box logo, Palace skateboards, Travis Scott merch, zine culture

**Typography:**
- Display: Barlow Condensed (Black), Black Han Sans, Bebas Neue, Oswald
- Body: Barlow, Roboto Condensed
- ALL CAPS preferred
- Very tight tracking at large sizes, very condensed widths

**Color:**
- Black + one color is the canonical formula
- Red: `#D00000`, `#FF0000`
- White: `#FFFFFF`
- Orange: `#FF6400`
- Neon yellow: `#FFFF00`
- Background: black `#000000` or white `#FFFFFF`

**Layout:**
- Box logo convention: text in a colored rectangle
- Strong centered or off-center single focal element
- Very little hierarchy — everything competes
- Sticker aesthetic: white outlined graphic on dark

**Do:** Bold, aggressive, simple. One typeface. One graphic. High contrast.
**Don't:** Use serif fonts, gradients, soft colors, complex layouts.

---

## 11. Academic / Scholarly / Literary

**Recognition keywords:** academic, scholarly, literary, university, journal, book cover, thesis,
intellectual, classic

**Canonical references:** Penguin Classics book covers, academic journal layouts, Princeton/Oxford press

**Typography:**
- Display: EB Garamond (Large), Playfair Display
- Body: EB Garamond, Source Serif 4, Spectral
- Small caps for author names/subtitles
- Drop caps on first paragraph
- Old-style figures preferred

**Color:**
- Muted, dignified
- Deep burgundy: `#722F37`
- Navy: `#1B2A4A`
- Forest green: `#1E4D2B`
- Cream: `#F5EDD6`
- Black text: `#1A1A1A`

**Layout:**
- Strong vertical axis
- Classic book proportions (portrait)
- Horizontal rules dividing sections
- Author/title/publisher three-part structure
- Conservative margins, dense but readable

**Do:** Timeless, classical, dignified. Restrained ornamentation.
**Don't:** Use display fonts, bright colors, modern sans-serifs.

---

## 12. Corporate / Professional

**Recognition keywords:** corporate, business, professional, B2B, enterprise, slide, report,
LinkedIn, official

**Typography:**
- Display: Inter (Bold), Roboto, Source Sans 3
- Body: Open Sans, Lato, Source Sans 3
- Conservative weight range: Regular to Bold only

**Color:**
- Blue as primary: `#0056B3`, `#003087`, `#1565C0`
- White: `#FFFFFF`
- Light grey: `#F8F9FA`, `#E9ECEF`
- Dark text: `#212529`
- Accent: `#28A745` (success), `#DC3545` (alert)

**Layout:**
- Grid-based, consistent margins
- Clear hierarchy
- Charts and data visualizations clean
- No decorative elements — information first

**Do:** Clear hierarchy, consistent grid, professional restraint.
**Don't:** Use decorative fonts, aggressive color, non-standard layouts.

---

## Style Combination Guide

When user asks to "blend" two styles, apply these rules:

| Combination | Approach |
|---|---|
| Luxury + Minimal | Use luxury fonts (Cormorant) on a minimal white layout |
| Retro + Tech | Use retro color palette with modern condensed sans |
| Brutalist + Corporate | Break grid but keep professional color palette |
| Vaporwave + Art Deco | Deco symmetry + vaporwave gradients and neon |
| Playful + Editorial | Editorial serif at display size, playful rounded at body |

Always take the **layout** from one style and **color/type** from the other — mixing both layout
and color tends to produce incoherent results.
