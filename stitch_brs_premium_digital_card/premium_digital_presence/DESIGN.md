---
name: Premium Digital Presence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e5bdc1'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ab888c'
  outline-variant: '#5c3f43'
  surface-tint: '#ffb2bd'
  primary: '#ffb2bd'
  on-primary: '#670024'
  primary-container: '#ff4e7a'
  on-primary-container: '#5a001f'
  inverse-primary: '#bd0049'
  secondary: '#dcb8ff'
  on-secondary: '#480081'
  secondary-container: '#7701d0'
  on-secondary-container: '#dcb7ff'
  tertiary: '#afc6ff'
  on-tertiary: '#002d6d'
  tertiary-container: '#538dff'
  on-tertiary-container: '#002760'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9dd'
  primary-fixed-dim: '#ffb2bd'
  on-primary-fixed: '#400013'
  on-primary-fixed-variant: '#900036'
  secondary-fixed: '#efdbff'
  secondary-fixed-dim: '#dcb8ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6700b5'
  tertiary-fixed: '#d9e2ff'
  tertiary-fixed-dim: '#afc6ff'
  on-tertiary-fixed: '#001944'
  on-tertiary-fixed-variant: '#004299'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 480px
  stack-lg: 2rem
  stack-md: 1.5rem
  stack-sm: 1rem
  inset-md: 1.25rem
  gutter: 1rem
---

## Brand & Style

The design system is engineered to evoke a sense of high-tier professional exclusivity and technological forwardness. It targets a high-end corporate audience where the digital business card serves as the primary touchpoint for networking and credibility.

The visual style is a fusion of **Corporate Minimalism** and **Refined Glassmorphism**. By utilizing a rich, deep background, the system allows the vibrant brand gradient to act as a light source, creating a "glow-through" effect on glass-like surfaces. The aesthetic is clean and structured but avoids being sterile through the use of organic blurs and vibrant accents that suggest energy and movement.

## Colors

The palette is anchored by a "True Black" variant (#0A0A0A) to ensure maximum contrast for the OLED displays commonly used by the target demographic. 

- **Primary Gradient:** The signature Red-to-Purple-to-Blue transition is the hero of the system. It is reserved for high-impact elements like primary buttons, active states, and decorative borders.
- **Surface Strategy:** We use a secondary dark grey (#161616) for cards and containers to create depth against the background.
- **Typography:** Headlines use an off-white (#F5F5F5) to reduce eye strain while maintaining punchy contrast. Secondary information uses a muted grey to maintain visual hierarchy.

## Typography

This design system utilizes **Montserrat** exclusively to maintain brand consistency. The type scale is designed with a strong emphasis on headers to command attention.

- **Headlines:** Use Bold (700) or SemiBold (600) weights with slight negative letter-spacing to create a compact, "designed" look suitable for names and titles.
- **Body:** Regular (400) weight ensures high legibility for contact details and bios.
- **Labels:** Small caps with increased letter spacing are used for category tags or section headers (e.g., "CONTACT DETAILS") to provide clear structural signposts without cluttering the UI.

## Layout & Spacing

Since digital business cards are primarily viewed on mobile devices, the layout follows a **Fixed-Width Mobile-First** approach. The content is centered in a container that caps at 480px on desktop to maintain the "card" feel.

- **Grid:** A vertical stack model is used. Elements are separated by clear rhythmic intervals (16px, 24px, or 32px).
- **Safe Areas:** A minimum margin of 24px is maintained on the horizontal edges to ensure content doesn't feel cramped.
- **Alignment:** Center alignment is preferred for the profile header (photo, name, title), while contact lists and links follow a left-aligned or justified-grid pattern for easier scanning.

## Elevation & Depth

Hierarchy is achieved through **Tonal Stacking** and **Translucency**. 

1.  **Base:** The #0A0A0A background.
2.  **Mid-Ground:** Cards use #161616 with a 1px border. The border is either a solid dark grey or a subtle 20% opacity version of the brand gradient.
3.  **Top-Layer:** Interaction elements (modals/popovers) use glassmorphism with a `backdrop-filter: blur(12px)` and a white overlay at 5% opacity.
4.  **Shadows:** Shadows are rarely used; instead, we use "glows." High-priority items have a soft, low-opacity drop shadow tinted with the primary purple (#8A2BE2) to simulate a neon-backlit effect.

## Shapes

The shape language is "Soft-Modern." We avoid aggressive circularity for cards to maintain a corporate feel, but use full pills for interaction elements.

- **Cards:** Use `rounded-lg` (16px) to feel substantial and modern.
- **Buttons & Chips:** Use `rounded-xl` (24px) or full pills to make them feel touchable and distinct from structural containers.
- **Profile Frames:** Circular frames with a 2px stroke using the primary gradient.

## Components

### Buttons
- **Primary:** Full brand gradient background with white text. On hover, apply a `box-shadow` glow using the tertiary blue.
- **Secondary:** Transparent background with a 1.5px gradient border (ghost button style).

### Cards
- Surfaces should have a subtle 1px border (#ffffff at 10% opacity) to define edges against the dark background.
- Use a slight `linear-gradient` on the card background itself (from #1A1A1A to #111111) to add dimension.

### Input Fields
- Darker than the card surface (#0F0F0F). 
- Bottom-border focus state using the brand gradient.

### Profile Picture
- Must include a "Gradient Ring." The gap between the photo and the ring should be 3px of the background color to let the image breathe.

### Action Chips
- Small, pill-shaped tags for skills or categories. Dark background with a subtle purple glow or tint.

### Lists
- Contact rows should have a divider that doesn't span the full width, using a subtle grey-to-transparent fade.