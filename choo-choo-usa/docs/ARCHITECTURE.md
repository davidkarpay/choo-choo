# Architecture

## Tech Stack

### Core Framework
- **React 18+** with TypeScript
- **Vite** for build tooling and dev server
- **React Router** for navigation between scenes

### 2D Rendering and Animation
- **PixiJS v8** -- the primary 2D rendering engine for all animated scenes (roundhouse, train interiors, station platforms). PixiJS provides GPU-accelerated 2D rendering via WebGL/WebGPU with a Canvas fallback, sprite animation, particle effects (smoke, steam, sparks), and parallax scrolling.
- **Framer Motion** -- for UI (user interface) element transitions, modal animations, and overlay panels.
- **CSS Animations** -- for simple UI state changes (button hovers, panel slides).

### Mapping
- **Leaflet.js** with **OpenStreetMap** tiles for the national railroad map. Leaflet is open source, lightweight, and supports custom tile layers, markers, polylines (for track routes), and smooth zoom/pan. Use a **custom tile style** that matches the storybook aesthetic (see Style Guide for tile styling instructions).
- **GeoJSON** for storing rail corridor geometry.

### State Management
- **Zustand** -- lightweight, minimal boilerplate. Stores the simulation clock, train positions, cargo manifests, passenger rosters, and player navigation state.

### Data Layer
- **Static JSON seed files** (in `/data/`) loaded at startup for the initial dataset.
- **IndexedDB** (via **Dexie.js**) for persistent local storage of simulation state, allowing players to save and resume their railroad world. IndexedDB is an in-browser database Application Programming Interface (API) that persists data across sessions.

### Audio
- **Howler.js** for sound effects -- train whistles, horn blasts, chugging, station announcements, ambient crowd noise. Supports spatial audio for positional sound as the player pans around scenes.

### Testing
- **Vitest** for unit tests
- **Playwright** for end-to-end tests

---

## Project Structure

```
choo-choo-usa/
  README.md
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  docs/                          # You are here
  specs/
  data/
    trains.json
    routes.json
    cargo.json
    stations.json
    passengers.json
  public/
    fonts/
    audio/
      whistles/
      horns/
      chug-loops/
      ambient/
    tiles/                       # Custom map tile overlays
  src/
    main.tsx                     # App entry point
    App.tsx                      # Router and scene switching
    types/                       # TypeScript type definitions
      train.ts
      cargo.ts
      passenger.ts
      station.ts
      route.ts
      simulation.ts
    stores/                      # Zustand state stores
      useSimulationStore.ts      # Master simulation clock and state
      useTrainStore.ts           # Train positions, statuses, route progress
      useRouteStore.ts           # Rail corridor data and selection
      useStationStore.ts         # Station data and selection
      usePlayerStore.ts          # Player navigation, camera, preferences
      useCargoStore.ts           # Cargo manifests and deliveries (Phase 3)
      usePassengerStore.ts       # Passenger database and journeys (Phase 3)
    scenes/                      # Major interactive views
      roundhouse/
        RoundhouseScene.tsx      # Main roundhouse PixiJS canvas
        RoundhouseBackground.ts  # Parallax background layers
        TrainBerth.ts            # Individual train sleeping berth
        SmokeEffect.ts           # Particle system for smoke/steam
        WakeUpSequence.ts        # Morning departure animation
      national-map/
        NationalMapScene.tsx     # Leaflet map with all layers and HUD
        TrackLayer.tsx           # GeoJSON rail corridor rendering
        TrainMarker.tsx          # Animated train icons on map
        StationMarker.tsx        # Station dot markers with labels
        FollowControl.tsx        # Auto-pan map to followed train
        MapDetailPanels.tsx      # Train/station/corridor detail panels
      station/
        StationScene.tsx         # Station platform PixiJS view
        PlatformView.ts         # People boarding/deboarding
        StationBuilding.ts      # Station architecture
        Crowd.ts                # Animated crowd of people
      train-interior/
        TrainInteriorScene.tsx   # Inside-the-train PixiJS view
        PassengerCar.ts         # Sleeping, eating, talking passengers
        CargoCar.ts             # Cargo hold visualization
        LocomotiveCab.ts        # Engineer's cab view
    components/                  # Shared UI components
      ui/
        Panel.tsx               # Storybook-styled info panel
        Button.tsx              # Hand-drawn style button
        Badge.tsx               # Cargo/status badges
        Clock.tsx               # Simulation time display
        Narrator.tsx            # Storybook text overlay
      hud/
        TopBar.tsx              # Navigation and simulation controls
        CargoManifest.tsx       # What this train is carrying
        PassengerList.tsx       # Who is riding this train
        IndustryPanel.tsx       # Industry overview dashboard
    engine/                      # Simulation logic (non-visual)
      simulation.ts             # Master simulation tick loop
      pathfinding.ts            # Train routing along corridors
      scheduling.ts             # Departure/arrival scheduling
      cargo-generation.ts       # Spawning cargo demands
      passenger-generation.ts   # Spawning passenger journeys
    utils/
      geo.ts                    # Geographic calculations
      time.ts                   # Simulation time helpers
      animation.ts              # Shared animation utilities
      sound.ts                  # Audio manager wrapper
    styles/
      globals.css               # CSS custom properties, reset
      storybook.css             # Storybook-specific styles
      map.css                   # Map overlay styles
```

---

## Scene Navigation

The player moves between scenes like turning pages in a storybook. Transitions use a page-turn or iris-wipe animation, never hard cuts.

```
National Map (home view)
  |
  +---> Roundhouse (click a roundhouse icon on the map)
  |       |
  |       +---> Individual Train Detail (click a train in the roundhouse)
  |
  +---> Station (click a station dot on the map)
  |       |
  |       +---> Platform View (people boarding/deboarding)
  |
  +---> Moving Train (click a train icon on the map)
          |
          +---> Train Interior (click "Look Inside")
                  |
                  +---> Passenger Car
                  +---> Cargo Car
                  +---> Locomotive Cab
```

---

## Simulation Architecture

The simulation runs on a virtual clock that the player can speed up, slow down, or pause.

### Time System
- 1 real second = 1 simulated minute (at 1x speed)
- Speed options: Pause, 1x, 5x, 15x, 60x
- Day/night cycle affects visuals (roundhouse lights up at night, map darkens)
- Trains follow schedules tied to simulation time

### Tick Loop
Every simulation tick (runs at 10 ticks per second regardless of speed):
1. Advance simulation clock
2. Update train positions along their routes
3. Check for arrival/departure events
4. Generate new cargo demands
5. Generate new passenger journeys
6. Update UI state via Zustand stores
7. Trigger sound effects for events in the current view

### Persistence
- On pause or every 30 seconds: serialize simulation state to IndexedDB
- On load: check IndexedDB for saved state, offer to resume or start fresh
