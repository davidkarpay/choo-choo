# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Choo-Choo USA** is an interactive storybook and simulation game about American railroads, built for kids. Players explore a living railroad world with steam engines that depart each morning, haul cargo and passengers across the country, and return to their roundhouse at night. The visual style targets **Disney's Beauty and the Beast (1991)** — warm, hand-painted 2D cartoon animation. This is NOT 3D, NOT flat vector, NOT modern minimalism.

The project is currently in the **specification phase**. All design documents live under `choo-choo-usa/`. No application code has been written yet.

## Repository Structure

```
Trains/
  CLAUDE_CODE_PROMPT.md    # Detailed build instructions and visual implementation strategy
  README.md                # Project overview and build order
  choo-choo-usa/           # The actual project (code goes here)
    docs/
      ARCHITECTURE.md      # Tech stack, project structure, simulation architecture
      STYLE_GUIDE.md       # Visual style bible — colors, fonts, animation, sound, UI
      STORY.md             # Narrative voice and world-building lore
    specs/
      PHASE_1_ROUNDHOUSE.md   # Phase 1 spec (build first)
      PHASE_2_NATIONAL_MAP.md # Phase 2 spec
      PHASE_3_SIMULATION.md   # Phase 3 spec
      PHASE_4_INTERIORS.md    # Phase 4 spec
      DATA_MODELS.md          # All TypeScript types and IndexedDB schema
    data/
      trains.json, routes.json, cargo.json, stations.json, passengers.json
```

## Build Commands

Scaffold the project (first time only):
```bash
cd choo-choo-usa
npm create vite@latest . -- --template react-ts
npm install pixi.js@^8 @pixi/particle-emitter zustand howler framer-motion dexie react-router-dom
npm install -D @types/howler
```

Once scaffolded:
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npx vitest           # Run unit tests
npx vitest run       # Run unit tests once (CI mode)
npx playwright test  # Run end-to-end tests
```

## Tech Stack

- **React 18+ / TypeScript / Vite** — core framework and build
- **PixiJS v8** — GPU-accelerated 2D rendering for all animated scenes (roundhouse, stations, train interiors). Uses `PIXI.Container` for depth layers, `PIXI.ParticleContainer` for smoke.
- **Leaflet.js + OpenStreetMap** — national railroad map (Phase 2). No Google Maps.
- **Zustand** — state management (simulation clock, train positions, cargo, passengers, player state)
- **Dexie.js (IndexedDB)** — persistent local storage for simulation save/resume
- **Framer Motion** — UI element transitions and overlay animations
- **Howler.js** — sound effects with spatial audio
- **Vitest** — unit tests; **Playwright** — e2e tests

## Critical Constraints

Read these before writing any code:

1. **NO 3D.** No Three.js, no WebGL 3D. PixiJS 2D only.
2. **Disney 1991 warmth.** Cozy, golden, hand-painted aesthetic. Every visual references `docs/STYLE_GUIDE.md`.
3. **Outlines on everything.** Foreground objects use `#1A1A2E` (Ink Black) outlines, 2-3px, slightly irregular. Never pure `#000000`.
4. **No linear animations. Ever.** All motion uses easing curves. Default: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
5. **Child-safe.** No violence, no danger, no scary content. Warm and wonder-filled.
6. **Accessible.** Min 44x44px touch targets, keyboard navigation, WCAG AA contrast, min 16px body text.
7. **60fps target.** Max 200 particles, max 50 animated sprites. Use object pooling. Cull off-screen.
8. **Paper texture everywhere.** UI panels have parchment feel, not flat white, not glassmorphism.
9. **Open source map data only.** Leaflet + OpenStreetMap, not Google Maps.
10. **Narrator voice.** All player-facing text uses the warm, wonder-filled voice from `docs/STORY.md`.

## Build Order

Phases are strictly sequential — complete each before starting the next:

1. **Phase 1: Roundhouse** (`specs/PHASE_1_ROUNDHOUSE.md`) — the opening scene, emotional heart. Build standalone first.
2. **Phase 2: National Map** (`specs/PHASE_2_NATIONAL_MAP.md`) — Leaflet map with moving trains, connect to Phase 1.
3. **Phase 3: Simulation** (`specs/PHASE_3_SIMULATION.md`) — cargo, passengers, industry simulation layer.
4. **Phase 4: Interiors** (`specs/PHASE_4_INTERIORS.md`) — train interior and station drilldown views.

## Architecture Key Points

**Scene navigation** works like turning storybook pages with page-turn or iris-wipe transitions (never hard cuts). The hierarchy: National Map → Roundhouse/Station/Moving Train → Train Interior detail views.

**Simulation tick loop** runs at 10 ticks/second regardless of speed multiplier (Pause/1x/5x/15x/60x). Each tick: advance clock → update train positions → check arrival/departure → generate cargo → generate passengers → update Zustand stores → trigger sounds.

**Time system**: 1 real second = 1 simulated minute at 1x. Day/night cycle drives visual changes (color overlays, lighting) and train behavior (depart morning, return evening).

**Programmatic sprites first**: Since illustrated assets don't exist yet, build all visuals with programmatic shapes (rounded rectangles, circles, gradients) that follow the style guide colors and proportions. These are "sketch versions," not ugly placeholders.

**Persistence**: Serialize simulation state to IndexedDB every 30 seconds or on pause. On load, offer resume or fresh start.

## Key Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Sunrise Gold | `#F4C542` | Morning light, highlights, UI accents |
| Warm Brick | `#C45B3E` | Train bodies, station buildings |
| Deep Forest | `#2D5A3D` | Landscapes, nature |
| Twilight Blue | `#1B3A5C` | Night sky, shadows, depth |
| Cream Parchment | `#FDF6E3` | Text backgrounds, UI panels |
| Ink Black | `#1A1A2E` | Outlines, text (NOT `#000000`) |
| Steam White | `#F0EDE4` | Smoke, steam, clouds |

## Fonts

| Role | Font | Usage |
|------|------|-------|
| Display/Titles | Playfair Display 700/900 | Scene titles, train names |
| Narrative | Lora 400/700 | Storybook narration |
| UI Labels | Nunito 600/700 | Buttons, badges, HUD |
| Data/Numbers | Fira Mono 400 | Quantities, coordinates, time |

## File Naming Conventions

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Styles: `kebab-case.css`
- Assets: `kebab-case` (e.g., `whistle-blast-01.mp3`)
- Data files: `kebab-case.json`

## Before Writing Code

Read ALL files in `docs/` and `specs/` first. The design documents are comprehensive and interconnected — the style guide, data models, and phase specs all reference each other. The `CLAUDE_CODE_PROMPT.md` at root level has the detailed build checklist and visual implementation strategy for programmatic shapes.
