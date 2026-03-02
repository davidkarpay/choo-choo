# Example Scenarios

Multi-turn LLM conversation examples showing how Claude can interact with
the Choo-Choo USA simulation through the MCP tools. Each scenario
demonstrates a realistic workflow with actual tool calls and responses.

---

## Table of Contents

1. [Build a Railroad](#scenario-1-build-a-railroad)
2. [Optimize Cargo Delivery](#scenario-2-optimize-cargo-delivery)
3. [Create Passenger Service](#scenario-3-create-passenger-service)
4. [Railroad Tycoon](#scenario-4-railroad-tycoon)
5. [Network Explorer](#scenario-5-network-explorer)

---

## Scenario 1: Build a Railroad

Create a new route between two cities, add stations, and dispatch a train.

### User

> Build me a railroad from Denver to Salt Lake City with a stop in Grand
> Junction. Make it a freight route for hauling coal and livestock.

### Claude

I will build this railroad step by step: create the three stations, lay the
route connecting them, create a freight train, and dispatch it.

Let me start by creating the three stations.

**Tool call: `create_station`**
```json
{
  "id": "denver-union",
  "name": "Denver Union Station",
  "city": "Denver",
  "state": "CO",
  "position": [39.7528, -104.9997],
  "size": "major_hub",
  "industries": [
    {
      "type": "coal_mine",
      "name": "Colorado Coal Company",
      "produces": ["coal"],
      "consumes": [],
      "productionRate": 60,
      "minBatch": 20,
      "maxBatch": 50
    }
  ],
  "description": "A grand station at the foot of the Rockies where the Great Plains meet the mountains, and coal trains begin their long westward climb."
}
```

**Response:**
```
Station "Denver Union Station" (denver-union) created in Denver, CO. {"id": "denver-union", "trackCount": 8}
```

**Tool call: `create_station`**
```json
{
  "id": "grand-junction",
  "name": "Grand Junction Depot",
  "city": "Grand Junction",
  "state": "CO",
  "position": [39.0639, -108.5506],
  "size": "regional",
  "industries": [
    {
      "type": "cattle_yard",
      "name": "Western Slope Stockyards",
      "produces": ["livestock"],
      "consumes": ["grain"],
      "productionRate": 120,
      "minBatch": 5,
      "maxBatch": 15
    }
  ],
  "description": "A dusty depot in the high desert where cattle ranchers meet the railroad, and the scent of sagebrush drifts through the platform."
}
```

**Response:**
```
Station "Grand Junction Depot" (grand-junction) created in Grand Junction, CO. {"id": "grand-junction", "trackCount": 4}
```

**Tool call: `create_station`**
```json
{
  "id": "salt-lake-city",
  "name": "Salt Lake City Central",
  "city": "Salt Lake City",
  "state": "UT",
  "position": [40.7608, -111.8910],
  "size": "major_hub",
  "industries": [
    {
      "type": "smelter",
      "name": "Great Basin Smelting Co.",
      "produces": ["steel"],
      "consumes": ["coal"],
      "productionRate": 90,
      "minBatch": 10,
      "maxBatch": 25
    }
  ],
  "description": "A busy western hub nestled between the Wasatch Range and the Great Salt Lake, where mountain freight meets the transcontinental line."
}
```

**Response:**
```
Station "Salt Lake City Central" (salt-lake-city) created in Salt Lake City, UT. {"id": "salt-lake-city", "trackCount": 8}
```

Now I will create the route connecting all three stations.

**Tool call: `create_route`**
```json
{
  "id": "rocky-mountain-freight",
  "name": "Rocky Mountain Freight Line",
  "stationIds": ["denver-union", "grand-junction", "salt-lake-city"],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-104.9997, 39.7528],
      [-106.8175, 39.1911],
      [-108.5506, 39.0639],
      [-109.5498, 39.1801],
      [-111.8910, 40.7608]
    ]
  },
  "lengthMiles": 525,
  "color": "#8B4513",
  "operator": "UP",
  "type": "freight"
}
```

**Response:**
```
Route "Rocky Mountain Freight Line" (rocky-mountain-freight) created with 3 stations, 525 miles. {"id": "rocky-mountain-freight"}
```

The route is laid. Now let me create a freight train and dispatch it.

**Tool call: `create_train`**
```json
{
  "id": "train-rocky-01",
  "name": "The Mountain Hauler",
  "type": "diesel",
  "color": {
    "primary": "#8B4513",
    "secondary": "#F4C542",
    "accent": "#1A1A2E"
  },
  "personality": "A big, dependable diesel who takes pride in pulling heavy loads through mountain passes without breaking a sweat",
  "cargoCapability": ["coal", "livestock", "steel", "lumber"],
  "maxCars": 25,
  "speedMph": 45,
  "operator": "UP",
  "category": "freight",
  "preferredRouteIds": ["rocky-mountain-freight"]
}
```

**Response:**
```
Train "The Mountain Hauler" (train-rocky-01) created. Type: diesel, Speed: 45mph, Max cars: 25. {"id": "train-rocky-01", "status": "sleeping"}
```

**Tool call: `dispatch_train`**
```json
{
  "trainId": "train-rocky-01",
  "routeId": "rocky-mountain-freight"
}
```

**Response:**
```
Train "train-rocky-01" dispatched on route "rocky-mountain-freight". {"trainId": "train-rocky-01", "routeId": "rocky-mountain-freight", "status": "departing"}
```

Your Rocky Mountain Freight Line is up and running. Here is a summary:

- **Route**: Denver to Salt Lake City via Grand Junction (525 miles)
- **Stations**: Denver Union Station (coal), Grand Junction Depot (livestock), Salt Lake City Central (smelter)
- **Train**: The Mountain Hauler -- a powerful UP diesel with 25-car capacity, cruising at 45 mph
- **Status**: Departing Denver now

The Colorado Coal Company will produce coal for the Great Basin Smelting Co.,
and the Western Slope Stockyards will ship livestock. As the simulation runs,
cargo will accumulate at each station and The Mountain Hauler will pick it up
on each run.

---

## Scenario 2: Optimize Cargo Delivery

Query cargo shipments, analyze delays, and reassign routes to fix bottlenecks.

### User

> I think there's a cargo backlog somewhere. Can you check the network and
> figure out where the bottleneck is?

### Claude

Let me investigate. I will check the waiting cargo across the network, look at
train assignments, and find where shipments are piling up.

**Tool call: `get_cargo_shipments`**
```json
{
  "status": "waiting"
}
```

**Response:**
```json
[
  {
    "id": "cargo-050",
    "type": "coal",
    "quantity": 45,
    "unit": "tons",
    "originStationId": "pittsburgh-station",
    "destinationStationId": "chicago-union",
    "assignedTrainId": null,
    "status": "waiting",
    "createdAt": 180,
    "loadedAt": null,
    "deliveredAt": null,
    "industrySource": "Pittsburgh Coal Co.",
    "industryDestination": "Chicago Steel Works"
  },
  {
    "id": "cargo-051",
    "type": "coal",
    "quantity": 38,
    "unit": "tons",
    "originStationId": "pittsburgh-station",
    "destinationStationId": "chicago-union",
    "assignedTrainId": null,
    "status": "waiting",
    "createdAt": 240,
    "loadedAt": null,
    "deliveredAt": null,
    "industrySource": "Pittsburgh Coal Co.",
    "industryDestination": "Chicago Steel Works"
  },
  {
    "id": "cargo-052",
    "type": "coal",
    "quantity": 50,
    "unit": "tons",
    "originStationId": "pittsburgh-station",
    "destinationStationId": "chicago-union",
    "assignedTrainId": null,
    "status": "waiting",
    "createdAt": 300,
    "loadedAt": null,
    "deliveredAt": null,
    "industrySource": "Pittsburgh Coal Co.",
    "industryDestination": "Chicago Steel Works"
  },
  {
    "id": "cargo-060",
    "type": "grain",
    "quantity": 30,
    "unit": "tons",
    "originStationId": "chicago-union",
    "destinationStationId": "new-york-penn",
    "assignedTrainId": null,
    "status": "waiting",
    "createdAt": 350,
    "loadedAt": null,
    "deliveredAt": null,
    "industrySource": "Midwest Grain Exchange",
    "industryDestination": "NYC Distribution Center"
  }
]
```

I see the problem. Pittsburgh has 3 coal shipments totaling 133 tons with no
train assigned. Let me check what trains are available.

**Tool call: `get_all_trains`**
```json
{}
```

**Response:**
```json
[
  {
    "id": "train-001",
    "name": "The Sunrise Express",
    "type": "steam",
    "status": "en_route",
    "currentRouteId": "northeast-corridor",
    "routeProgress": 0.72,
    "currentPosition": [40.1234, -76.5432],
    "heading": 45,
    "cargoCount": 2,
    "passengerCount": 18,
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
  },
  {
    "id": "train-003",
    "name": "The Iron Horse",
    "type": "diesel",
    "status": "at_station",
    "currentRouteId": "lake-shore-limited",
    "routeProgress": 0.5,
    "currentPosition": [42.3601, -71.0589],
    "heading": 270,
    "cargoCount": 0,
    "passengerCount": 0,
    "speedMph": 0,
    "operator": "CSX",
    "category": "freight"
  }
]
```

There is the issue: Old Ironside (a BNSF freight diesel) is sleeping in
Chicago, and The Iron Horse (CSX freight) is sitting idle at a station. Neither
is running the Pittsburgh-to-Chicago corridor. Let me check if there is a
route connecting Pittsburgh to Chicago.

**Tool call: `find_path`**
```json
{
  "from": "pittsburgh-station",
  "to": "chicago-union"
}
```

**Response:**
```json
{
  "fromStationId": "pittsburgh-station",
  "toStationId": "chicago-union",
  "legs": [
    {
      "routeId": "pennsylvania-mainline",
      "fromStationId": "pittsburgh-station",
      "toStationId": "chicago-union",
      "distanceMiles": 468
    }
  ],
  "totalDistanceMiles": 468,
  "stationSequence": ["pittsburgh-station", "chicago-union"]
}
```

There is a direct route: the Pennsylvania Mainline (468 miles). Old Ironside
is sleeping in Chicago, which is perfect -- I will dispatch it on that route.

**Tool call: `dispatch_train`**
```json
{
  "trainId": "train-002",
  "routeId": "pennsylvania-mainline"
}
```

**Response:**
```
Train "train-002" dispatched on route "pennsylvania-mainline". {"trainId": "train-002", "routeId": "pennsylvania-mainline", "status": "departing"}
```

Now let me also set the simulation to 5x speed so we can see the backlog clear
faster.

**Tool call: `set_speed`**
```json
{
  "speed": 5
}
```

**Response:**
```
Simulation speed set to 5x. {"speed": 5, "previousSpeed": 1}
```

Here is the diagnosis and fix:

- **Bottleneck**: Pittsburgh station had 133 tons of coal (3 shipments) waiting
  with no train assigned to the Pittsburgh-Chicago corridor.
- **Root cause**: Old Ironside (BNSF freight diesel) was sleeping in Chicago
  instead of running the Pennsylvania Mainline.
- **Fix**: Dispatched Old Ironside on the Pennsylvania Mainline. It is now
  departing Chicago and will pick up the coal on its return leg through
  Pittsburgh.
- **Speed**: Set simulation to 5x to clear the backlog faster.

The Iron Horse (CSX) is also idle at a station -- you may want to assign it to
a route as well to prevent future backlogs.

---

## Scenario 3: Create Passenger Service

Spawn passengers, dispatch an Amtrak train, and track arrivals.

### User

> Set up a busy passenger service on the Northeast Corridor. I want lots of
> people traveling between Boston and Washington.

### Claude

I will spawn passengers at multiple stations along the Northeast Corridor,
then make sure a passenger train is running to serve them. Let me first check
the current state of the corridor.

**Tool call: `get_route`**
```json
{
  "routeId": "northeast-corridor"
}
```

**Response:**
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

The route has 4 stations: Boston, New York, Philadelphia, and Washington. I
will spawn passengers in both directions at each station.

**Tool call: `spawn_passengers`**
```json
{
  "count": 25,
  "originStationId": "boston-south",
  "destinationStationId": "new-york-penn"
}
```

**Response:**
```
Spawned 25 passenger(s) at "boston-south" headed to "new-york-penn". {"count": 25, "passengerIds": ["pax-400", "pax-401", "pax-402", ...]}
```

**Tool call: `spawn_passengers`**
```json
{
  "count": 15,
  "originStationId": "boston-south",
  "destinationStationId": "washington-union"
}
```

**Response:**
```
Spawned 15 passenger(s) at "boston-south" headed to "washington-union". {"count": 15, "passengerIds": ["pax-425", ...]}
```

**Tool call: `spawn_passengers`**
```json
{
  "count": 30,
  "originStationId": "new-york-penn",
  "destinationStationId": "washington-union"
}
```

**Response:**
```
Spawned 30 passenger(s) at "new-york-penn" headed to "washington-union". {"count": 30, "passengerIds": ["pax-440", ...]}
```

**Tool call: `spawn_passengers`**
```json
{
  "count": 20,
  "originStationId": "washington-union",
  "destinationStationId": "new-york-penn"
}
```

**Response:**
```
Spawned 20 passenger(s) at "washington-union" headed to "new-york-penn". {"count": 20, "passengerIds": ["pax-470", ...]}
```

**Tool call: `spawn_passengers`**
```json
{
  "count": 10,
  "originStationId": "philadelphia-30th",
  "destinationStationId": "new-york-penn"
}
```

**Response:**
```
Spawned 10 passenger(s) at "philadelphia-30th" headed to "new-york-penn". {"count": 10, "passengerIds": ["pax-490", ...]}
```

Now I have 100 passengers waiting across the corridor. Let me create a
dedicated Amtrak passenger train and dispatch it.

**Tool call: `create_train`**
```json
{
  "id": "train-acela",
  "name": "The Acela Flyer",
  "type": "diesel",
  "color": {
    "primary": "#1B3A5C",
    "secondary": "#F0EDE4",
    "accent": "#C45B3E"
  },
  "personality": "A sleek and proud express who zips between the great cities of the East Coast, always on time and never without a story to tell",
  "cargoCapability": ["packages", "mail"],
  "maxCars": 10,
  "speedMph": 85,
  "operator": "Amtrak",
  "category": "passenger",
  "preferredRouteIds": ["northeast-corridor"]
}
```

**Response:**
```
Train "The Acela Flyer" (train-acela) created. Type: diesel, Speed: 85mph, Max cars: 10. {"id": "train-acela", "status": "sleeping"}
```

**Tool call: `dispatch_train`**
```json
{
  "trainId": "train-acela",
  "routeId": "northeast-corridor"
}
```

**Response:**
```
Train "train-acela" dispatched on route "northeast-corridor". {"trainId": "train-acela", "routeId": "northeast-corridor", "status": "departing"}
```

Let me set the speed to 15x and then check back to see how the service is
going.

**Tool call: `set_speed`**
```json
{
  "speed": 15
}
```

**Response:**
```
Simulation speed set to 15x. {"speed": 15, "previousSpeed": 1}
```

### User

> How is the service going? How many passengers have been delivered?

### Claude

**Tool call: `get_train`**
```json
{
  "trainId": "train-acela"
}
```

**Response:**
```json
{
  "id": "train-acela",
  "name": "The Acela Flyer",
  "type": "diesel",
  "status": "en_route",
  "currentRouteId": "northeast-corridor",
  "routeProgress": 0.58,
  "currentPosition": [40.2305, -74.7719],
  "heading": 220,
  "speedMph": 85,
  "maxCars": 10,
  "cargoCapability": ["packages", "mail"],
  "passengers": [
    {
      "id": "pax-440",
      "name": "Margaret Chen",
      "ageGroup": "adult",
      "originStationId": "new-york-penn",
      "destinationStationId": "washington-union",
      "assignedTrainId": "train-acela",
      "activity": "reading",
      "mood": "content",
      "status": "in_transit",
      "createdAt": 360,
      "boardedAt": 480,
      "arrivedAt": null
    }
  ],
  "stats": {
    "totalMiles": 215,
    "totalDeliveries": 0,
    "totalPassengersCarried": 55
  }
}
```

**Tool call: `get_passengers`**
```json
{
  "status": "arrived"
}
```

**Response:**
```json
[
  {
    "id": "pax-400",
    "name": "Samuel Brightwater",
    "ageGroup": "elder",
    "originStationId": "boston-south",
    "destinationStationId": "new-york-penn",
    "assignedTrainId": "train-acela",
    "activity": "stretching",
    "mood": "happy",
    "status": "arrived",
    "createdAt": 360,
    "boardedAt": 370,
    "arrivedAt": 498
  }
]
```

**Tool call: `get_stats`**
```json
{}
```

**Response:**
```json
{
  "today": {
    "cargoTonsMoved": 0,
    "cargoDeliveries": 0,
    "passengersDelivered": 38,
    "trainMilesTraveled": 215,
    "busiestStation": "new-york-penn",
    "busiestCorridor": "northeast-corridor"
  },
  "allTime": {
    "cargoTonsMoved": 0,
    "cargoDeliveries": 0,
    "passengersDelivered": 38,
    "trainMilesTraveled": 215,
    "busiestStation": "new-york-penn",
    "busiestCorridor": "northeast-corridor"
  }
}
```

The Acela Flyer is making great progress:

- **Position**: Currently between New York and Philadelphia (58% through the corridor)
- **Speed**: Cruising at 85 mph
- **Passengers delivered so far**: 38 out of 100
- **Passengers aboard**: The train is carrying passengers bound for Washington
- **Busiest station**: New York Penn (as expected -- it is the hub of the corridor)

The Boston-to-New-York passengers have already been dropped off. The train
picked up the New York and Philadelphia passengers and is now heading south
toward Washington. Once it completes this run and makes the return trip, all
100 passengers should be delivered.

---

## Scenario 4: Railroad Tycoon

Add industries, create freight routes, and manage a growing fleet.

### User

> I want to build an industrial empire. Set up a steel supply chain: coal
> from West Virginia, iron ore from Minnesota, steel production in Pittsburgh,
> and automobile manufacturing in Detroit. Build the whole thing.

### Claude

That is a four-city supply chain. I will build it from raw materials to
finished goods. Let me create the stations, industries, routes, and trains.

**Tool call: `create_station`**
```json
{
  "id": "charleston-wv",
  "name": "Charleston Rail Yard",
  "city": "Charleston",
  "state": "WV",
  "position": [38.3498, -81.6326],
  "size": "regional",
  "industries": [
    {
      "type": "coal_mine",
      "name": "Appalachian Coal & Coke",
      "produces": ["coal"],
      "consumes": [],
      "productionRate": 45,
      "minBatch": 30,
      "maxBatch": 60
    }
  ],
  "description": "Deep in the Appalachian hills, where coal trains rumble out of the hollows each morning, their cars heaped high with black gold."
}
```

**Response:**
```
Station "Charleston Rail Yard" (charleston-wv) created in Charleston, WV. {"id": "charleston-wv", "trackCount": 4}
```

**Tool call: `create_station`**
```json
{
  "id": "duluth-mn",
  "name": "Duluth Iron Range Terminal",
  "city": "Duluth",
  "state": "MN",
  "position": [46.7867, -92.1005],
  "size": "regional",
  "industries": [
    {
      "type": "iron_mine",
      "name": "Mesabi Range Mining Co.",
      "produces": ["iron_ore"],
      "consumes": [],
      "productionRate": 60,
      "minBatch": 25,
      "maxBatch": 50
    }
  ],
  "description": "The gateway to the great iron ranges of northern Minnesota, where ore trains descend from the Mesabi hills to the shores of Lake Superior."
}
```

**Response:**
```
Station "Duluth Iron Range Terminal" (duluth-mn) created in Duluth, MN. {"id": "duluth-mn", "trackCount": 4}
```

Now I will set up Pittsburgh as the steel production hub. Let me check if it
already exists.

**Tool call: `get_station`**
```json
{
  "stationId": "pittsburgh-station"
}
```

**Response:**
```json
{
  "id": "pittsburgh-station",
  "name": "Pittsburgh Station",
  "city": "Pittsburgh",
  "state": "PA",
  "position": [40.4406, -79.9959],
  "size": "major_hub",
  "trackCount": 6,
  "architectureStyle": "Industrial Gothic",
  "description": "The Steel City's grand station, where smoke and steam rise from the mills along the three rivers.",
  "industries": [
    {
      "type": "steel_mill",
      "name": "Pittsburgh Steel Works",
      "produces": ["steel"],
      "consumes": ["coal", "iron_ore"],
      "productionRate": 90,
      "minBatch": 10,
      "maxBatch": 30
    }
  ],
  "waitingCargo": [],
  "waitingPassengers": [],
  "trainsAtStation": [],
  "isJunction": true,
  "connectedRouteIds": ["pennsylvania-mainline"]
}
```

Pittsburgh already exists with a steel mill that consumes coal and iron ore.
Now let me create Detroit for automobile manufacturing.

**Tool call: `create_station`**
```json
{
  "id": "detroit-michigan",
  "name": "Detroit Michigan Central",
  "city": "Detroit",
  "state": "MI",
  "position": [42.3314, -83.0458],
  "size": "major_hub",
  "industries": [
    {
      "type": "auto_plant",
      "name": "Motor City Assembly",
      "produces": ["automobiles"],
      "consumes": ["steel"],
      "productionRate": 120,
      "minBatch": 5,
      "maxBatch": 15
    }
  ],
  "description": "The beating heart of American manufacturing, where gleaming new automobiles roll off the line and onto flatcars bound for every corner of the country."
}
```

**Response:**
```
Station "Detroit Michigan Central" (detroit-michigan) created in Detroit, MI. {"id": "detroit-michigan", "trackCount": 8}
```

Now I will create the freight routes connecting the supply chain.

**Tool call: `create_route`**
```json
{
  "id": "appalachian-coal-line",
  "name": "Appalachian Coal Line",
  "stationIds": ["charleston-wv", "pittsburgh-station"],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-81.6326, 38.3498],
      [-80.8431, 38.9072],
      [-79.9959, 40.4406]
    ]
  },
  "lengthMiles": 260,
  "color": "#1A1A2E",
  "operator": "CSX",
  "type": "freight"
}
```

**Response:**
```
Route "Appalachian Coal Line" (appalachian-coal-line) created with 2 stations, 260 miles. {"id": "appalachian-coal-line"}
```

**Tool call: `create_route`**
```json
{
  "id": "iron-range-express",
  "name": "Iron Range Express",
  "stationIds": ["duluth-mn", "pittsburgh-station"],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-92.1005, 46.7867],
      [-87.6298, 41.8781],
      [-84.5120, 41.0534],
      [-79.9959, 40.4406]
    ]
  },
  "lengthMiles": 890,
  "color": "#8B0000",
  "operator": "BNSF",
  "type": "freight"
}
```

**Response:**
```
Route "Iron Range Express" (iron-range-express) created with 2 stations, 890 miles. {"id": "iron-range-express"}
```

**Tool call: `create_route`**
```json
{
  "id": "steel-belt-corridor",
  "name": "Steel Belt Corridor",
  "stationIds": ["pittsburgh-station", "detroit-michigan"],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-79.9959, 40.4406],
      [-81.6944, 41.4993],
      [-83.0458, 42.3314]
    ]
  },
  "lengthMiles": 315,
  "color": "#4682B4",
  "operator": "Norfolk Southern",
  "type": "freight"
}
```

**Response:**
```
Route "Steel Belt Corridor" (steel-belt-corridor) created with 2 stations, 315 miles. {"id": "steel-belt-corridor"}
```

Excellent. Routes are laid. Now I will create three freight trains -- one for
each leg of the supply chain.

**Tool call: `create_train`**
```json
{
  "id": "train-coal-hauler",
  "name": "The Coal Dragon",
  "type": "diesel",
  "color": { "primary": "#1A1A2E", "secondary": "#F4C542", "accent": "#C45B3E" },
  "personality": "A dark and powerful diesel who rumbles through the Appalachian hollows, hauling coal like a dragon guarding its hoard",
  "cargoCapability": ["coal"],
  "maxCars": 30,
  "speedMph": 40,
  "operator": "CSX",
  "category": "freight",
  "preferredRouteIds": ["appalachian-coal-line"]
}
```

**Response:**
```
Train "The Coal Dragon" (train-coal-hauler) created. Type: diesel, Speed: 40mph, Max cars: 30. {"id": "train-coal-hauler", "status": "sleeping"}
```

**Tool call: `create_train`**
```json
{
  "id": "train-ore-hauler",
  "name": "The Iron Giant",
  "type": "diesel",
  "color": { "primary": "#8B0000", "secondary": "#C0C0C0", "accent": "#F0EDE4" },
  "personality": "A massive iron-red diesel who makes the long haul from the frozen north, steady and unstoppable as the ore he carries",
  "cargoCapability": ["iron_ore"],
  "maxCars": 35,
  "speedMph": 50,
  "operator": "BNSF",
  "category": "freight",
  "preferredRouteIds": ["iron-range-express"]
}
```

**Response:**
```
Train "The Iron Giant" (train-ore-hauler) created. Type: diesel, Speed: 50mph, Max cars: 35. {"id": "train-ore-hauler", "status": "sleeping"}
```

**Tool call: `create_train`**
```json
{
  "id": "train-steel-runner",
  "name": "The Steel Runner",
  "type": "diesel",
  "color": { "primary": "#4682B4", "secondary": "#F4C542", "accent": "#1A1A2E" },
  "personality": "A nimble and quick diesel who darts between Pittsburgh and Detroit, always eager to deliver the gleaming steel that becomes America's cars",
  "cargoCapability": ["steel", "automobiles"],
  "maxCars": 20,
  "speedMph": 55,
  "operator": "Norfolk Southern",
  "category": "freight",
  "preferredRouteIds": ["steel-belt-corridor"]
}
```

**Response:**
```
Train "The Steel Runner" (train-steel-runner) created. Type: diesel, Speed: 55mph, Max cars: 20. {"id": "train-steel-runner", "status": "sleeping"}
```

Now let me dispatch all three trains and seed the supply chain with initial
cargo.

**Tool call: `dispatch_train`**
```json
{ "trainId": "train-coal-hauler", "routeId": "appalachian-coal-line" }
```

**Response:**
```
Train "train-coal-hauler" dispatched on route "appalachian-coal-line". {"trainId": "train-coal-hauler", "routeId": "appalachian-coal-line", "status": "departing"}
```

**Tool call: `dispatch_train`**
```json
{ "trainId": "train-ore-hauler", "routeId": "iron-range-express" }
```

**Response:**
```
Train "train-ore-hauler" dispatched on route "iron-range-express". {"trainId": "train-ore-hauler", "routeId": "iron-range-express", "status": "departing"}
```

**Tool call: `dispatch_train`**
```json
{ "trainId": "train-steel-runner", "routeId": "steel-belt-corridor" }
```

**Response:**
```
Train "train-steel-runner" dispatched on route "steel-belt-corridor". {"trainId": "train-steel-runner", "routeId": "steel-belt-corridor", "status": "departing"}
```

**Tool call: `spawn_cargo`**
```json
{
  "type": "coal",
  "quantity": 100,
  "originStationId": "charleston-wv",
  "destinationStationId": "pittsburgh-station"
}
```

**Response:**
```
Spawned 100 units of coal cargo at "charleston-wv" bound for "pittsburgh-station". {"cargoId": "cargo-300", "status": "waiting"}
```

**Tool call: `spawn_cargo`**
```json
{
  "type": "iron_ore",
  "quantity": 80,
  "originStationId": "duluth-mn",
  "destinationStationId": "pittsburgh-station"
}
```

**Response:**
```
Spawned 80 units of iron_ore cargo at "duluth-mn" bound for "pittsburgh-station". {"cargoId": "cargo-301", "status": "waiting"}
```

Your industrial empire is built. Here is the supply chain:

```
  Duluth, MN                Charleston, WV
  (Iron Ore)                (Coal)
      |                         |
      | Iron Range Express      | Appalachian Coal Line
      | 890 mi, BNSF            | 260 mi, CSX
      | The Iron Giant           | The Coal Dragon
      |                         |
      +---------> Pittsburgh <--+
                  (Steel Mill)
                      |
                      | Steel Belt Corridor
                      | 315 mi, Norfolk Southern
                      | The Steel Runner
                      |
                      v
                  Detroit, MI
                  (Auto Plant)
```

**Supply chain flow**:
1. Appalachian Coal & Coke (Charleston) produces coal every 45 minutes
2. Mesabi Range Mining (Duluth) produces iron ore every 60 minutes
3. The Coal Dragon and The Iron Giant haul raw materials to Pittsburgh
4. Pittsburgh Steel Works consumes coal + iron ore, produces steel every 90 minutes
5. The Steel Runner hauls steel to Detroit
6. Motor City Assembly consumes steel, produces automobiles every 120 minutes

I also seeded 100 tons of coal and 80 tons of iron ore to get things moving
immediately. The industries will continue producing on their own from here.

---

## Scenario 5: Network Explorer

Query the network graph, find paths, and identify bottlenecks.

### User

> Give me a complete picture of the railroad network. Which stations are the
> most connected? Are there any isolated stations? What's the longest route
> between any two stations?

### Claude

Let me pull the full network graph and analyze the topology.

**Tool call: `get_network_graph`**
```json
{}
```

**Response:**
```json
{
  "junctionStationIds": ["chicago-union", "new-york-penn", "pittsburgh-station"],
  "totalNodes": 10,
  "totalEdges": 14,
  "nodes": [
    { "stationId": "chicago-union", "connectedRouteIds": ["northeast-corridor", "empire-builder", "lake-shore-limited", "pennsylvania-mainline"], "isJunction": true },
    { "stationId": "new-york-penn", "connectedRouteIds": ["northeast-corridor", "lake-shore-limited"], "isJunction": true },
    { "stationId": "pittsburgh-station", "connectedRouteIds": ["pennsylvania-mainline", "appalachian-coal-line", "iron-range-express", "steel-belt-corridor"], "isJunction": true },
    { "stationId": "boston-south", "connectedRouteIds": ["northeast-corridor"], "isJunction": false },
    { "stationId": "philadelphia-30th", "connectedRouteIds": ["northeast-corridor"], "isJunction": false },
    { "stationId": "washington-union", "connectedRouteIds": ["northeast-corridor"], "isJunction": false },
    { "stationId": "charleston-wv", "connectedRouteIds": ["appalachian-coal-line"], "isJunction": false },
    { "stationId": "duluth-mn", "connectedRouteIds": ["iron-range-express"], "isJunction": false },
    { "stationId": "detroit-michigan", "connectedRouteIds": ["steel-belt-corridor"], "isJunction": false },
    { "stationId": "seattle-king", "connectedRouteIds": ["empire-builder"], "isJunction": false }
  ],
  "connectivity": [
    { "routeId": "northeast-corridor", "stationIds": ["boston-south", "new-york-penn", "philadelphia-30th", "washington-union"], "lengthMiles": 457, "operator": "Amtrak", "type": "passenger" },
    { "routeId": "lake-shore-limited", "stationIds": ["chicago-union", "new-york-penn"], "lengthMiles": 960, "operator": "Amtrak", "type": "passenger" },
    { "routeId": "empire-builder", "stationIds": ["chicago-union", "seattle-king"], "lengthMiles": 2206, "operator": "Amtrak", "type": "passenger" },
    { "routeId": "pennsylvania-mainline", "stationIds": ["pittsburgh-station", "chicago-union"], "lengthMiles": 468, "operator": "CSX", "type": "freight" },
    { "routeId": "appalachian-coal-line", "stationIds": ["charleston-wv", "pittsburgh-station"], "lengthMiles": 260, "operator": "CSX", "type": "freight" },
    { "routeId": "iron-range-express", "stationIds": ["duluth-mn", "pittsburgh-station"], "lengthMiles": 890, "operator": "BNSF", "type": "freight" },
    { "routeId": "steel-belt-corridor", "stationIds": ["pittsburgh-station", "detroit-michigan"], "lengthMiles": 315, "operator": "Norfolk Southern", "type": "freight" }
  ]
}
```

Here is the full analysis of the network.

**Network summary**: 10 stations, 7 routes, 14 route-station edges.

**Junction stations** (most connected):

| Station | Routes | Connections |
|---------|--------|-------------|
| Pittsburgh | 4 routes | Coal Line, Iron Range, Steel Belt, PA Mainline |
| Chicago Union | 4 routes | Northeast Corridor, Empire Builder, Lake Shore, PA Mainline |
| New York Penn | 2 routes | Northeast Corridor, Lake Shore Limited |

Pittsburgh and Chicago are tied as the most connected hubs with 4 routes each.
Pittsburgh is the industrial heart (all freight), while Chicago is the
passenger and freight crossroads.

**Leaf stations** (1 route only -- potential bottlenecks):

| Station | Single Route |
|---------|-------------|
| Boston South | Northeast Corridor |
| Philadelphia 30th | Northeast Corridor |
| Washington Union | Northeast Corridor |
| Charleston, WV | Appalachian Coal Line |
| Duluth, MN | Iron Range Express |
| Detroit, MI | Steel Belt Corridor |
| Seattle | Empire Builder |

All 7 of these are leaf nodes with only one route in or out. None are
completely isolated -- every station is reachable from every other station.

Now let me find the longest path in the network.

**Tool call: `find_path`**
```json
{
  "from": "seattle-king",
  "to": "charleston-wv"
}
```

**Response:**
```json
{
  "fromStationId": "seattle-king",
  "toStationId": "charleston-wv",
  "legs": [
    {
      "routeId": "empire-builder",
      "fromStationId": "seattle-king",
      "toStationId": "chicago-union",
      "distanceMiles": 2206
    },
    {
      "routeId": "pennsylvania-mainline",
      "fromStationId": "chicago-union",
      "toStationId": "pittsburgh-station",
      "distanceMiles": 468
    },
    {
      "routeId": "appalachian-coal-line",
      "fromStationId": "pittsburgh-station",
      "toStationId": "charleston-wv",
      "distanceMiles": 260
    }
  ],
  "totalDistanceMiles": 2934,
  "stationSequence": ["seattle-king", "chicago-union", "pittsburgh-station", "charleston-wv"]
}
```

**Tool call: `find_path`**
```json
{
  "from": "seattle-king",
  "to": "washington-union"
}
```

**Response:**
```json
{
  "fromStationId": "seattle-king",
  "toStationId": "washington-union",
  "legs": [
    {
      "routeId": "empire-builder",
      "fromStationId": "seattle-king",
      "toStationId": "chicago-union",
      "distanceMiles": 2206
    },
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
  "totalDistanceMiles": 3391,
  "stationSequence": ["seattle-king", "chicago-union", "new-york-penn", "washington-union"]
}
```

**Longest journeys in the network**:

| From | To | Distance | Legs |
|------|----|----------|------|
| Seattle | Washington, DC | 3,391 mi | Empire Builder, Lake Shore, NE Corridor |
| Seattle | Charleston, WV | 2,934 mi | Empire Builder, PA Mainline, Coal Line |
| Seattle | Detroit | 2,989 mi | Empire Builder, PA Mainline, Steel Belt |

The longest possible trip is **Seattle to Washington, DC at 3,391 miles**
across 3 route corridors and 4 stations. That journey would take roughly
40-50 hours at passenger train speeds.

**Key observations**:

1. **No isolated stations** -- every station can reach every other station.
2. **Chicago is the critical hub** -- it connects the western network (Empire
   Builder) to the eastern network. If Chicago went down, Seattle would be
   completely cut off.
3. **Pittsburgh is the industrial hub** -- all four freight corridors converge
   there, making it the key node for the steel supply chain.
4. **The Northeast Corridor is the densest route** -- 4 stations on a single
   457-mile corridor, versus the Empire Builder's 2 stations over 2,206 miles.
5. **Potential improvement**: A direct route from Detroit to Chicago (about 280
   miles) would create a valuable shortcut and reduce dependence on the
   Pittsburgh-Chicago leg for auto shipments heading west.
