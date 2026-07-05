# Neubrutalism Design System

Use this preset whenever a project calls for a bold, high-contrast, "raw structure visible" UI —
dashboards, admin tools, internal ops software, hackathon projects that need to look opinionated
fast. Do not apply by default to content-heavy, long-session, or trust-sensitive products
(fintech onboarding, long-form reading, healthcare forms) — the visual noise fatigues over time
and doesn't communicate the calm/trust those need. Confirm the product type fits before applying.

## Core Principles

1. **Structure is visible, not hidden.** No soft shadows, no blur, no gradients pretending depth
   is real. Borders and offset shadows show the actual layer stack.
2. **Flat, saturated color blocks** carry meaning (status, category) — not decoration.
3. **Everything is rectangular.** Border-radius is 0 or near-0. Rounded corners undercut the whole
   aesthetic — don't mix them in "for softness."
4. **Type is heavy and confident.** Bold sans-serif, uppercase for labels/nav/eyebrows, no thin
   weights anywhere in UI chrome.
5. **One accent color governs the brand** (yellow in this preset); status colors are functional,
   not decorative — green/amber/red/pink map to specific states, not arbitrary variety.

## Design Tokens

### Color
```css
--color-bg: #F5EFDC;          /* dot-grid cream background */
--color-surface: #FFFFFF;      /* card backgrounds */
--color-ink: #111111;          /* borders, text, shadows */
--color-accent: #F4C542;       /* brand yellow — nav bar, primary CTA, highlight bars */
--color-accent-cta: #3B4CCA;   /* blue — primary action buttons */

/* Status colors — assign by meaning, not preference */
--color-success: #4CAF6D;      /* reunited / resolved / good */
--color-pending: #F4C542;      /* pending / in progress */
--color-danger:  #E85C4A;      /* unresolved / error / needs escalation */
--color-flag:    #E85CA8;      /* flagged / duplicate / needs attention */
--color-info:    #6EC6E8;      /* neutral info / transferred / secondary metric */
```

### Borders & Shadows
```css
--border-width: 3px;
--border-color: var(--color-ink);
--radius: 0px;                 /* do not round. If you must, max 4px on small chips only. */

/* Signature offset shadow — no blur, hard edge, looks like a sticker lifted off the page */
--shadow-offset: 6px 6px 0px var(--color-ink);
--shadow-offset-sm: 4px 4px 0px var(--color-ink);
--shadow-offset-hover: 3px 3px 0px var(--color-ink); /* shrink on press/hover for tactile feel */
```

Every card, button, and input gets `border: var(--border-width) solid var(--border-color)` +
`box-shadow: var(--shadow-offset)`. Never use `border-radius` + soft shadow together — that's a
different (soft neumorphism / SaaS-default) aesthetic and undoes the whole point.

### Typography
```css
--font-display: 'Archivo Black', 'Arial Black', sans-serif;   /* headlines, big stats */
--font-body: 'Inter', 'Helvetica Neue', sans-serif;             /* body copy, descriptions */
--font-mono: 'IBM Plex Mono', monospace;                        /* IDs, codes, timestamps */

--text-hero: 700 48px/1.1 var(--font-display);
--text-h1: 700 32px/1.15 var(--font-display);
--text-stat: 800 40px/1 var(--font-display);   /* the big number in stat cards */
--text-label: 700 12px/1.2 var(--font-body);   /* uppercase eyebrow labels */
--text-body: 400 15px/1.5 var(--font-body);
--text-mono: 400 13px/1.4 var(--font-mono);
```

Labels and nav items are uppercase with letter-spacing: 0.02em. Body copy is sentence case —
don't uppercase everything, that's how you lose hierarchy.

### Background Texture
Optional but recommended for the brand-identity layer: a subtle dot-grid on the page background.
```css
background-color: var(--color-bg);
background-image: radial-gradient(var(--color-ink) 1px, transparent 1px);
background-size: 20px 20px;
opacity of dots should read as ~10-15%, not full ink — use a light tint of --color-ink, not pure black.
```

## Component Patterns

### Stat Card
- Solid color fill (status color), thick black border, hard offset shadow
- Small uppercase label top, huge bold number, small caption bottom
- No icon needed — color + number carries the meaning

### Nav Bar
- Solid accent color (yellow) full-width bar, black bottom border, no shadow (it's the anchor, not a floating layer)
- Logo/wordmark in black pill or plain bold text top-left
- Nav links as white/black bordered button-chips, active state = filled black bg + white text

### Buttons
- Primary: solid accent-cta color, black border, offset shadow, bold uppercase label
- Secondary: white fill, black border, offset shadow
- On press: shadow shrinks from 6px to 3px and button translates down-right 3px (tactile "pressed into page" feel)
```css
.btn:active { transform: translate(3px, 3px); box-shadow: var(--shadow-offset-hover); }
```

### Data Tables / List Rows
- Each row is its own bordered block (not hairline dividers) — reinforces the "everything is a distinct object" principle
- Status shown as a solid-color pill, black border, bold uppercase text, top-right or right-aligned
- Color swatches (if representing categories/tags) as small bordered rectangles, not circles — circles read as soft/modern, rectangles stay on-brand

### Charts
- Bars in flat accent colors, no gradients, no rounded bar-tops
- Highlight/anomaly bars in accent yellow against a base color (blue/gray) — color does the work of annotation instead of tooltips or arrows
- Axis labels in mono or bold sans, no thin gridlines — if gridlines exist, make them solid and visible, not faint

### Maps / Geo Visuals
- Marker size = magnitude, marker color = category/status (same status palette as everywhere else)
- Black stroke around every marker so it reads as an object, not a glowing dot

## Do / Don't

**Do**
- Keep every interactive element's affordance obvious via border + shadow, never rely on subtle color shifts alone
- Use exactly one bright "brand" accent (yellow here) consistently for nav/CTA — don't let it compete with status colors
- Let empty states and demo-data banners use the same bordered-block treatment as everything else (see "DEMO DATA · SYNTHETIC SAMPLE" tag pattern — small bordered pill, not a subtle text note)

**Don't**
- Mix in soft drop-shadows or blurred glows anywhere — one inconsistent card breaks the whole system
- Round corners "just on this one card" — pick 0px (or one small radius value) and hold it everywhere
- Use more than ~5-6 named colors total across accent + status — more than that and the "color = meaning" system collapses into decoration
- Add gradients, glassmorphism, or translucency — this style is defined by being flat and opaque

## Prompt Snippet for Agents

When handing this to Cursor/Codex/Claude Code, paste this block along with the tokens above:

> Build this UI in the neubrutalism style: flat saturated color fills, 3px solid black borders on
> every card/button/input, hard offset box-shadows (6px 6px 0 black, no blur), zero border-radius,
> bold uppercase labels, Archivo Black for headings and Inter for body text. No gradients, no soft
> shadows, no rounded corners. Status/category meaning is carried by solid color blocks (green =
> success, amber = pending, red = danger, pink = flagged, blue = info), not icons or subtlety.
