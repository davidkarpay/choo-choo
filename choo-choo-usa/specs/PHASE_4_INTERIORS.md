# Phase 4: Train Interiors and Station Scenes

**Build after Phase 3.** These are the "zoom all the way in" views -- the human-scale scenes where the player sees individual people, cargo, and the inside of trains and stations.

---

## Train Interior Scene

Accessed by clicking "Look Inside" on any train from the National Map or Roundhouse.

### Layout
A side-view cross-section of the train, scrollable horizontally. The train exterior is "cut away" so the player can see inside each car. The scene scrolls from locomotive at the front to caboose at the rear.

### Car Types

#### Locomotive Cab
- The engineer sits at the controls (throttle lever, brake, gauges)
- The fireman shovels coal into the firebox (animated)
- The firebox glows orange
- Gauges show: speed, boiler pressure, water level
- Through the front window: an animated parallax view of the landscape rushing past

#### Passenger Coach
- Rows of seats facing forward, 2-3 passengers visible per row
- Each passenger is doing their activity (reading, sleeping, talking, looking out window)
- Clicking a passenger shows their name, origin, destination, and a narrator sentence about them
- Window views show the landscape scrolling past
- Ceiling lights glow warm

#### Dining Car
- Tables with white tablecloths
- Passengers eating (plates of food visible)
- A waiter carrying a tray
- Kitchen visible at one end with a cook
- Narrator describes what is being served today

#### Sleeper Car
- Fold-down bunk beds along the walls
- Curtains (some drawn, some open)
- Passengers sleeping, reading with a small lamp, or sitting on the edge of their bunk
- Night-time lighting (dim blue-ish with warm reading lamp spots)

#### Cargo Car (Boxcar)
- Interior packed with crates, barrels, sacks depending on cargo type
- Labels visible on containers (e.g., "FLORIDA ORANGES", "KANSAS WHEAT")
- Slight rocking/swaying animation as the train moves
- A manifest clipboard on the wall (click to see full cargo details)

#### Tanker Car (exterior only)
- Cross-section is not meaningful for a liquid tanker
- Instead: an exterior view with "FUEL" or "CHEMICALS" stenciled on the side
- Narrator explains what is inside and where it is going

#### Flatcar
- Visible cargo on top: automobiles, lumber, containers
- Items sway slightly with train movement
- Straps and chains visible securing the cargo

#### Caboose
- A cozy rear car with the conductor
- The conductor sits at a desk with a logbook
- A window looking backward at the receding tracks
- A stove, a bunk, a lantern
- Click the conductor to see the full train manifest and schedule

### Scrolling and Interaction
- Horizontal scroll (drag, scroll wheel, or arrow keys) to move through the train
- Click any person for their detail tooltip
- Click any cargo for its detail tooltip
- "Return to Map" button always visible in the UI
- The landscape outside the windows scrolls at a different speed than the interior (parallax)
- Sound: rhythmic wheel clacking, muffled wind, interior conversations

---

## Station Scene

Accessed by clicking "Visit Station" on any station from the National Map.

### Layout
A side-view of a station platform. The station building is on one side, the tracks run horizontally across the middle, and the platform is between the building and the tracks.

### Visual Elements

#### Station Building
- Architecture style varies by region and size:
  - Major hubs: Grand brick/stone building with arched windows, clock tower
  - Regional stations: Modest two-story building with a covered waiting area
  - Local stops: Small wooden structure with a bench and a sign
- Interior is partially visible through windows (ticket counter, waiting room with benches)
- A station sign with the city name in Playfair Display lettering

#### Platform
- Concrete or wooden surface
- Benches, lampposts, luggage carts, newspaper stands
- A yellow safety line along the edge
- A station clock (shows simulation time)
- A departure board showing upcoming trains (hand-drawn style board with flip letters)

#### People on the Platform
- Waiting passengers: standing, sitting on benches, checking watches, holding luggage
- Meeting people: waving, hugging arrivals
- Workers: conductor with a flag, porter with a luggage cart, ticket collector
- Each person is clickable for their detail tooltip

#### Trains at the Station
- If a train is currently at this station, it is visible on the tracks
- The boarding/deboarding animation plays:
  1. Train arrives and slows to a stop (brakes hiss)
  2. Doors open
  3. Arriving passengers step off onto the platform
  4. Brief pause (people finding each other, collecting luggage)
  5. Departing passengers board
  6. Conductor calls "ALL ABOARD!" (audio)
  7. Doors close
  8. Whistle blows
  9. Train departs (accelerating puff sequence)
- If no train is present: empty tracks, people waiting, narrator says when the next train is due

### Departure Board
A charming, hand-drawn version of a classic train station departure/arrival board:

```
DEPARTURES
-----------------------------------------
Train          Destination    Time   Status
-----------------------------------------
Big Thunder    Cincinnati     10:15  ON TIME
Daisy Belle    Chicago        11:30  BOARDING
Starlight Exp  New York       22:00  SCHEDULED
-----------------------------------------
```

- Styled like painted wooden slats with chalk text
- "BOARDING" status pulses gently
- "DELAYED" status shows in Signal Red
- Click a row to see train detail panel

---

## Ambient Details

Both interior and station scenes should feel alive with small, looping ambient animations:

### Train Interior Ambient
- Window scenery scrolling (parallax layers: distant mountains, mid trees, near fence posts)
- Gentle car rocking (±1 degree oscillation, slow)
- Ceiling lamp swaying slightly
- Steam wisps occasionally visible outside windows
- Muffled wheel sounds synced to track joints (click-click rhythm)

### Station Ambient
- Birds landing and taking off from the roof
- A flag or banner rippling
- The station clock second hand ticking
- Distant train horns (other trains passing)
- Wind rustling newspaper pages on a bench
- Pigeons pecking at the ground

---

## Narrator Integration

When the player enters any Phase 4 scene, the narrator provides a brief introductory text in the storybook voice:

### Train Interior Example
> "Inside Daisy Belle, the morning light streams through the windows. Mrs. Henderson is reading her newspaper and eating a blueberry muffin. Two children are pressing their noses against the glass, watching the farms roll past. In the dining car, the cook is making his famous tomato soup. And up front, the engineer keeps one hand on the throttle and one eye on the tracks ahead."

### Station Example
> "Welcome to Union Station, Chicago -- the busiest crossroads in all the land. Six trains will pass through here today, carrying coal and corn and a thousand stories. On platform three, a grandmother waits with a bouquet of flowers. Her grandson is coming home on the afternoon express."

Narrator text is generated dynamically based on the actual passengers, cargo, and trains present. Use template strings with data interpolation:

```
"Inside {train.name}, {passenger1.name} is {passenger1.activity_description}.
{passenger2.name} is {passenger2.activity_description}. And up front,
the engineer keeps one hand on the throttle and one eye on the tracks ahead."
```

---

## Technical Notes

### PixiJS Rendering
- Train interior: a single wide PixiJS canvas, scrollable container
- Station: a single wide PixiJS canvas, fixed height with scrollable width
- Characters are `AnimatedSprite` instances with 4-8 frame idle loops
- Parallax window scenery uses `TilingSprite` for infinite scrolling

### Character Rendering
- Characters are composited from modular parts: body shape, clothing color, hat (optional), bag (optional), hair style
- This allows randomized visual variety without needing hundreds of unique sprites
- 3 body types (child, adult, elderly) x 6 clothing colors x 4 hair styles x 3 accessories = 216 visual combinations

### Scene Transitions
- Entering a train interior: "zoom in" transition from the map (iris wipe centered on the train)
- Entering a station: "page turn" transition
- Exiting back to map: reverse of the entry transition
- All transitions take 600-800ms with easing
