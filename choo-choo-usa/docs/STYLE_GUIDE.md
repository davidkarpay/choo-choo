# Visual Style Guide

## Aesthetic North Star

**Disney's Beauty and the Beast (1991).** Specifically: the warmth of the village morning scene, the golden glow of the ballroom, the misty depth of the forest, and the cozy interior of Belle's cottage. This is traditional 2D animation with hand-painted backgrounds and expressive character work.

This is NOT:
- Flat vector illustration (no Figma/Dribbble minimalism)
- 3D rendered (no Pixar/DreamWorks CGI (Computer Generated Imagery))
- Pixel art or retro game style
- Modern "corporate Memphis" illustration
- Anime or manga style

This IS:
- Warm, painterly backgrounds with visible brushwork texture
- Bold ink outlines on characters and objects (2-4px weight, slightly uneven)
- Rich, saturated color palettes with atmospheric depth
- Soft ambient lighting with warm highlights and cool shadows
- Expressive, slightly exaggerated proportions (friendly, not realistic)
- Layered parallax depth in every scene

---

## Color Palette

### Primary Palette (Warm Foundation)

| Name | Hex | Usage |
|------|-----|-------|
| Sunrise Gold | `#F4C542` | Morning light, highlights, UI accents |
| Warm Brick | `#C45B3E` | Train bodies, station buildings, warmth |
| Deep Forest | `#2D5A3D` | Landscapes, trees, nature backgrounds |
| Twilight Blue | `#1B3A5C` | Night sky, shadows, depth |
| Cream Parchment | `#FDF6E3` | Text backgrounds, UI panels, paper texture |
| Ink Black | `#1A1A2E` | Outlines, text, strong shadows |

### Secondary Palette (Accent Colors)

| Name | Hex | Usage |
|------|-----|-------|
| Steam White | `#F0EDE4` | Smoke, steam, clouds (with transparency) |
| Rail Silver | `#8C8C8C` | Train tracks, metal details |
| Signal Red | `#D64045` | Signals, warning lights, caboose |
| Lantern Orange | `#E8913A` | Warm interior light, lanterns, headlamps |
| River Blue | `#5B98B5` | Water, rivers on map, clear sky |
| Wheat Gold | `#D4A843` | Fields, cargo (grain), prairie |
| Coal Dark | `#2E2E38` | Coal cars, engine details, dark metal |

### Atmospheric Modifiers

Scenes shift color temperature based on time of day in the simulation:

| Time | Temperature | Overlay |
|------|-------------|---------|
| Dawn (5am-7am) | Cool pink-gold | `rgba(255, 180, 140, 0.15)` |
| Morning (7am-11am) | Warm neutral | None (base palette) |
| Midday (11am-2pm) | Bright warm | `rgba(255, 255, 200, 0.08)` |
| Afternoon (2pm-5pm) | Golden warm | `rgba(255, 200, 100, 0.12)` |
| Dusk (5pm-7pm) | Deep amber-purple | `rgba(180, 100, 60, 0.20)` |
| Night (7pm-5am) | Cool blue-black | `rgba(20, 30, 60, 0.35)` |

---

## Typography

### Font Stack

| Role | Font | Fallback | Weight | Usage |
|------|------|----------|--------|-------|
| Display / Titles | **Playfair Display** | Georgia, serif | 700, 900 | Scene titles, train names, chapter headings |
| Narrative Text | **Lora** | "Times New Roman", serif | 400, 400 italic, 700 | Storybook narration, descriptions |
| UI Labels | **Nunito** | "Trebuchet MS", sans-serif | 600, 700 | Buttons, badges, data labels, HUD (Heads-Up Display) |
| Data / Numbers | **Fira Mono** | "Courier New", monospace | 400 | Cargo quantities, coordinates, time display |

All fonts are available via Google Fonts (free, open source).

### Text Styling

- Narrative text appears on parchment-textured panels with a subtle drop shadow
- Display titles use a slight text-shadow to simulate hand-lettering depth: `text-shadow: 1px 2px 0px rgba(26, 26, 46, 0.3)`
- All text meets WCAG (Web Content Accessibility Guidelines) AA contrast minimums
- Minimum font size: 16px for body text, 14px for UI labels (mobile: 18px / 16px)
- Line height: 1.6 for narrative text, 1.3 for UI labels

---

## Illustration Style

### Outlines
- All foreground objects (trains, buildings, people, animals) have visible ink outlines
- Outline weight: 2-3px for large objects, 1-2px for small details
- Outline color: `#1A1A2E` (Ink Black), NOT pure black `#000000`
- Outlines are slightly irregular/wobbly, never perfectly smooth -- this is hand-drawn, not vector
- Use CSS `filter: url(#roughen)` with an SVG (Scalable Vector Graphics) filter to add subtle wobble to programmatic outlines

### Backgrounds
- Painted/textured, never flat solid colors
- Use layered semi-transparent gradients and noise textures to simulate watercolor
- Distant objects are cooler and less saturated (atmospheric perspective)
- Near objects are warmer and more saturated
- Apply a subtle paper grain texture overlay to all scenes: `background-blend-mode: multiply` with a noise PNG (Portable Network Graphics) at 3-5% opacity

### Depth Layers (Parallax)
Every scene has at minimum 4 depth layers that move at different speeds during panning:

| Layer | Speed | Content |
|-------|-------|---------|
| Far background | 0.2x | Sky, distant mountains, clouds |
| Mid background | 0.5x | Trees, distant buildings, hills |
| Main layer | 1.0x | Trains, tracks, stations, people |
| Foreground | 1.3x | Grass, flowers, fence posts, signs |

### Characters (People)
- Simplified but expressive (think Disney background characters, not main cast complexity)
- 3-4 head-tall proportions (slightly chibi / stylized)
- Visible facial expressions even at small sizes: dot eyes, simple curved mouths
- Clothing indicates their role: conductor hat, business suit, backpack traveler, family with kids
- Idle animations: breathing, looking around, checking watch, reading

### Trains
- Each train has a distinct personality expressed through its shape and color
- Steam engines are rounded, chunky, and friendly-looking -- NOT menacing or hyper-realistic
- Smoke stacks are exaggerated (taller and wider than real life)
- Wheels have visible connecting rods that animate
- Headlamps glow warmly
- Each train has painted name lettering on its side (e.g., "Big Red", "Starlight Express", "Old Faithful")

---

## Animation Principles

Follow the classic Disney animation principles, adapted for interactive web:

### 1. Squash and Stretch
- Train wheels compress slightly at the contact point
- Smoke puffs expand and compress as they rise
- UI buttons squash on press, stretch on release

### 2. Anticipation
- Before a train departs: a brief backward rock, then forward lurch
- Before a whistle blows: the train's smokestack tilts slightly
- UI elements wind up before animating in

### 3. Follow-Through and Overlapping Action
- When a train stops: cars bunch up slightly then settle
- Smoke continues moving after the train stops
- Passenger hair and clothing lag behind movement

### 4. Slow In, Slow Out (Easing)
- ALL animations use easing. NEVER use linear timing.
- Default easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad)
- Entrances: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot/bounce)
- Exits: `cubic-bezier(0.55, 0.06, 0.68, 0.19)` (ease-in)

### 5. Arcs
- Smoke particles follow arc paths, not straight lines
- People walking follow slight bobbing arcs
- Camera panning follows smooth curves, never linear slides

### 6. Secondary Action
- While a train chugs: smoke puffs, connecting rods cycle, headlamp bobs, coal rattles
- While people board: conductor waves, other passengers peer out windows
- While at station: birds flutter, flags ripple, station clock ticks

---

## Smoke and Steam Effects

Steam is a signature visual element. It must look warm, soft, and playful -- like cotton candy, not industrial pollution.

### Smoke Puff Particle System Parameters
```
Emission rate: 3-5 puffs per second (scales with train speed)
Initial size: 20-30px
Final size: 80-120px (expand as they rise)
Lifetime: 2-4 seconds
Rise speed: 40-80px/second (randomized)
Drift speed: 10-30px/second (wind direction)
Opacity: Start 0.7, fade to 0.0
Color: #F0EDE4 (Steam White) with slight warm tint
Shape: Soft circle with feathered edges (use radial gradient)
Rotation: Slow random rotation (0.5-2 degrees/frame)
Overlap: Puffs overlap to create billowy mass
Rhythm: Puffs sync with the "chug" cycle (one puff per chug)
```

### Whistle Steam
When a train blasts its whistle, a horizontal jet of steam shoots from the whistle valve:
- Duration: 1-3 seconds
- Direction: perpendicular to the train, slight upward arc
- Particles are smaller and faster than smokestack puffs
- Accompanied by the whistle sound effect

---

## Sound Design

### Sound Categories

| Category | Examples | Behavior |
|----------|----------|----------|
| Ambient | Wind, birds, distant trains, station bustle | Loops continuously, volume by proximity |
| Mechanical | Chug loops, wheel clacking, coupling clanks | Synced to animation, pitch varies with speed |
| Signals | Whistle blasts, horn blows, bell rings | Triggered by events, spatial positioning |
| Human | Crowd murmur, "All aboard!", laughter, snoring | Triggered by context, randomized selection |
| UI | Page turns, panel slides, button clicks | Immediate response, short and satisfying |

### Audio Implementation Notes
- All sounds need at least 3 variants to avoid repetition fatigue
- Mechanical sounds pitch-shift based on train speed (lower pitch = slower)
- Spatial audio: sounds are louder and panned based on screen position
- Master volume control and per-category volume sliders in settings
- Respect system "reduced motion" preference by reducing ambient audio complexity

---

## UI Panel Design

All UI overlays (info panels, cargo manifests, passenger lists) use a "storybook page" aesthetic:

- Background: Cream parchment color with paper texture
- Border: 3px ink-style border with slightly rounded corners (8px radius)
- Shadow: Warm drop shadow `4px 6px 12px rgba(26, 26, 46, 0.25)`
- Header text: Playfair Display, Ink Black
- Body text: Lora, dark brown `#3E2F1C`
- Close button: A small hand-drawn "X" in the top-right corner, with hover grow
- Entry animation: Slide up from bottom with overshoot bounce
- Exit animation: Fade down and out

### Buttons
- Background: Warm Brick or Sunrise Gold
- Text: Cream Parchment or Ink Black
- Border: 2px Ink Black
- Border radius: 6px
- Hover: Scale 1.05, slight brightness increase
- Active: Scale 0.95 (squash)
- Font: Nunito 700

---

## Map Styling

The Leaflet map needs a custom look that matches the storybook world, not a standard road map.

### Tile Treatment
- Use a watercolor-style tile layer. Options:
  - Stamen Watercolor tiles (if still available) as a base
  - OR apply CSS filters to standard OpenStreetMap (OSM) tiles: `filter: sepia(30%) saturate(120%) brightness(105%) contrast(90%)`
  - Add a paper texture overlay on top of the tile layer at low opacity

### Track Rendering
- Rail corridors drawn as thick dashed lines: `stroke-width: 4`, `stroke-dasharray: 12 6`
- Color: `#8C8C8C` (Rail Silver) with `#1A1A2E` outline
- Hover: Track glows with Sunrise Gold
- Active/selected track: Solid line with slight pulse animation

### Station Markers
- Custom markers that look like hand-drawn dots with a building icon
- Size scales with station importance (major hub = larger)
- Hover: Name tooltip in Playfair Display on a parchment tag
- Click: Opens station detail panel or transitions to Station Scene

### Train Markers on Map
- Small train icons (32x32px at default zoom) facing the direction of travel
- Subtle smoke trail behind each train (CSS pseudo-element or SVG)
- Click: Opens train detail panel or transitions to Train Interior Scene
- At high zoom: train icon grows and shows more detail (name, cargo type badge)

---

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Desktop (1024px+) | Full layout, side panels, detailed HUD |
| Tablet (768-1023px) | Collapsible panels, bottom-sheet navigation |
| Mobile (below 768px) | Full-screen scenes, swipe navigation, minimal HUD |

All touch targets: minimum 44x44px. All interactive elements have visible focus states for keyboard navigation.

---

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `TrainMarker.tsx`)
- Utilities: `camelCase.ts` (e.g., `pathfinding.ts`)
- Styles: `kebab-case.css` (e.g., `storybook-panels.css`)
- Assets: `kebab-case` with descriptive names (e.g., `whistle-blast-01.mp3`, `roundhouse-bg-layer-far.png`)
- Data files: `kebab-case.json` (e.g., `cargo-types.json`)
