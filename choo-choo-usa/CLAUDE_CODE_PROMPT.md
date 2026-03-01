# Claude Code: Build Instructions

## How to Use This Repository

This repository contains the complete design specification for **Choo-Choo USA**, an interactive storybook and simulation game about American railroads. Your job is to build it.

**Before writing any code**, read every file in this repository:

1. `README.md` -- Project overview and constraints
2. `docs/ARCHITECTURE.md` -- Tech stack, project structure, scene navigation, simulation architecture
3. `docs/STYLE_GUIDE.md` -- Visual bible (colors, typography, animation, sound, UI design, map styling)
4. `docs/STORY.md` -- Narrative voice, character personalities, world-building lore
5. `specs/PHASE_1_ROUNDHOUSE.md` -- Phase 1 detailed spec (build first)
6. `specs/PHASE_2_NATIONAL_MAP.md` -- Phase 2 detailed spec
7. `specs/PHASE_3_SIMULATION.md` -- Phase 3 detailed spec
8. `specs/PHASE_4_INTERIORS.md` -- Phase 4 detailed spec
9. `specs/DATA_MODELS.md` -- TypeScript types, database schema, data relationships
10. `data/*.json` -- Seed data files (trains, routes, cargo, stations, passenger names)

---

## Phase 1 Build Checklist

Start with Phase 1 only. Do not build Phases 2-4 until Phase 1 is working and reviewed.

### Step 1: Scaffold the Project
```bash
npm create vite@latest choo-choo-usa -- --template react-ts
cd choo-choo-usa
npm install pixi.js@^8 @pixi/particle-emitter zustand howler framer-motion dexie react-router-dom
npm install -D @types/howler
```

### Step 2: Configure the Foundation
- Set up the project structure as described in `docs/ARCHITECTURE.md`
- Create the TypeScript types from `specs/DATA_MODELS.md`
- Set up CSS custom properties for the color palette from `docs/STYLE_GUIDE.md`
- Import Google Fonts: Playfair Display, Lora, Nunito, Fira Mono
- Create the Zustand stores (simulation clock, train state, player state)
- Set up React Router with placeholder routes for each scene

### Step 3: Build the Roundhouse Scene
Follow `specs/PHASE_1_ROUNDHOUSE.md` exactly:

1. Create the PixiJS application and mount it in the React component
2. Build the 4 parallax background layers (programmatic shapes first, illustrated assets later)
3. Build the turntable (concentric circles, rotation animation)
4. Build the 6 train sprites (programmatic shapes matching the color schemes in `data/trains.json`)
5. Implement the smoke particle system (follow parameters in `docs/STYLE_GUIDE.md`)
6. Connect the simulation clock to drive time-of-day visuals
7. Build the morning departure animation sequence
8. Build the night return animation sequence
9. Add click handlers for trains, turntable, and objects
10. Add the narrator text overlay for tooltips and descriptions
11. Add sound effects (use placeholder/generated tones if audio files are not available)

### Step 4: Polish Phase 1
- Implement keyboard navigation and accessibility
- Add the simulation speed controls (pause, 1x, 5x, etc.)
- Test at different viewport sizes
- Ensure 60fps performance
- Add page-transition placeholder (for when we connect to Phase 2)

---

## Visual Implementation Strategy

Since hand-illustrated sprite assets do not exist yet, use **programmatic shapes** that follow the style guide:

### Trains (Programmatic)
Draw each train as a composed shape:
- Body: rounded rectangle, filled with the train's primary color, 2px Ink Black outline
- Cab: smaller rounded rectangle on top, secondary color
- Smokestack: trapezoid on top of cab, accent color
- Headlamp: small circle on the front, Lantern Orange with glow effect
- Wheels: circles along the bottom, Coal Dark with Rail Silver rims
- Connecting rods: thin lines between wheels that animate in a circular motion
- Name: text on the body side in Playfair Display, Cream Parchment color

### Roundhouse (Programmatic)
- Walls: large arc shapes, Warm Brick color with darker mortar-line grid pattern
- Windows: yellow-filled arcs with Ink Black frames
- Tracks: parallel lines in Rail Silver, with wooden crossties (short perpendicular brown lines)
- Turntable: concentric circles, the inner one rotates
- Roof: darker arc on top with skylights (lighter rectangles)
- Floor: slightly textured brown-gray

### Smoke (Particle System)
- Each particle: a radial gradient circle, Steam White center fading to transparent
- Apply slight random tint variation (some warmer, some cooler)
- Particles expand, drift, and fade as described in the style guide

### People (Programmatic)
- Circle head
- Rectangle body (colored by role/clothing)
- Simple stick legs
- Optional circle for hat, rectangle for bag
- Minimal but recognizable and charming

---

## Critical Reminders

1. **NO 3D.** This is a 2D project. Do not import Three.js or any WebGL 3D library.
2. **Disney 1991 warmth.** The visual tone is cozy, golden, hand-painted. Not sleek, not modern, not minimalist.
3. **Outlines on everything.** Foreground objects have visible dark outlines. This is a cartoon, not a photograph.
4. **Easing on everything.** No linear animations. Ever. All motion uses easing curves.
5. **Sound matters.** Even with placeholder sounds, the timing of whistles, chugging, and clicks adds enormous life.
6. **The narrator voice.** When writing tooltip/description text, match the warm, specific, wonder-filled voice from `docs/STORY.md`.
7. **Paper texture.** All UI panels have a subtle paper/parchment feel. Not flat white. Not glass morphism.
8. **Performance.** Target 60fps. Use object pooling for particles. Cull off-screen sprites.
9. **Child-safe.** Everything warm, wonderful, and educational. No danger, no violence, no scary elements.
10. **Abbreviations.** Always define abbreviations on first use in any UI text or narrator text visible to the player.
