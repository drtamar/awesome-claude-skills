# Color Palettes Reference

Each palette follows the **60-30-10 rule**: 60% background, 30% primary, 10% accent.
Format: `background · primary · secondary · accent · text`

---

## Per-Style Canonical Palettes

### Minimalist / Swiss
```
background:  #FFFFFF  (or #FAFAFA)
primary:     #1A1A1A
secondary:   #6B6B6B
accent:      #0071E3
text:        #1A1A1A
```
Dark variant:
```
background:  #111111
primary:     #FFFFFF
secondary:   #999999
accent:      #0071E3
text:        #FFFFFF
```

### Brutalist
```
background:  #F5F5F0
primary:     #000000
secondary:   #808080
accent:      #FF0000  (or #FFFF00)
text:        #000000
```

### Editorial / Luxury (Light)
```
background:  #FAFAF7
primary:     #0D0D0D
secondary:   #4A4A4A
accent:      #C9A84C
text:        #0D0D0D
```
Editorial / Luxury (Dark)
```
background:  #0A1628
primary:     #FFFFFF
secondary:   #B0BEC5
accent:      #D4AF37
text:        #FFFFFF
```

### Retro / Vintage
```
background:  #F5EDD6
primary:     #2C1810
secondary:   #8B5E3C
accent:      #C0392B
text:        #2C1810
```
Retro Teal variant:
```
background:  #F0E6D3
primary:     #1A3C40
secondary:   #417D7A
accent:      #D4A017
text:        #1A3C40
```

### Cyberpunk
```
background:  #0A0A0F
primary:     #00FFFF
secondary:   #FF00FF
accent:      #39FF14
text:        #E0E0E0
```
Amber variant:
```
background:  #050508
primary:     #FF6B00
secondary:   #FFD700
accent:      #FF2D78
text:        #FFE0B2
```

### Vaporwave
```
background:  #1A0533
primary:     #FF2D78
secondary:   #B388FF
accent:      #00FFFF
text:        #FFFFFF
```
Sunset gradient: `linear-gradient(180deg, #1A0533 0%, #6B21A8 35%, #C2185B 65%, #FF7043 100%)`

### Art Deco
```
background:  #0D0D0D
primary:     #D4AF37
secondary:   #F5EDD6
accent:      #C9A84C
text:        #F5EDD6
```
Light variant:
```
background:  #F5EDD6
primary:     #0D0D0D
secondary:   #006666
accent:      #D4AF37
text:        #0D0D0D
```

### Playful / Children
```
background:  #FFFFFF
primary:     #FF6B6B
secondary:   #FFD93D
accent:      #1DD1A1
text:        #2D3436
```
Cool variant:
```
background:  #F0F7FF
primary:     #54A0FF
secondary:   #A29BFE
accent:      #FF6B6B
text:        #2D3436
```

### Natural / Organic
```
background:  #F5EDD6
primary:     #2D6A4F
secondary:   #6B4226
accent:      #C97D4E
text:        #2C1810
```
Sage variant:
```
background:  #FAFAF5
primary:     #4A7C59
secondary:   #8B8B6B
accent:      #B5634A
text:        #1A1A1A
```

### Street / Urban
```
background:  #0A0A0A
primary:     #FFFFFF
secondary:   #808080
accent:      #D00000
text:        #FFFFFF
```
White variant:
```
background:  #FFFFFF
primary:     #000000
secondary:   #404040
accent:      #FF6400
text:        #000000
```

### Academic / Scholarly
```
background:  #F5EDD6
primary:     #722F37
secondary:   #4A3728
accent:      #C9A84C
text:        #1A1A1A
```
Navy variant:
```
background:  #FAFAF7
primary:     #1B2A4A
secondary:   #4A5568
accent:      #722F37
text:        #1A1A1A
```

### Corporate
```
background:  #FFFFFF
primary:     #0056B3
secondary:   #6B7280
accent:      #28A745
text:        #212529
```
Dark corporate:
```
background:  #1E293B
primary:     #3B82F6
secondary:   #64748B
accent:      #10B981
text:        #F1F5F9
```

---

## Universal Color Rules

### Never Use These
- Pure black `#000000` for large backgrounds — use `#0A0A0A` or `#111111`
- Pure white `#FFFFFF` for body text backgrounds — use `#FAFAFA` or `#F5F5F5`
- Adjacent hues without value contrast — pure blue on pure red is illegible

### Contrast Requirements (WCAG)
- **Normal text** (<18px): minimum 4.5:1 ratio
- **Large text** (≥18px bold or ≥24px): minimum 3:1 ratio
- **Decorative text** (no information): no minimum

Quick checks:
- White `#FFFFFF` on `#0056B3` blue → 8.5:1 ✓
- Black `#1A1A1A` on `#F5EDD6` cream → 10.3:1 ✓
- White `#FFFFFF` on `#C9A84C` gold → 2.3:1 ✗ (use dark text on gold)
- Dark `#1A1A1A` on `#C9A84C` gold → 5.7:1 ✓

### Gradient Recipes

**Luxury Gold**
```css
background: linear-gradient(135deg, #B8960C 0%, #D4AF37 40%, #F5E27A 60%, #D4AF37 100%);
```

**Cyberpunk Neon Glow**
```css
background: linear-gradient(180deg, #0A0A0F 0%, #1A0533 100%);
/* Element glow: */
filter: drop-shadow(0 0 8px #00FFFF) drop-shadow(0 0 20px rgba(0,255,255,0.4));
```

**Vaporwave Sunset**
```css
background: linear-gradient(180deg, #1A0533 0%, #6B21A8 30%, #C2185B 65%, #FF7043 85%, #FFD700 100%);
```

**Natural Warm**
```css
background: linear-gradient(160deg, #F5EDD6 0%, #E8D5C0 100%);
```

**Brutalist (no gradient — intentionally flat):**
```css
background: #F5F5F0;  /* Always solid */
```

---

## Color Harmony Systems

### Monochromatic (Minimalist, Luxury)
One hue, multiple lightness/saturation levels.
```
Base hue: 220 (blue)
Background: hsl(220, 5%, 98%)
Primary:    hsl(220, 80%, 40%)
Secondary:  hsl(220, 15%, 60%)
Text:       hsl(220, 20%, 15%)
```

### Complementary (High Contrast, Urban, Playful)
Hues 180° apart. Max: one dominant + one accent.
```
Dominant: Blue #2980B9
Accent:   Orange #E67E22
```

### Analogous (Natural, Organic, Warm)
Adjacent hues on the wheel. Harmonious, low contrast.
```
Green-yellow range: #4A7C59, #8B8B6B, #C97D4E
```

### Split-Complementary (Vaporwave, Retro)
Base + two adjacent to its complement.
```
Base: Purple #6B21A8
Split: Yellow-Orange #F59E0B, Cyan-Green #10B981
```

### Triadic (Playful, Art, Maximal)
Three evenly spaced hues (120° apart).
```
Red #E74C3C + Blue #3498DB + Yellow #F1C40F
```

---

## CSS Color Variables Template

```css
:root {
  --color-bg:        #FFFFFF;
  --color-primary:   #1A1A1A;
  --color-secondary: #6B6B6B;
  --color-accent:    #0071E3;
  --color-text:      #1A1A1A;
  --color-text-muted:#6B6B6B;
}
```

Replace values from the style palette above before generating.
