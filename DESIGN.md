---
name: Encore
description: An evidence-first design system for concert preparation.
colors:
  graphite: 'oklch(0.141 0.005 285.823)'
  graphite-soft: 'oklch(0.21 0.006 285.885)'
  porcelain: 'oklch(1 0 0)'
  porcelain-soft: 'oklch(0.985 0 0)'
  fog: 'oklch(0.967 0.001 286.375)'
  fog-ink: 'oklch(0.552 0.016 285.938)'
  fog-border: 'oklch(0.92 0.004 286.32)'
  focus-halo: 'oklch(0.871 0.006 286.286)'
  field-green: 'oklch(0.65 0.15 145)'
  review-amber: 'oklch(0.62 0.17 72)'
  warning-gold: 'oklch(0.82 0.17 95)'
  error-red: 'oklch(0.577 0.245 27.325)'
typography:
  display:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '72px'
    fontWeight: 760
    lineHeight: '76px'
    letterSpacing: '-0.035em'
  headline:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '40px'
    fontWeight: 720
    lineHeight: '46px'
    letterSpacing: '-0.035em'
  title:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '30px'
    fontWeight: 680
    lineHeight: '36px'
    letterSpacing: '-0.025em'
  subtitle:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '22px'
    fontWeight: 650
    lineHeight: '28px'
    letterSpacing: '-0.015em'
  body-large:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '18px'
    fontWeight: 400
    lineHeight: '28px'
  body:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: '24px'
  label:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: '20px'
  caption:
    fontFamily: 'Inter Variable, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 600
    lineHeight: '16px'
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  2xl: '16px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  2xl: '24px'
  3xl: '32px'
  empty: '48px'
components:
  button-primary:
    backgroundColor: '{colors.graphite-soft}'
    textColor: '{colors.porcelain-soft}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '8px 10px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.graphite}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '8px 10px'
    height: '36px'
  input:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.graphite}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '4px 10px'
    height: '36px'
  badge-outline:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.graphite}'
    typography: '{typography.caption}'
    rounded: '{rounded.full}'
    padding: '8px 12px'
  card:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.2xl}'
    padding: '20px'
  navigation:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.graphite}'
    padding: '0 32px'
    height: '72px'
---

# Design System: Encore

## Overview

**Creative North Star: "The Setlist Field Guide"**

Encore is a practical, evidence-rich companion for preparing for a concert. Its
visual system behaves like a well-edited field guide: clear enough to scan at a
glance, structured enough to inspire trust, and detailed enough to reward
closer inspection. Graphite typography, porcelain surfaces, and fog dividers
keep the interface precise and restrained without becoming anonymous.

The shell stays quiet so the product can become expressive at the right moment.
Interactive demonstrations, live confidence feedback, and purposeful motion
carry the delight. Surfaces rest flat and ordered; hover, press, focus, drawer,
and reveal states answer the user with crisp, satisfying feedback.

**Key Characteristics:**

- Evidence-first hierarchy with bold, tightly tracked headings.
- Graphite, Porcelain, and Fog neutrals as the persistent visual foundation.
- Fine borders and generous whitespace instead of constant elevation.
- Semantic color reserved for success, review, warning, and error.
- Interactive product moments as the primary source of delight.

## Colors

The palette is a nearly monochrome field of Graphite, Porcelain, and Fog, with
small functional accents that make confidence and review states immediately
legible.

### Primary

- **Graphite:** Primary text, filled actions, the compact brand mark, and the
  strongest active states.
- **Soft Graphite:** The slightly lifted primary-action surface used when pure
  Graphite would feel too severe.

### Functional Accents

- **Field Green:** Successful matches, completion, and confirmed outcomes.
- **Review Amber:** Evidence that needs attention or human judgment.
- **Warning Gold:** Caution that should be noticed without implying failure.
- **Error Red:** Destructive actions, validation failures, and blocked states.

### Neutral

- **Porcelain:** Default page and card surface.
- **Soft Porcelain:** Subtle workspace separation and inverse text.
- **Fog:** Muted fills, quiet hover states, and tonal grouping.
- **Fog Ink:** Secondary copy, metadata, placeholders, and inactive navigation.
- **Fog Border:** Dividers, card outlines, fields, and structural rules.
- **Focus Halo:** Accessible focus emphasis around controls.

Dark mode inverts the Graphite and Porcelain relationship, deepens Fog surfaces,
and adjusts functional accents for contrast while preserving their meaning.

**The Quiet Shell Rule.** Neutral roles own the interface; functional color
appears only when it communicates state or evidence.

**The Feature Pop Rule.** A special visual surface may become expressive for an
interactive product moment, but that expression must remain concentrated
rather than spreading across every card.

## Typography

**Display Font:** Inter Variable (with system-ui and sans-serif fallbacks)  
**Body Font:** Inter Variable (with system-ui and sans-serif fallbacks)

**Character:** A single variable sans-serif voice keeps the system contemporary
and cohesive. Distinction comes from decisive weight, tightly compressed
display spacing, and an open body rhythm rather than from decorative font
pairing.

### Hierarchy

- **Display:** Landing-page statements and rare top-level moments on large
  screens.
- **Headline:** Page introductions, mobile hero statements, and major section
  headings.
- **Title:** Account and saved-work headings.
- **Subtitle:** Card, dialog, and workflow section titles.
- **Body Large:** High-priority supporting copy.
- **Body:** Default reading and explanatory copy.
- **Label:** Buttons, controls, navigation, field labels, and compact metadata.
- **Caption:** Eyebrows and status labels, often semibold and uppercase.

**The Confident Compression Rule.** Large headings are heavy and tightly
tracked; supporting copy stays regular-weight with comfortable line height.

**The One Voice Rule.** Use Inter Variable throughout. Create hierarchy through
the established roles instead of introducing a decorative display face.

## Layout

The system uses centered, fluid containers with generous outer whitespace.
Primary app pages cap near 1120px; wider landing compositions extend to roughly
1180px, while focused workflow and call-to-action regions narrow to 920–1040px.
Page gutters begin at 20px and expand to 32px from the small breakpoint.

Vertical rhythm is assembled from a compact 4–32px spacing vocabulary inside
components, then opens to 56–80px between major landing sections. The fixed
navigation is 72px high. It begins transparent and becomes a rounded,
backdrop-blurred porcelain bar after scrolling.

Responsive behavior is mobile-first. At the small breakpoint (640px), paired
metrics and content groups can form two columns. At the medium breakpoint
(768px), desktop navigation appears, headers can move side by side, and the
account drawer changes from a bottom sheet to a side panel. At the large
breakpoint (1024px), the playlist workspace becomes a three-fifths review area
and two-fifths export area, separated by a rule; landing demonstrations also
move into split compositions.

**The One Clear Split Rule.** Use a single structural divider to explain a
major workspace relationship; do not nest card grids when whitespace and one
rule can establish the hierarchy.

## Elevation & Depth

Encore is flat and bordered by default. Depth comes first from tonal surface
changes and one-pixel rules. Small controls may use a nearly invisible micro
shadow, while rare landing features receive a broad ambient lift. Dialogs,
drawers, select menus, and comboboxes use a fine foreground ring, a quiet
overlay, and brief scale or slide motion to separate temporary layers.

### Shadow Vocabulary

- **Micro Control:** A 1px vertical lift with 5% black for outlined controls
  and fields.
- **Ambient Feature:** A broad 24px-by-80px shadow at 6% black for landmark
  landing demonstrations and calls to action.

**The Flat-by-Default Rule.** A card does not receive a shadow merely because it
is a card. Elevation is reserved for temporary layers or a deliberately
featured moment.

## Shapes

The form language is gently geometric. Controls use compact 6–10px corners,
dialogs use 14px corners, and major cards use 16px corners. Pills are reserved
for compact badges and theme-like selectors. One-pixel borders define most
surfaces; dashed borders identify incomplete or empty working areas.

**The Radius Ladder Rule.** Keep controls tighter than cards and cards tighter
than pills. Do not apply the largest radius indiscriminately.

## Components

Components are quiet at rest and satisfying in response. Their default
appearance is neutral and compact; hover, press, focus, open, and selected
states provide the character.

### Buttons

- **Shape:** Compact, gently rounded controls with a consistent 36px default
  height.
- **Primary:** Graphite surface with Porcelain text; hover softens the fill and
  active press moves down by one pixel.
- **Outline:** Porcelain surface, Fog Border stroke, and a micro shadow; hover
  changes to Fog.
- **Ghost / Link:** Preserve layout without adding a surface until interaction.
- **Destructive:** Use a lightly tinted Error Red surface instead of a solid
  alarm block.
- **Focus:** Three-pixel Focus Halo ring with a visible border shift.

### Chips

- **Style:** Fully rounded, compact labels in filled, outline, destructive,
  ghost, or link variants.
- **State:** Use filled chips for strong status and outline chips for neutral
  evidence annotations.

### Cards / Containers

- **Corner Style:** Major cards use the 16px surface radius; metric tiles and
  overlays use the next tighter step.
- **Background:** Porcelain over Soft Porcelain or Graphite-based dark
  equivalents.
- **Shadow Strategy:** Flat by default; Ambient Feature only for landmark
  compositions.
- **Border:** One-pixel Fog Border, with dashed treatment for empty work areas.
- **Internal Padding:** Usually 16–20px, expanding to 24–32px for focused cards.

### Inputs / Fields

- **Style:** 36px height, compact horizontal padding, transparent or Porcelain
  fill, Fog Border stroke, and a micro shadow.
- **Focus:** Border shifts to Focus Halo with a three-pixel translucent ring.
- **Error / Disabled:** Error Red border and ring for invalid input; reduced
  opacity and blocked pointer interaction for disabled fields.

### Navigation

The fixed shell uses a compact Graphite brand mark, quiet Fog Ink links, and a
Graphite active state. On scroll it gains a rounded Porcelain surface, Fog
Border, micro shadow, and backdrop blur. Desktop links hide below 768px; the
account drawer carries navigation on smaller screens.

### Dialogs and Drawers

Dialogs use a centered Porcelain layer, a fine Graphite ring, 24px padding, and
a 100ms fade-and-scale transition. The account drawer uses a 450ms spring-like
slide, appearing as a bottom sheet on mobile and a right-side panel from the
medium breakpoint.

### Playlist Evidence Rows

Evidence rows align rank, track identity, supporting setlist evidence,
confidence, and optional action into stable columns. Dividers—not card
outlines—separate repeated rows. Confidence color communicates state while the
numeric value remains the primary evidence.

**The Satisfying Response Rule.** Every interactive component must answer hover,
keyboard focus, active press, selection, or open state without requiring
decorative animation at rest.

## Do's and Don'ts

### Do:

- **Do** keep Graphite, Porcelain, and Fog dominant on every operational screen.
- **Do** concentrate visual delight in interactive product demonstrations,
  evidence feedback, and purposeful state transitions.
- **Do** use borders, whitespace, and alignment before reaching for elevation.
- **Do** keep confidence, appearance counts, and review status easy to compare.
- **Do** preserve reduced-motion behavior for nonessential entrance animation.

### Don't:

- **Don't** use streaming-provider branding as Encore's ambient visual identity.
- **Don't** place an ambient shadow under every card or section.
- **Don't** scatter semantic colors as decoration when no state is being
  communicated.
- **Don't** substitute nested cards for a clear grid, divider, or whitespace
  relationship.
- **Don't** make a clean surface inert; interactive states should still feel
  deliberate and responsive.
