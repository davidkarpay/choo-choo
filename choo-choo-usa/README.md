# Choo-Choo USA

**An interactive storybook and simulation game about America's railroad industry, built for kids.**

A father-son project: an illustrated, animated, interactive web experience where players explore a living railroad world. Steam engines wake up in their roundhouse each morning, chug out across the country pulling cargo and passengers, and return home at night. Players can zoom from a national map all the way down to individual train cars, stations, and the people riding inside.

The visual style is **hand-painted 2D cartoon animation** inspired by Disney's *Beauty and the Beast* (1991) -- warm watercolor backgrounds, bold ink outlines, expressive character animation, and rich saturated color. This is NOT 3D. This is NOT flat vector. This is storybook illustration brought to life.

---

## For Claude Code: Build Instructions

This repository contains the complete specification for building Choo-Choo USA. Read every file in `/docs/` and `/specs/` before writing any code. The documents are organized as follows:

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | Technical architecture, tech stack, project structure |
| `docs/STYLE_GUIDE.md` | Visual style bible -- colors, typography, animation principles |
| `docs/STORY.md` | The narrative and world-building lore |
| `specs/PHASE_1_ROUNDHOUSE.md` | Phase 1: The Roundhouse scene (build this first) |
| `specs/PHASE_2_NATIONAL_MAP.md` | Phase 2: National map with moving trains |
| `specs/PHASE_3_SIMULATION.md` | Phase 3: Cargo, passengers, industry database |
| `specs/PHASE_4_INTERIORS.md` | Phase 4: Train interiors and station scenes |
| `specs/DATA_MODELS.md` | All data structures, schemas, and relationships |
| `data/trains.json` | Seed data for the train roster |
| `data/routes.json` | Seed data for major US rail corridors |
| `data/cargo.json` | Seed data for cargo types and industries |
| `data/stations.json` | Seed data for major stations |

### Build Order

1. Read ALL docs and specs first
2. Build Phase 1 (Roundhouse) as a standalone scene
3. Build Phase 2 (National Map) and connect it to Phase 1
4. Build Phase 3 (Simulation layer) on top of Phases 1-2
5. Build Phase 4 (Interiors) as drilldown views

### Critical Constraints

- **No 3D libraries.** No Three.js, no WebGL 3D. This is a 2D project.
- **Disney 1991 aesthetic.** Every visual decision references the style guide.
- **Child-safe.** No violence, no danger, no scary content. Warm and wonder-filled.
- **Accessible.** Large click/tap targets, readable text, keyboard navigation.
- **Performance.** Smooth 60fps (frames per second) animation on mid-range devices.
- **Open source map data.** Use OpenStreetMap / Leaflet, not Google Maps.
