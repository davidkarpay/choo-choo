# Phase 2: The National Map

**Build after Phase 1 is functional.** This is the "big picture" view where the player sees the entire country and watches trains crawl across it.

---

## Scene Overview

A stylized map of the continental United States fills the screen. Major rail corridors are drawn as thick, hand-drawn-style lines. Trains are represented as small animated icons moving along these corridors. Stations are marked as dots with labels. The player can zoom from coast-to-coast all the way down to a regional view.

The map is always alive -- trains are always moving (unless the simulation is paused).

---

## Map Layers (bottom to top)

### 1. Base Map Tiles
- Source: OpenStreetMap tiles via Leaflet
- Styling: Apply CSS filters to achieve a watercolor/parchment look (see Style Guide)
- Alternative: Use a custom-styled tile provider like Stadia Maps Stamen Watercolor if available
- The map should NOT look like Google Maps. It should look like a storybook illustration of a map.

### 2. Terrain Overlay (optional, Phase 2.5)
- Subtle terrain shading to show mountains, plains, rivers
- Hand-painted style, not photographic satellite imagery
- Low opacity so it does not overwhelm the rail corridors

### 3. Rail Corridor Layer
- GeoJSON polylines for major US rail corridors
- Rendered with Leaflet's `L.geoJSON` with custom styling
- Line style: thick (4-6px), slightly dashed, Rail Silver color with dark outline
- Corridors loaded from `/data/routes.json`
- Hover: corridor name tooltip, glow effect
- Click: highlights the full corridor, shows corridor detail panel

### 4. Station Markers Layer
- Custom Leaflet markers at station locations
- Icon: small circle with a tiny building silhouette (custom SVG marker)
- Size scales with zoom level and station importance
- Labels appear at appropriate zoom levels (major hubs always visible, small stations only at high zoom)
- Click: opens station detail panel, "Visit Station" button transitions to Station Scene (Phase 4)

### 5. Train Icons Layer
- Animated custom markers for each active train
- Icon: tiny side-view train silhouette colored to match the train's color scheme
- Faces the direction of travel (flip horizontally as needed)
- At low zoom: simple dot with color. At mid zoom: small train icon. At high zoom: detailed icon with name label.
- A faint smoke trail follows behind each train (CSS pseudo-element or SVG animation)
- Click: opens train detail panel, "Look Inside" button transitions to Train Interior Scene (Phase 4)

### 6. UI Overlay Layer
- Simulation clock display (top-right corner)
- Speed controls (pause, 1x, 5x, 15x, 60x)
- Time-of-day indicator (sun/moon icon with arc showing position)
- Legend panel (toggleable)
- "Return to Roundhouse" button

---

## Map Interaction

### Pan and Zoom
- Standard Leaflet pan (drag) and zoom (scroll wheel, pinch)
- Zoom range: 4 (full country) to 12 (city-level)
- Smooth zoom animation (Leaflet's `zoomAnimation: true`)
- Zoom buttons styled to match the storybook UI (not default Leaflet controls)

### Train Following
- When a player clicks a train and selects "Follow", the map auto-pans to keep that train centered
- A subtle spotlight/highlight around the followed train
- "Stop Following" button appears in the UI
- Following persists across zoom levels

### Time-of-Day Visuals
- The map visually shifts with the simulation clock:
  - Night: dark blue overlay, station lights glow, train headlamps visible
  - Dawn: pink-gold gradient from east
  - Day: bright, warm, full visibility
  - Dusk: amber gradient from west
- These overlays are CSS layers on top of the map tiles, not tile replacements

---

## Rail Corridor Data

Major corridors to include (with approximate GeoJSON paths):

| Corridor Name | From | To | Cargo Focus |
|---------------|------|-----|-------------|
| Northeast Corridor | Boston | Washington, D.C. (District of Columbia) | Passengers, mail |
| Chicago Hub | Chicago | (radiates to 6+ destinations) | All types |
| Powder River Basin | Wyoming mines | Midwest power plants | Coal |
| BNSF (Burlington Northern Santa Fe) Transcon | Chicago | Los Angeles | Intermodal containers |
| UP (Union Pacific) Sunset | Los Angeles | New Orleans | Mixed freight |
| CSX (CSX Transportation) Water Level Route | New York | Chicago | Mixed freight |
| NS (Norfolk Southern) Crescent | Atlanta | New Orleans | Mixed freight, automotive |
| California Corridor | Sacramento | Los Angeles | Passengers, produce |
| Grain Belt | Kansas | Gulf Coast ports | Grain, agricultural |
| Appalachian Coal | West Virginia | Ohio/Great Lakes | Coal, minerals |

Store these as GeoJSON Feature collections in `/data/routes.json`.

---

## Train Position Calculation

Trains move along their assigned corridor at a speed determined by the simulation:

```
Real-time position = (departure_time + elapsed_sim_time) / total_journey_time

where:
  total_journey_time = corridor_length_miles / average_speed_mph

Average speeds:
  Freight: 25 mph (miles per hour)
  Passenger: 55 mph
  Helper (mountain): 15 mph
```

Position is interpolated along the GeoJSON path using a parametric `t` value from 0.0 (origin) to 1.0 (destination). Use Leaflet's or Turf.js's `along()` function to find the geographic point at distance `t * total_length` along the path.

---

## Detail Panels

### Train Detail Panel (on click)
- Train name (Playfair Display, large)
- Illustration/icon of the train
- Current status: "En route from [origin] to [destination]"
- Speed indicator
- Cargo manifest (list of cargo types and quantities)
- Passenger count (if passenger train)
- Departure time and estimated arrival time (Estimated Time of Arrival, ETA)
- "Follow This Train" button
- "Look Inside" button (transitions to Phase 4)

### Station Detail Panel (on click)
- Station name (Playfair Display, large)
- City and state
- Station size category (Major Hub, Regional Station, Local Stop)
- Number of tracks/platforms
- Current trains at station
- Next arriving train and ETA
- Cargo throughput statistics
- Passenger boarding/alighting counts
- "Visit This Station" button (transitions to Phase 4)

### Corridor Detail Panel (on click)
- Corridor name
- Total length in miles
- Number of active trains on this corridor right now
- Cargo volume moving through this corridor
- Origin and destination cities
- Historical significance (a narrator-voice paragraph about why this corridor matters)

---

## Technical Implementation Notes

### Leaflet Setup
```typescript
const map = L.map('map', {
  center: [39.8283, -98.5795],  // Geographic center of continental US
  zoom: 5,
  minZoom: 4,
  maxZoom: 12,
  zoomControl: false,           // Use custom controls
  zoomAnimation: true,
  markerZoomAnimation: true,
});
```

### Custom Controls
Replace all default Leaflet controls with storybook-styled versions. This includes zoom buttons, attribution, and scale bar.

### Performance
- At zoom 4-6 (national view): render trains as simple colored dots using `L.circleMarker` (very fast)
- At zoom 7-9 (regional view): switch to custom icon markers with small train sprites
- At zoom 10-12 (local view): show detailed train icons with name labels and smoke trails
- Use Leaflet's built-in marker clustering if needed for dense station areas
- Update train positions every 100ms (milliseconds) (10 times per second), interpolating between simulation ticks for smooth movement

### Map State Persistence
- Save last map center, zoom level, and followed train (if any) to player preferences
- Restore on return to map scene
