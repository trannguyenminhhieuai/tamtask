# [WEB] Tammi OA (Copy) Design System

## Overview

This design system draft was generated from Figma and suggests a clear accent color for emphasis, a light and spacious background foundation, strong readable text contrast, structured layout patterns. It is intended as a working specification for UI generation, design system documentation, and AI-assisted layout exploration. Review semantic tokens and component rules before using it as a final source of truth.

---

## Colors

- Primary (#079455): Main call-to-action buttons, active highlights, and strong emphasis.
- Background (#FFFFFF): Page background and large canvas areas.
- Surface (#F8F8F8): Cards, panels, modals, and elevated containers.
- Text (#EE0033): Headings, body copy, and primary reading content.
- Border (#D7D7D7): Subtle dividers, input borders, and low-emphasis outlines.
- Muted Text (#9B9B9B): Secondary copy, helper text, and low-emphasis metadata.
- Supporting Color (#000000): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#EF0032): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#1D1D1D): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.

## Typography

- Headline Font: [Manual input required]
- Body Font: [Manual input required]
- No local text styles found

---

## Spacing

Base unit: **8px**
- xs: 4px — Tight inline gaps
- sm: 8px — Compact component spacing
- md: 16px — Default padding
- lg: 24px — Card padding and section gutters
- xl: 32px — Larger section spacing

## Border Radius

- sm: 4px — Small tags, chips, compact corners
- md: 8px — Buttons, inputs, cards
- lg: 12px — Panels, larger containers
- full: 9999px — Pills, avatars, circular elements

## Elevation

- Gentle, diffused shadows are recommended unless stronger hierarchy is clearly required.
- sm: Buttons, chips, small overlays.
- DEFAULT: Cards, dropdowns, standard floating surfaces.
- md: Elevated cards, side panels, larger floating regions.
- lg: Modals and high-priority overlay containers.

## Components

### Buttons
- **Primary**: #079455 fill, #FFFFFF text, no border, radius 8px.
- **Primary Hover**: #06854D fill, #FFFFFF text, no border.
- **Primary Focus**: #079455 fill, #FFFFFF text, 3px ring #0794551F.
- **Primary Disabled**: #079455 fill, #FFFFFF text, 40% opacity.

- **Secondary**: transparent fill, #EE0033 text, 1px #D7D7D7 border, radius 8px.
- **Secondary Hover**: #EE00330A fill, #EE0033 text, 1px #D7D7D7 border.
- **Secondary Focus**: transparent fill, #EE0033 text, 1px #079455 border, 3px ring #0794551F.
- **Secondary Disabled**: transparent fill, #9B9B9B text, 1px #D7D7D7 border, 40% opacity.

- **Ghost**: transparent fill, #9B9B9B text, no border, radius 8px.
- **Ghost Hover**: #EE003306 fill, #EE0033 text, no border.
- **Ghost Focus**: transparent fill, #EE0033 text, 3px ring #0794551F.
- **Ghost Disabled**: transparent fill, #9B9B9B text, no border, 40% opacity.

### Cards
- **Default**: #F8F8F8 fill, 1px #D7D7D7 border, radius 8px.
- **Elevated**: #F8F8F8 fill, soft elevation, radius 8px.
- **Large Panel**: #F8F8F8 fill, subtle border or elevation, radius 12px.

### Inputs
- **Default**: #F8F8F8 fill, 1px #D7D7D7 border, text color #EE0033, radius 8px.
- **Hover**: #F8F8F8 fill, 1px #B0B0B0 border, text color #EE0033.
- **Focus**: #F8F8F8 fill, 1px #079455 border, 3px ring #0794551F.
- **Error**: #F8F8F8 fill, 1px #EF4444 border, 3px ring #EF44441F.
- **Disabled**: #F8F8F8 fill, 1px #D7D7D7 border, text color #9B9B9B, 40% opacity.

### Layout Containers
- Use #F8F8F8 for contained regions.
- Use #FFFFFF for page-level background areas.
- Use 12px only for larger panels or special containers.
- Keep radii and spacing consistent across repeated containers.

---

## Layout Principles

- Use generous whitespace between sections and repeated content groups.
- Prefer card-based grouping for related content and modular page regions.
- Maintain spacing rhythm based on the 8px system.
- Keep page background and surface colors visually distinct when depth or grouping is needed.
- Reuse existing auto layout patterns instead of inventing one-off container structures.

## Do's and Don'ts

1. **Do** use #079455 for key interactive emphasis only.
2. **Do** keep page backgrounds consistent with #FFFFFF.
3. **Do** preserve strong readability with #EE0033 for core reading content.
4. **Do** maintain a compact, repeatable radius and spacing rhythm across repeated UI.
5. **Don't** introduce additional accent colors unless intentionally extending the system.
6. **Don't** use supporting colors as new CTA colors without explicitly defining their role.
7. **Don't** replace Primary with other extracted blues unless explicitly promoted to a semantic token.
8. **Don't** mix unrelated shadow styles or multiple border treatments without purpose.

## Extracted Source Notes

- Auto-generated from Figma on 2026-11-13.
- Source of truth: Figma file.
- File: [WEB] Tammi OA (Copy)
- Scope: Current Page
- Root nodes scanned: 25
- Auto layout containers found: 151
- This draft combines extracted signals with inferred semantic rules.
- Manual input required: Responsive
