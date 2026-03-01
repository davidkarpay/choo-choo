# Phase 1: The Roundhouse

**Priority: BUILD THIS FIRST.** This is the opening scene of the game and the emotional heart of the project. If this scene feels right, everything else follows.

---

## Scene Overview

The player sees the interior of a large, round brick building. Tracks radiate outward from a central turntable like spokes of a wheel. At the end of each track, a train rests in its berth. The building has a domed roof with skylights and a large central chimney. Warm light filters in.

The time of day (driven by the simulation clock) determines the state of the scene:

| Time | Scene State |
|------|-------------|
| Night (7pm - 5am) | Trains are sleeping. Low orange glow from banked fires. Quiet ambient sound. Stars visible through skylights. |
| Dawn (5am - 7am) | Trains begin waking up. Fires are stoked. First puffs of smoke. Building fills with steam. |
| Morning (7am - 9am) | Active departure sequence. Turntable rotates. Trains roll out one by one. Whistles blow. |
| Day (9am - 5pm) | Roundhouse is mostly empty. A few trains remain for maintenance. Roundhouse keeper sweeps. |
| Dusk (5pm - 7pm) | Trains return. Turntable receives them. Headlamps in the fading light. |

---

## Visual Elements

### Background Layers (parallax)

1. **Sky layer (far):** Visible through skylights and the open main door. Changes color/brightness with time of day. Stars at night. Clouds drift slowly.
2. **Building exterior (mid-far):** The curved brick walls, windows, the chimney. Warm brick color with mortar lines. Slightly desaturated to push it back.
3. **Building interior (main):** The tracks, the turntable, the berths. This is where the trains sit. Full saturation and detail.
4. **Foreground details (near):** Tools on hooks, oil cans, a broom leaning against a post, lanterns hanging from beams, the roundhouse keeper.

### The Turntable
- Centered in the scene
- A circular platform on a pit that rotates to align with each track spoke
- Animates smoothly when a train needs to enter or exit
- Has visible mechanical details: gears, rails, a control lever
- The roundhouse keeper operates it (walks to the lever, pulls it)

### Train Berths
- Each track spoke ends in a berth with subtle signage (the train's name on a wooden plaque)
- A small workbench and tool rack next to each berth
- Berth lighting: individual lanterns that glow warmer when occupied

### The Trains (Initial Roster -- 6 trains)
See `/data/trains.json` for full data. Each train is a PixiJS sprite with multiple animation states:

| Train | Color | Personality | Cargo Type |
|-------|-------|-------------|------------|
| Big Thunder | Deep red | Proud, strong, reliable | Coal and minerals |
| Daisy Belle | Powder blue with white trim | Cheerful, social, punctual | Passengers |
| Iron Mike | Dark green | Scrappy, tough, compact | Helper engine (assists others) |
| Starlight Express | Midnight purple with silver stars | Graceful, quiet, nocturnal | Refrigerated food |
| Old Faithful | Faded gold/brown | Wise, steady, enduring | Grain |
| Copper King | Burnt orange and black | Serious, long, methodical | Fuel and automobiles |

### Smoke and Steam
- Each waking train emits smoke from its smokestack
- Smoke particles follow the parameters in the Style Guide
- Steam hisses from pressure valves (smaller, faster particles)
- The building fills with a subtle haze during peak morning activity (overlay layer at low opacity)

---

## Interactions

### Clickable Elements

| Element | Action |
|---------|--------|
| Any train | Opens a detail panel with the train's name, personality description, current assignment, and cargo manifest. "Follow this train" button transitions to the National Map, centered on this train. |
| The turntable | If a train is departing, clicking the turntable shows a close-up of the rotation mechanism. Otherwise, a narrator tooltip explains what it does. |
| The roundhouse keeper | A narrator tooltip introduces him and explains his role. |
| Tools and objects | Narrator tooltips with fun facts about railroad maintenance. |

### Keyboard / Accessibility
- Arrow keys pan the scene left/right
- Tab cycles through clickable elements
- Enter/Space activates the focused element
- Escape closes any open panel

### Camera
- The scene is wider than the viewport
- Player can pan left/right by dragging, scrolling, or using arrow keys
- Subtle parallax as the camera moves
- Double-click or pinch-to-zoom on a train to zoom in

---

## Animation Sequences

### Morning Departure Sequence (the signature moment)

This is the "wow" moment of Phase 1. When the simulation clock hits 7am, the departure sequence plays:

1. **Fires stoke** (0:00-0:10): The orange glow in each firebox brightens. Sounds: crackling, shoveling coal.
2. **Boilers warm** (0:10-0:20): Steam begins rising. The trains start to hum. Pressure gauges (visible on close-up) climb.
3. **First puffs** (0:20-0:30): Smokestacks begin puffing. Slow at first. *Pff... pff...*
4. **Whistles** (0:30-0:35): Big Thunder blows his whistle. Then Daisy Belle. Then the others, in sequence. Each whistle is distinct.
5. **Turntable activates** (0:35-0:45): The turntable rotates to align with the first departure track. Mechanical sounds: grinding gears, clunking.
6. **First departure** (0:45-1:00): Big Thunder rolls onto the turntable. The turntable rotates to face the main exit track. Big Thunder rolls out through the main door into the morning light. His puffing accelerates as he picks up speed: *pff-pff-pff-pff-PFF-PFF-PFF...*
7. **Subsequent departures** (1:00+): Each train departs in order, with the turntable rotating between each. Some trains exchange playful whistles.

The player can click "Skip" to jump to the post-departure state.

### Night Return Sequence

The reverse: trains return one by one as the light fades. Each train's headlamp is visible approaching from the main line. The turntable receives each one and rotates them to their berth. The roundhouse keeper checks each train with his lantern. Fires are banked. Quiet settles in.

---

## Technical Implementation Notes

### PixiJS Setup
- Create a PixiJS Application with a canvas that fills the scene area
- Use `PIXI.Container` hierarchy for depth layers
- Use `PIXI.ParticleContainer` for smoke particles (performance)
- Use `PIXI.AnimatedSprite` for character and wheel animations
- Render at native resolution, scale to fit viewport

### Sprite Assets Needed
For Phase 1, the following sprite assets need to be created (can use programmatic shapes initially and replace with illustrated assets later):

- 6 train sprites (side view) with animation frames: idle, warming-up, slow-chug, fast-chug
- Roundhouse background layers (4 layers)
- Turntable (top-down-ish, slight perspective)
- Roundhouse keeper (idle, walking, pulling-lever, checking-train)
- Smoke particle sprites (3-4 variants)
- Tool/object decorations (lanterns, brooms, oil cans, name plaques)
- UI panel backgrounds

### Programmatic Placeholder Strategy
Since hand-illustrated sprite assets take time, build the scene first with **programmatic shapes**:
- Trains: Rounded rectangles with circles for wheels, a trapezoid smokestack, circle headlamp
- Building: Rectangle walls, arc windows, triangle/arc roof sections
- Turntable: Concentric circles with line spokes
- People: Simple stick-figure with circle head, colored clothing rectangles

Use CSS custom properties or PixiJS tint to match the style guide colors. The shapes should be charming and readable, not ugly placeholders. Think of them as the "sketch" version of the final illustrations.

### Performance Budget
- Target: 60fps on a 2020 mid-range laptop
- Max particles on screen: 200
- Max animated sprites: 50
- Use object pooling for smoke particles
- Cull off-screen sprites
