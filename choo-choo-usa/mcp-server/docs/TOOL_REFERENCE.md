# Tool Reference

Complete reference for all 28 tools registered in the Choo-Choo USA MCP
server. Tools are organized into three categories:

- **Query Tools** (13): Read-only inspection of simulation state
- **Control Tools** (6): Modify simulation behavior and state
- **Scenario Tools** (9): Create and manage simulation worlds

All tools communicate with the browser via JSON-RPC over WebSocket. Every
tool returns content blocks with `type: "text"` containing JSON-stringified
results. On error, the content block includes `isError: true`.

---

## Table of Contents

### Query Tools
1. [get_simulation_state](#get_simulation_state)
2. [get_all_trains](#get_all_trains)
3. [get_train](#get_train)
4. [get_all_stations](#get_all_stations)
5. [get_station](#get_station)
6. [get_all_routes](#get_all_routes)
7. [get_route](#get_route)
8. [get_cargo_shipments](#get_cargo_shipments)
9. [get_passengers](#get_passengers)
10. [get_stats](#get_stats)
11. [get_event_log](#get_event_log)
12. [get_network_graph](#get_network_graph)
13. [find_path](#find_path)

### Control Tools
14. [set_speed](#set_speed)
15. [dispatch_train](#dispatch_train)
16. [assign_route](#assign_route)
17. [recall_train](#recall_train)
18. [set_clock](#set_clock)
19. [save_load_game](#save_load_game)

### Scenario Tools
20. [create_station](#create_station)
21. [create_route](#create_route)
22. [create_train](#create_train)
23. [add_industry](#add_industry)
24. [spawn_cargo](#spawn_cargo)
25. [spawn_passengers](#spawn_passengers)
26. [reset_simulation](#reset_simulation)
27. [export_scenario](#export_scenario)
28. [import_scenario](#import_scenario)

---

## Query Tools

These 13 tools are read-only. They never modify simulation state and are
safe to call at any time without side effects.

---

### get_simulation_state

Get the current simulation state including clock, speed, day, and statistics.

**Parameters**: None

**Returns** (`SimulationStateResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `clock` | `number` | Minutes since midnight of day 1 |
| `speed` | `0 \| 1 \| 5 \| 15 \| 60` | Current speed multiplier (0 = paused) |
| `dayNumber` | `number` | Current simulation day (starts at 1) |
| `timeOfDay` | `number` | Minutes since midnight today (0-1439) |
| `timeOfDayPeriod` | `string` | Human-readable period: "dawn", "morning", "afternoon", "evening", "night" |
| `isDaytime` | `boolean` | Whether it is currently daytime |
| `isPaused` | `boolean` | Whether the simulation is paused |
| `stats.today` | `DailyStatsResponse` | Statistics for the current day |
| `stats.allTime` | `DailyStatsResponse` | Cumulative all-time statistics |

Each `DailyStatsResponse` contains:

| Field | Type | Description |
|-------|------|-------------|
| `cargoTonsMoved` | `number` | Total cargo weight moved |
| `cargoDeliveries` | `number` | Number of completed deliveries |
| `passengersDelivered` | `number` | Number of passengers who reached their destination |
| `trainMilesTraveled` | `number` | Cumulative miles traveled by all trains |
| `busiestStation` | `string` | Station ID with most activity |
| `busiestCorridor` | `string` | Route ID with most traffic |

**Example request**:
```json
{
  "name": "get_simulation_state",
  "arguments": {}
}
```

**Example response**:
```json
{
  "clock": 450,
  "speed": 5,
  "dayNumber": 1,
  "timeOfDay": 450,
  "timeOfDayPeriod": "morning",
  "isDaytime": true,
  "isPaused": false,
  "stats": {
    "today": {
      "cargoTonsMoved": 1250,
      "cargoDeliveries": 8,
      "passengersDelivered": 34,
      "trainMilesTraveled": 620,
      "busiestStation": "chicago-union",
      "busiestCorridor": "northeast-corridor"
    },
    "allTime": {
      "cargoTonsMoved": 1250,
      "cargoDeliveries": 8,
      "passengersDelivered": 34,
      "trainMilesTraveled": 620,
      "busiestStation": "chicago-union",
      "busiestCorridor": "northeast-corridor"
    }
  }
}
```

---

### get_all_trains

Get a summary list of all trains in the simulation.

**Parameters**: None

**Returns**: Array of `TrainSummaryResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique train identifier |
| `name` | `string` | Display name |
| `type` | `"steam" \| "diesel"` | Engine type |
| `status` | `TrainStatus` | Current status (see below) |
| `currentRouteId` | `string \| null` | Route the train is currently on |
| `routeProgress` | `number` | 0.0 to 1.0, fraction of route completed |
| `currentPosition` | `[number, number]` | `[latitude, longitude]` |
| `heading` | `number` | Direction in degrees (0-360) |
| `cargoCount` | `number` | Number of cargo shipments aboard |
| `passengerCount` | `number` | Number of passengers aboard |
| `speedMph` | `number` | Current speed in miles per hour |
| `operator` | `string?` | Railroad operator name |
| `category` | `"freight" \| "passenger"?` | Train category |

**TrainStatus values**:
`"sleeping"` | `"warming_up"` | `"departing"` | `"en_route"` | `"arriving"` | `"at_station"` | `"returning"` | `"maintenance"`

**Example request**:
```json
{
  "name": "get_all_trains",
  "arguments": {}
}
```

**Example response**:
```json
[
  {
    "id": "train-001",
    "name": "The Sunrise Express",
    "type": "steam",
    "status": "en_route",
    "currentRouteId": "northeast-corridor",
    "routeProgress": 0.45,
    "currentPosition": [40.4406, -79.9959],
    "heading": 72,
    "cargoCount": 3,
    "passengerCount": 15,
    "speedMph": 55,
    "operator": "Amtrak",
    "category": "passenger"
  },
  {
    "id": "train-002",
    "name": "Old Ironside",
    "type": "diesel",
    "status": "sleeping",
    "currentRouteId": null,
    "routeProgress": 0,
    "currentPosition": [41.8781, -87.6298],
    "heading": 0,
    "cargoCount": 0,
    "passengerCount": 0,
    "speedMph": 0,
    "operator": "BNSF",
    "category": "freight"
  }
]
```

---

### get_train

Get full details for a specific train by ID.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `trainId` | `string` | Yes | The unique train identifier (e.g., `"train-001"`) |

**Returns** (`TrainDetailResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name |
| `type` | `"steam" \| "diesel"` | Engine type |
| `status` | `TrainStatus` | Current status |
| `color` | `{ primary, secondary, accent }` | Three-color hex scheme |
| `personality` | `string` | Storybook personality description |
| `currentRouteId` | `string \| null` | Assigned route |
| `routeProgress` | `number` | 0.0-1.0 route completion |
| `currentPosition` | `[number, number]` | `[lat, lng]` |
| `heading` | `number` | Direction in degrees |
| `speedMph` | `number` | Cruising speed |
| `maxCars` | `number` | Maximum cars the train can pull |
| `cargoCapability` | `string[]` | Cargo types the train can carry |
| `homeRoundhouseId` | `string` | Home roundhouse station ID |
| `operator` | `string?` | Railroad operator |
| `category` | `"freight" \| "passenger"?` | Train category |
| `preferredRouteIds` | `string[]?` | Preferred routes |
| `currentSegmentIndex` | `number` | Current route segment index |
| `segmentProgress` | `number` | Progress within current segment (0.0-1.0) |
| `dwellTimer` | `number` | Minutes remaining at current station (0 if not dwelling) |
| `dwellStationId` | `string \| null` | Station where the train is dwelling |
| `currentJourneyRoutes` | `string[]?` | Multi-leg journey route sequence |
| `currentJourneyLeg` | `number` | Current leg index in the journey |
| `cargoManifest` | `CargoShipmentResponse[]` | All cargo currently aboard |
| `passengers` | `PassengerResponse[]` | All passengers currently aboard |
| `stats.totalMiles` | `number` | Lifetime miles traveled |
| `stats.totalDeliveries` | `number` | Lifetime cargo deliveries |
| `stats.totalPassengersCarried` | `number` | Lifetime passengers carried |

**Example request**:
```json
{
  "name": "get_train",
  "arguments": { "trainId": "train-001" }
}
```

**Example response**:
```json
{
  "id": "train-001",
  "name": "The Sunrise Express",
  "type": "steam",
  "status": "en_route",
  "color": {
    "primary": "#C45B3E",
    "secondary": "#F4C542",
    "accent": "#1B3A5C"
  },
  "personality": "A cheerful old steamer who loves mountain passes and always whistles hello",
  "currentRouteId": "northeast-corridor",
  "routeProgress": 0.45,
  "currentPosition": [40.4406, -79.9959],
  "heading": 72,
  "speedMph": 55,
  "maxCars": 12,
  "cargoCapability": ["packages", "produce", "mail"],
  "homeRoundhouseId": "chicago-roundhouse",
  "operator": "Amtrak",
  "category": "passenger",
  "preferredRouteIds": ["northeast-corridor", "lake-shore-limited"],
  "currentSegmentIndex": 3,
  "segmentProgress": 0.67,
  "dwellTimer": 0,
  "dwellStationId": null,
  "currentJourneyLeg": 0,
  "cargoManifest": [
    {
      "id": "cargo-042",
      "type": "packages",
      "quantity": 50,
      "unit": "crates",
      "originStationId": "chicago-union",
      "destinationStationId": "new-york-penn",
      "assignedTrainId": "train-001",
      "status": "in_transit",
      "createdAt": 300,
      "loadedAt": 360,
      "deliveredAt": null,
      "industrySource": "Chicago Parcel Co.",
      "industryDestination": "NYC Distribution Center"
    }
  ],
  "passengers": [
    {
      "id": "pax-101",
      "name": "Eleanor Rigby",
      "ageGroup": "adult",
      "originStationId": "chicago-union",
      "destinationStationId": "new-york-penn",
      "assignedTrainId": "train-001",
      "activity": "reading",
      "mood": "content",
      "status": "in_transit",
      "createdAt": 280,
      "boardedAt": 360,
      "arrivedAt": null
    }
  ],
  "stats": {
    "totalMiles": 4250,
    "totalDeliveries": 38,
    "totalPassengersCarried": 215
  }
}
```

---

### get_all_stations

Get a summary list of all stations in the simulation.

**Parameters**: None

**Returns**: Array of `StationSummaryResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique station identifier |
| `name` | `string` | Display name |
| `city` | `string` | City name |
| `state` | `string` | US state abbreviation |
| `position` | `[number, number]` | `[latitude, longitude]` |
| `size` | `"major_hub" \| "regional" \| "local"` | Station size category |
| `trackCount` | `number` | Number of tracks at the station |
| `industryCount` | `number` | Number of industries |
| `waitingCargoCount` | `number` | Cargo shipments waiting for pickup |
| `waitingPassengerCount` | `number` | Passengers waiting for a train |
| `trainsAtStation` | `string[]` | IDs of trains currently at the station |

**Example request**:
```json
{
  "name": "get_all_stations",
  "arguments": {}
}
```

**Example response**:
```json
[
  {
    "id": "chicago-union",
    "name": "Chicago Union Station",
    "city": "Chicago",
    "state": "IL",
    "position": [41.8781, -87.6298],
    "size": "major_hub",
    "trackCount": 8,
    "industryCount": 3,
    "waitingCargoCount": 12,
    "waitingPassengerCount": 25,
    "trainsAtStation": ["train-002"]
  }
]
```

---

### get_station

Get full details for a specific station by ID.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `stationId` | `string` | Yes | The unique station identifier (e.g., `"chicago-union"`) |

**Returns** (`StationDetailResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name |
| `city` | `string` | City |
| `state` | `string` | State abbreviation |
| `position` | `[number, number]` | `[lat, lng]` |
| `size` | `StationSize` | Size category |
| `trackCount` | `number` | Number of tracks |
| `architectureStyle` | `string` | Architectural description |
| `description` | `string` | Narrative description in storybook style |
| `industries` | `IndustryResponse[]` | Industries at this station |
| `waitingCargo` | `CargoShipmentResponse[]` | Cargo waiting for pickup |
| `waitingPassengers` | `PassengerResponse[]` | Passengers waiting for a train |
| `trainsAtStation` | `string[]` | Train IDs currently present |
| `isJunction` | `boolean?` | Whether the station sits on 2+ routes |
| `connectedRouteIds` | `string[]?` | Routes that pass through this station |

Each `IndustryResponse` contains:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Industry type (e.g., `"steel_mill"`) |
| `name` | `string` | Display name |
| `produces` | `string[]` | Cargo types produced |
| `consumes` | `string[]` | Cargo types consumed |
| `productionRate` | `number` | Minutes between production batches |
| `minBatch` | `number` | Minimum batch size |
| `maxBatch` | `number` | Maximum batch size |

**Example request**:
```json
{
  "name": "get_station",
  "arguments": { "stationId": "chicago-union" }
}
```

**Example response**:
```json
{
  "id": "chicago-union",
  "name": "Chicago Union Station",
  "city": "Chicago",
  "state": "IL",
  "position": [41.8781, -87.6298],
  "size": "major_hub",
  "trackCount": 8,
  "architectureStyle": "Beaux-Arts",
  "description": "The grand old heart of American railroading, where six great corridors meet beneath a soaring marble hall.",
  "industries": [
    {
      "type": "grain_elevator",
      "name": "Midwest Grain Exchange",
      "produces": ["grain"],
      "consumes": [],
      "productionRate": 60,
      "minBatch": 20,
      "maxBatch": 50
    }
  ],
  "waitingCargo": [],
  "waitingPassengers": [],
  "trainsAtStation": ["train-002"],
  "isJunction": true,
  "connectedRouteIds": ["northeast-corridor", "lake-shore-limited", "empire-builder"]
}
```

---

### get_all_routes

Get a summary list of all rail routes (corridors) in the simulation.

**Parameters**: None

**Returns**: Array of `RouteSummaryResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique route identifier |
| `name` | `string` | Display name |
| `stationIds` | `string[]` | Ordered station IDs along the route |
| `lengthMiles` | `number` | Total route length in miles |
| `color` | `string` | CSS hex color for map rendering |
| `operator` | `string?` | Railroad operator |
| `type` | `"freight" \| "passenger" \| "mixed"?` | Route type |

**Example request**:
```json
{
  "name": "get_all_routes",
  "arguments": {}
}
```

**Example response**:
```json
[
  {
    "id": "northeast-corridor",
    "name": "Northeast Corridor",
    "stationIds": ["boston-south", "new-york-penn", "philadelphia-30th", "washington-union"],
    "lengthMiles": 457,
    "color": "#C45B3E",
    "operator": "Amtrak",
    "type": "passenger"
  }
]
```

---

### get_route

Get full details for a specific route by ID.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `routeId` | `string` | Yes | The unique route identifier (e.g., `"northeast-corridor"`) |

**Returns** (`RouteDetailResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name |
| `description` | `string` | Narrative description |
| `stationIds` | `string[]` | Ordered station IDs |
| `geometry` | `{ type: "LineString", coordinates: [lng, lat][] }` | GeoJSON geometry |
| `lengthMiles` | `number` | Total length in miles |
| `primaryCargoTypes` | `string[]` | Main cargo types on this route |
| `color` | `string` | CSS hex color |
| `operator` | `string?` | Railroad operator |
| `type` | `RouteType?` | Route type |

**Example request**:
```json
{
  "name": "get_route",
  "arguments": { "routeId": "northeast-corridor" }
}
```

**Example response**:
```json
{
  "id": "northeast-corridor",
  "name": "Northeast Corridor",
  "description": "America's busiest passenger rail corridor, threading through the great cities of the Eastern Seaboard.",
  "stationIds": ["boston-south", "new-york-penn", "philadelphia-30th", "washington-union"],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-71.0552, 42.3519],
      [-73.9937, 40.7505],
      [-75.1820, 39.9557],
      [-77.0069, 38.8973]
    ]
  },
  "lengthMiles": 457,
  "primaryCargoTypes": ["packages", "mail"],
  "color": "#C45B3E",
  "operator": "Amtrak",
  "type": "passenger"
}
```

---

### get_cargo_shipments

Get cargo shipments with optional filters.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `"waiting" \| "in_transit" \| "delivered"` | No | Filter by shipment status. Omit for all. |
| `stationId` | `string` | No | Filter by origin or destination station ID. Omit for all. |

**Returns**: Array of `CargoShipmentResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique shipment identifier |
| `type` | `string` | Cargo type (e.g., `"coal"`, `"grain"`) |
| `quantity` | `number` | Amount in native units |
| `unit` | `string` | Unit of measurement (e.g., `"tons"`, `"bushels"`) |
| `originStationId` | `string` | Station where cargo was created |
| `destinationStationId` | `string` | Target delivery station |
| `assignedTrainId` | `string \| null` | Train carrying this cargo (null if waiting) |
| `status` | `"waiting" \| "in_transit" \| "delivered"` | Current status |
| `createdAt` | `number` | Simulation clock when cargo was created |
| `loadedAt` | `number \| null` | When cargo was loaded onto a train |
| `deliveredAt` | `number \| null` | When cargo was delivered |
| `industrySource` | `string` | Industry that produced this cargo |
| `industryDestination` | `string` | Industry that will consume this cargo |

**Example request**:
```json
{
  "name": "get_cargo_shipments",
  "arguments": { "status": "waiting", "stationId": "chicago-union" }
}
```

**Example response**:
```json
[
  {
    "id": "cargo-100",
    "type": "grain",
    "quantity": 40,
    "unit": "tons",
    "originStationId": "chicago-union",
    "destinationStationId": "new-york-penn",
    "assignedTrainId": null,
    "status": "waiting",
    "createdAt": 420,
    "loadedAt": null,
    "deliveredAt": null,
    "industrySource": "Midwest Grain Exchange",
    "industryDestination": "NYC Distribution Center"
  }
]
```

---

### get_passengers

Get passengers with optional filters.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `"waiting" \| "in_transit" \| "arrived"` | No | Filter by passenger status. Omit for all. |
| `stationId` | `string` | No | Filter by origin or destination station ID. Omit for all. |

**Returns**: Array of `PassengerResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique passenger identifier |
| `name` | `string` | Randomly generated name |
| `ageGroup` | `string` | Age category (e.g., `"child"`, `"adult"`, `"elder"`) |
| `originStationId` | `string` | Departure station |
| `destinationStationId` | `string` | Destination station |
| `assignedTrainId` | `string \| null` | Train the passenger is on |
| `activity` | `string` | What the passenger is doing (e.g., `"reading"`, `"napping"`) |
| `mood` | `string` | Current mood (e.g., `"excited"`, `"content"`, `"impatient"`) |
| `status` | `"waiting" \| "in_transit" \| "arrived"` | Current status |
| `createdAt` | `number` | When the passenger appeared |
| `boardedAt` | `number \| null` | When they boarded a train |
| `arrivedAt` | `number \| null` | When they reached their destination |

**Example request**:
```json
{
  "name": "get_passengers",
  "arguments": { "status": "waiting" }
}
```

**Example response**:
```json
[
  {
    "id": "pax-200",
    "name": "Tommy Clearwater",
    "ageGroup": "child",
    "originStationId": "boston-south",
    "destinationStationId": "new-york-penn",
    "assignedTrainId": null,
    "activity": "watching trains",
    "mood": "excited",
    "status": "waiting",
    "createdAt": 400,
    "boardedAt": null,
    "arrivedAt": null
  }
]
```

---

### get_stats

Get simulation statistics for today and all-time.

**Parameters**: None

**Returns**: Object with `today` and `allTime` keys, each a `DailyStatsResponse` (same structure as documented in `get_simulation_state`).

**Example request**:
```json
{
  "name": "get_stats",
  "arguments": {}
}
```

**Example response**:
```json
{
  "today": {
    "cargoTonsMoved": 2400,
    "cargoDeliveries": 15,
    "passengersDelivered": 68,
    "trainMilesTraveled": 1240,
    "busiestStation": "chicago-union",
    "busiestCorridor": "northeast-corridor"
  },
  "allTime": {
    "cargoTonsMoved": 18500,
    "cargoDeliveries": 142,
    "passengersDelivered": 523,
    "trainMilesTraveled": 9800,
    "busiestStation": "chicago-union",
    "busiestCorridor": "northeast-corridor"
  }
}
```

---

### get_event_log

Get the last 50 simulation events.

**Parameters**: None

**Returns**: Array of `SimEventResponse`:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Event type: `"train_departed"`, `"train_arrived"`, `"cargo_loaded"`, `"cargo_delivered"`, `"passenger_boarded"`, `"passenger_arrived"`, `"new_day"` |
| `timestamp` | `number` | Simulation clock when the event occurred |
| `data` | `Record<string, unknown>` | Event-specific data payload |

**Example request**:
```json
{
  "name": "get_event_log",
  "arguments": {}
}
```

**Example response**:
```json
[
  {
    "type": "train_departed",
    "timestamp": 360,
    "data": {
      "trainId": "train-001",
      "trainName": "The Sunrise Express",
      "routeId": "northeast-corridor",
      "fromStationId": "chicago-union"
    }
  },
  {
    "type": "cargo_loaded",
    "timestamp": 358,
    "data": {
      "cargoId": "cargo-042",
      "cargoType": "packages",
      "trainId": "train-001",
      "stationId": "chicago-union",
      "quantity": 50
    }
  },
  {
    "type": "new_day",
    "timestamp": 1440,
    "data": {
      "dayNumber": 2
    }
  }
]
```

---

### get_network_graph

Get the rail network graph showing how stations and routes are interconnected.

**Parameters**: None

**Returns** (`NetworkGraphResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `junctionStationIds` | `string[]` | Station IDs that sit on 2+ routes |
| `totalNodes` | `number` | Total number of stations in the network |
| `totalEdges` | `number` | Total number of route-station connections |
| `nodes` | `NetworkNodeResponse[]` | Each station with its connected routes |
| `connectivity` | `array` | Each route with its stations, length, operator, and type |

Each `NetworkNodeResponse` contains:

| Field | Type | Description |
|-------|------|-------------|
| `stationId` | `string` | Station identifier |
| `connectedRouteIds` | `string[]` | Routes passing through this station |
| `isJunction` | `boolean` | Whether this station is on 2+ routes |

**Example request**:
```json
{
  "name": "get_network_graph",
  "arguments": {}
}
```

**Example response**:
```json
{
  "junctionStationIds": ["chicago-union", "new-york-penn"],
  "totalNodes": 12,
  "totalEdges": 18,
  "nodes": [
    {
      "stationId": "chicago-union",
      "connectedRouteIds": ["northeast-corridor", "empire-builder", "lake-shore-limited"],
      "isJunction": true
    },
    {
      "stationId": "boston-south",
      "connectedRouteIds": ["northeast-corridor"],
      "isJunction": false
    }
  ],
  "connectivity": [
    {
      "routeId": "northeast-corridor",
      "stationIds": ["boston-south", "new-york-penn", "philadelphia-30th", "washington-union"],
      "lengthMiles": 457,
      "operator": "Amtrak",
      "type": "passenger"
    }
  ]
}
```

---

### find_path

Find the shortest path between two stations using Dijkstra's algorithm.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Origin station ID (e.g., `"chicago-union"`) |
| `to` | `string` | Yes | Destination station ID (e.g., `"new-york-penn"`) |

**Returns** (`NetworkPathResponse` or `null`):

| Field | Type | Description |
|-------|------|-------------|
| `fromStationId` | `string` | Origin station |
| `toStationId` | `string` | Destination station |
| `legs` | `array` | Path broken into legs, each on one route corridor |
| `totalDistanceMiles` | `number` | Sum of all leg distances |
| `stationSequence` | `string[]` | All stations visited in order |

Each leg contains:

| Field | Type | Description |
|-------|------|-------------|
| `routeId` | `string` | Route corridor for this leg |
| `fromStationId` | `string` | Start of this leg |
| `toStationId` | `string` | End of this leg |
| `distanceMiles` | `number` | Distance for this leg |

Returns `null` (with a descriptive message) if no path exists.

**Example request**:
```json
{
  "name": "find_path",
  "arguments": { "from": "chicago-union", "to": "washington-union" }
}
```

**Example response**:
```json
{
  "fromStationId": "chicago-union",
  "toStationId": "washington-union",
  "legs": [
    {
      "routeId": "lake-shore-limited",
      "fromStationId": "chicago-union",
      "toStationId": "new-york-penn",
      "distanceMiles": 960
    },
    {
      "routeId": "northeast-corridor",
      "fromStationId": "new-york-penn",
      "toStationId": "washington-union",
      "distanceMiles": 225
    }
  ],
  "totalDistanceMiles": 1185,
  "stationSequence": ["chicago-union", "new-york-penn", "washington-union"]
}
```

---

## Control Tools

These 6 tools modify simulation state. Use them with intent -- they change
train behavior, simulation time, and game persistence.

---

### set_speed

Set the simulation speed multiplier.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `speed` | `0 \| 1 \| 5 \| 15 \| 60` | Yes | Speed multiplier. `0` pauses, `1` is real-time (1 real second = 1 simulated minute), `5`/`15`/`60` are fast-forward. |

**Returns**: Confirmation with the new speed setting.

**Example request**:
```json
{
  "name": "set_speed",
  "arguments": { "speed": 5 }
}
```

**Example response**:
```
Simulation speed set to 5x. {"speed": 5, "previousSpeed": 1}
```

---

### dispatch_train

Manually dispatch a train on a specific route.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `trainId` | `string` | Yes | Train to dispatch (e.g., `"train-001"`) |
| `routeId` | `string` | Yes | Route to dispatch on (e.g., `"northeast-corridor"`) |

The train should be in a state that allows departure: `sleeping`, `at_station`, or `maintenance`.

**Returns**: Confirmation with dispatch details.

**Example request**:
```json
{
  "name": "dispatch_train",
  "arguments": { "trainId": "train-001", "routeId": "northeast-corridor" }
}
```

**Example response**:
```
Train "train-001" dispatched on route "northeast-corridor". {"trainId": "train-001", "routeId": "northeast-corridor", "status": "departing"}
```

---

### assign_route

Change a train's route assignment without dispatching it.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `trainId` | `string` | Yes | Train to reassign |
| `routeId` | `string` | Yes | New route to assign |

This does not change the train's status. Route progress resets to 0.

**Returns**: Confirmation with new assignment.

**Example request**:
```json
{
  "name": "assign_route",
  "arguments": { "trainId": "train-002", "routeId": "empire-builder" }
}
```

**Example response**:
```
Train "train-002" assigned to route "empire-builder". {"trainId": "train-002", "routeId": "empire-builder", "routeProgress": 0}
```

---

### recall_train

Send a train back to its home roundhouse.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `trainId` | `string` | Yes | Train to recall |

Sets the train's status to `"returning"`, clears its current route, and makes it
head home. Cargo and passengers are not unloaded mid-journey.

**Returns**: Confirmation.

**Example request**:
```json
{
  "name": "recall_train",
  "arguments": { "trainId": "train-003" }
}
```

**Example response**:
```
Train "train-003" recalled to roundhouse. {"trainId": "train-003", "status": "returning", "homeRoundhouseId": "chicago-roundhouse"}
```

---

### set_clock

Set the simulation clock to a specific time.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `hour` | `integer` (0-23) | Yes | Hour of the day. 0 = midnight, 6 = dawn, 12 = noon, 18 = evening. |
| `minute` | `integer` (0-59) | Yes | Minute of the hour. |

This affects day/night visuals, train schedules, and time-of-day period.

**Returns**: Confirmation with new time.

**Example request**:
```json
{
  "name": "set_clock",
  "arguments": { "hour": 6, "minute": 0 }
}
```

**Example response**:
```
Simulation clock set to 06:00. {"clock": 360, "timeOfDayPeriod": "dawn", "isDaytime": true}
```

---

### save_load_game

Manage game save states via IndexedDB.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | `"save" \| "load" \| "clear"` | Yes | `"save"` serializes current state, `"load"` restores a saved state, `"clear"` deletes the save. |

**Returns**: Confirmation of the action.

**Example request**:
```json
{
  "name": "save_load_game",
  "arguments": { "action": "save" }
}
```

**Example response**:
```
Game saved. {"action": "save", "timestamp": 1709312400, "trainCount": 6, "stationCount": 12}
```

---

## Scenario Tools

These 9 tools create and manage simulation worlds. They are the most
powerful tools in the MCP server and can fundamentally reshape the
simulation.

---

### create_station

Create a new railroad station in the simulation.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique station ID (e.g., `"denver-union"`). Must be unique across all stations. |
| `name` | `string` | Yes | Display name (e.g., `"Denver Union Station"`) |
| `city` | `string` | Yes | City name (e.g., `"Denver"`) |
| `state` | `string` | Yes | US state abbreviation (e.g., `"CO"`) |
| `position` | `[number, number]` | Yes | Geographic `[latitude, longitude]` (e.g., `[39.7528, -104.9997]`) |
| `size` | `"major_hub" \| "regional" \| "local"` | Yes | Station size category |
| `industries` | `IndustryInput[]` | Yes | Array of industries (can be empty `[]`) |
| `description` | `string` | Yes | Narrative description in warm storybook style |

Each `IndustryInput`:

| Name | Type | Description |
|------|------|-------------|
| `type` | `string` | Industry type (e.g., `"steel_mill"`, `"grain_elevator"`) |
| `name` | `string` | Display name (e.g., `"Denver Steel Works"`) |
| `produces` | `string[]` | Cargo types produced |
| `consumes` | `string[]` | Cargo types consumed |
| `productionRate` | `number` | Minutes between production batches |
| `minBatch` | `number` | Minimum batch size |
| `maxBatch` | `number` | Maximum batch size |

**Returns**: Confirmation with station details.

**Example request**:
```json
{
  "name": "create_station",
  "arguments": {
    "id": "denver-union",
    "name": "Denver Union Station",
    "city": "Denver",
    "state": "CO",
    "position": [39.7528, -104.9997],
    "size": "regional",
    "industries": [
      {
        "type": "cattle_yard",
        "name": "Denver Stockyards",
        "produces": ["livestock"],
        "consumes": ["grain"],
        "productionRate": 120,
        "minBatch": 5,
        "maxBatch": 15
      }
    ],
    "description": "A proud little station at the foot of the Rockies, where cattle trains meet mountain freight."
  }
}
```

**Example response**:
```
Station "Denver Union Station" (denver-union) created in Denver, CO. {"id": "denver-union", "trackCount": 4}
```

---

### create_route

Create a new rail route (corridor) connecting stations.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique route ID |
| `name` | `string` | Yes | Display name |
| `stationIds` | `string[]` (min 2) | Yes | Ordered station IDs along the route |
| `geometry` | `{ type: "LineString", coordinates: [lng, lat][] }` | Yes | GeoJSON LineString (min 2 coordinate pairs) |
| `lengthMiles` | `number` (positive) | Yes | Total route length in miles |
| `color` | `string` | Yes | CSS hex color for map rendering |
| `operator` | `string` | No | Railroad operator name |
| `type` | `"freight" \| "passenger" \| "mixed"` | No | Route type (defaults to `"mixed"`) |

**Returns**: Confirmation with route details.

**Example request**:
```json
{
  "name": "create_route",
  "arguments": {
    "id": "rocky-mountain-line",
    "name": "Rocky Mountain Express",
    "stationIds": ["denver-union", "salt-lake-city"],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-104.9997, 39.7528],
        [-111.8910, 40.7608]
      ]
    },
    "lengthMiles": 525,
    "color": "#2D5A3D",
    "operator": "UP",
    "type": "mixed"
  }
}
```

**Example response**:
```
Route "Rocky Mountain Express" (rocky-mountain-line) created with 2 stations, 525 miles. {"id": "rocky-mountain-line"}
```

---

### create_train

Create a new train in the simulation.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique train ID |
| `name` | `string` | Yes | Display name |
| `type` | `"steam" \| "diesel"` | Yes | Engine type |
| `color` | `{ primary, secondary, accent }` | Yes | Three hex colors |
| `personality` | `string` | Yes | Storybook personality description |
| `cargoCapability` | `string[]` | Yes | Cargo types the train can carry |
| `maxCars` | `integer` (positive) | Yes | Maximum number of cars |
| `speedMph` | `number` (positive) | Yes | Cruising speed in mph |
| `operator` | `string` | No | Railroad operator |
| `category` | `"freight" \| "passenger"` | No | Train category |
| `preferredRouteIds` | `string[]` | No | Preferred route IDs |

The train starts in `"sleeping"` status at its home roundhouse.

**Returns**: Confirmation with train details.

**Example request**:
```json
{
  "name": "create_train",
  "arguments": {
    "id": "train-012",
    "name": "The Silver Streak",
    "type": "diesel",
    "color": {
      "primary": "#8B8B8B",
      "secondary": "#C0C0C0",
      "accent": "#F4C542"
    },
    "personality": "A swift and sleek diesel who races through mountain tunnels with a grin",
    "cargoCapability": ["coal", "steel", "lumber"],
    "maxCars": 20,
    "speedMph": 70,
    "operator": "BNSF",
    "category": "freight",
    "preferredRouteIds": ["rocky-mountain-line"]
  }
}
```

**Example response**:
```
Train "The Silver Streak" (train-012) created. Type: diesel, Speed: 70mph, Max cars: 20. {"id": "train-012", "status": "sleeping"}
```

---

### add_industry

Add a new industry to an existing station.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `stationId` | `string` | Yes | Station to add the industry to |
| `industry` | `IndustryInput` | Yes | The industry definition (same schema as in `create_station`) |

**Returns**: Confirmation with industry details.

**Example request**:
```json
{
  "name": "add_industry",
  "arguments": {
    "stationId": "pittsburgh-station",
    "industry": {
      "type": "steel_mill",
      "name": "Pittsburgh Steel Works",
      "produces": ["steel"],
      "consumes": ["coal", "iron_ore"],
      "productionRate": 90,
      "minBatch": 10,
      "maxBatch": 30
    }
  }
}
```

**Example response**:
```
Industry "Pittsburgh Steel Works" (steel_mill) added to station "pittsburgh-station". Produces: steel. Consumes: coal, iron_ore. {"stationId": "pittsburgh-station", "industryCount": 3}
```

---

### spawn_cargo

Manually spawn a cargo shipment at a station.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `string` | Yes | Cargo type (e.g., `"coal"`, `"grain"`, `"steel"`, `"lumber"`, `"packages"`, `"automobiles"`, `"fuel"`, `"chemicals"`, `"produce"`, `"livestock"`) |
| `quantity` | `number` (positive) | Yes | Amount in the type's native unit |
| `originStationId` | `string` | Yes | Station where cargo appears for pickup |
| `destinationStationId` | `string` | Yes | Station where cargo needs to be delivered |

**Returns**: Confirmation with spawn details.

**Example request**:
```json
{
  "name": "spawn_cargo",
  "arguments": {
    "type": "coal",
    "quantity": 100,
    "originStationId": "pittsburgh-station",
    "destinationStationId": "chicago-union"
  }
}
```

**Example response**:
```
Spawned 100 units of coal cargo at "pittsburgh-station" bound for "chicago-union". {"cargoId": "cargo-201", "status": "waiting"}
```

---

### spawn_passengers

Manually spawn passengers at a station.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `count` | `integer` (1-50) | Yes | Number of passengers to spawn |
| `originStationId` | `string` | Yes | Station where passengers wait |
| `destinationStationId` | `string` | Yes | Station passengers want to reach |

Each passenger gets a randomly generated name, appearance, age group, and mood.

**Returns**: Confirmation with spawn details.

**Example request**:
```json
{
  "name": "spawn_passengers",
  "arguments": {
    "count": 10,
    "originStationId": "boston-south",
    "destinationStationId": "new-york-penn"
  }
}
```

**Example response**:
```
Spawned 10 passenger(s) at "boston-south" headed to "new-york-penn". {"count": 10, "passengerIds": ["pax-300", "pax-301", ...]}
```

---

### reset_simulation

Reset the entire simulation to its initial state.

**Parameters**: None

This is irreversible. All trains return to sleeping, all cargo and passengers
are removed, statistics are zeroed, and the clock resets to 4:30 AM Day 1.

**Returns**: Confirmation.

**Example request**:
```json
{
  "name": "reset_simulation",
  "arguments": {}
}
```

**Example response**:
```
Simulation reset to initial state. Clock at dawn, all trains sleeping, cargo and passengers cleared. {"clock": 270, "dayNumber": 1, "trainCount": 6}
```

---

### export_scenario

Export the current simulation state as a complete JSON scenario.

**Parameters**: None

**Returns**: A complete JSON object containing all stations, routes, trains
(with cargo and passengers), the simulation clock, statistics, and event log.
This can be saved and re-imported later.

**Example request**:
```json
{
  "name": "export_scenario",
  "arguments": {}
}
```

**Example response** (truncated):
```json
{
  "version": "1.0.0",
  "exportedAt": 1709312400,
  "simulation": {
    "clock": 720,
    "speed": 1,
    "dayNumber": 1
  },
  "stations": [ ... ],
  "routes": [ ... ],
  "trains": [ ... ],
  "cargo": [ ... ],
  "passengers": [ ... ],
  "stats": { ... }
}
```

---

### import_scenario

Import a previously exported scenario JSON.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `scenario` | `Record<string, unknown>` | Yes | The full scenario object as produced by `export_scenario`. Must include `stations`, `routes`, `trains`, `simulation`, `cargo`, `passengers`, and `stats` fields. |

This replaces the entire current simulation state. The current state is lost.

**Returns**: Confirmation.

**Example request**:
```json
{
  "name": "import_scenario",
  "arguments": {
    "scenario": {
      "version": "1.0.0",
      "simulation": { "clock": 720, "speed": 1, "dayNumber": 1 },
      "stations": [],
      "routes": [],
      "trains": [],
      "cargo": [],
      "passengers": [],
      "stats": {}
    }
  }
}
```

**Example response**:
```
Scenario imported successfully. {"stationCount": 12, "routeCount": 5, "trainCount": 6}
```
