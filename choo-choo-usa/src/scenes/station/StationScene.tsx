/**
 * StationScene.tsx
 *
 * Side-view station platform scene. Shows a station building, platform,
 * tracks, waiting passengers, workers, and trains if present.
 * Time-of-day sky colors and ambient effects bring the scene to life.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: specs/PHASE_4_INTERIORS.md for design reference
 *
 * Dependencies:
 *   - pixi.js: Application, Container, Graphics
 *   - drawStation: building and platform renderers
 *   - drawCharacter: passenger rendering
 *   - drawWorker: worker rendering
 *   - drawTrain: train rendering (from Phase 1)
 *   - StationAmbient: ambient effects
 *   - Zustand stores: station, passenger, cargo, train, simulation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Application, Container, Graphics } from 'pixi.js';
import { useStationStore } from '../../stores/useStationStore';
import { useTrainStore } from '../../stores/useTrainStore';
import { usePassengerStore } from '../../stores/usePassengerStore';
import { useCargoStore } from '../../stores/useCargoStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { drawStationBuilding, drawPlatformElements } from '../../utils/drawStation';
import { drawCharacter, activityToPose } from '../../utils/drawCharacter';
import { drawWorker } from '../../utils/drawWorker';
import { drawTrain } from '../roundhouse/drawTrain';
import { StationAmbient } from './StationAmbient';
import { hexToNumber, lerpHexNum } from '../../utils/animation';
import { getHour } from '../../utils/time';
import { narrateStation } from '../../engine/narratorMessages';
import { generateTerrain } from '../../utils/backgrounds/terrainProfile';
import { drawTreeLine, scatterTrees } from '../../utils/backgrounds/treeDrawing';
import { scatterGroundStamps } from '../../utils/backgrounds/groundStamps';
import { createSimplePaperGrain } from '../../utils/backgrounds/paperGrain';
import { TopBar } from '../../components/hud/TopBar';
import { Narrator } from '../../components/ui/Narrator';
import { DepartureBoard } from './DepartureBoard';
import { DetailTooltip } from '../../components/ui/DetailTooltip';
import type { Passenger } from '../../types/passenger';
import type { CargoShipment } from '../../types/cargo';
import '../../styles/globals.css';
import '../../styles/storybook.css';

const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;

const TWILIGHT_BLUE = 0x1B3A5C;

export function StationScene() {
  const { id: stationId } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [narratorText, setNarratorText] = useState<string | null>(null);
  const narratorTimerRef = useRef<number | null>(null);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    data: Passenger | CargoShipment | { role: string } | null;
    type: 'passenger' | 'cargo' | 'worker' | null;
    position: { x: number; y: number };
  }>({ data: null, type: null, position: { x: 0, y: 0 } });

  const station = useStationStore((s) => s.getStationById(stationId ?? ''));

  const showNarrator = useCallback((text: string, duration = 8000) => {
    setNarratorText(text);
    if (narratorTimerRef.current) clearTimeout(narratorTimerRef.current);
    narratorTimerRef.current = window.setTimeout(() => setNarratorText(null), duration);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !stationId || !station) return;

    let destroyed = false;
    const app = new Application();

    const init = async () => {
      await app.init({
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        backgroundColor: TWILIGHT_BLUE,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) { app.destroy(); return; }
      appRef.current = app;
      canvasRef.current!.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.objectFit = 'contain';

      // -- Parallax layers --
      const world = new Container();
      app.stage.addChild(world);

      const skyLayer = new Container();        // 0.2x
      const backdropLayer = new Container();   // 0.5x
      const buildingLayer = new Container();   // 0.7x
      const platformLayer = new Container();   // 1.0x
      const foregroundLayer = new Container(); // 1.3x

      world.addChild(skyLayer);
      world.addChild(backdropLayer);
      world.addChild(buildingLayer);
      world.addChild(platformLayer);
      world.addChild(foregroundLayer);

      // ===== SKY =====
      const sky = new Graphics();
      sky.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      sky.fill(TWILIGHT_BLUE);
      skyLayer.addChild(sky);

      // Clouds
      for (let i = 0; i < 5; i++) {
        const cloud = new Graphics();
        const cx = Math.random() * SCENE_WIDTH;
        const cy = 40 + Math.random() * 100;
        for (let j = 0; j < 4; j++) {
          cloud.circle(cx + j * 25 - 37, cy + (Math.random() - 0.5) * 12, 18 + Math.random() * 12);
        }
        cloud.fill({ color: 0xF0EDE4, alpha: 0.3 });
        skyLayer.addChild(cloud);
      }

      // ===== BACKDROP (layered hills with trees) =====
      // Use station name hash as seed for deterministic terrain
      const terrainSeed = stationId!.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const terrainLayers = generateTerrain({
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        groundY: 580,
        seed: terrainSeed,
      });

      // Add each terrain layer to its appropriate parallax container
      for (let i = 0; i < terrainLayers.length; i++) {
        const layer = terrainLayers[i];
        if (i < 2) {
          // Far and mid-far hills go in backdrop
          backdropLayer.addChild(layer.graphics);
        } else {
          // Near hills go in building layer (behind the station)
          buildingLayer.addChild(layer.graphics);
        }
      }

      // Distant tree line silhouettes along the far hills
      const distantTreeLine = drawTreeLine(0, SCENE_WIDTH, 430, 0x3A4A6B, 4, undefined);
      backdropLayer.addChild(distantTreeLine);

      // Mid-ground scattered trees
      const midTrees = scatterTrees(
        0, SCENE_WIDTH,
        (x) => 460 + Math.sin(x * 0.004) * 25,
        'mid', 2, terrainSeed + 100,
      );
      backdropLayer.addChild(midTrees);

      // ===== STATION BUILDING =====
      const buildingScale = station.size === 'major_hub' ? 1.0 : station.size === 'regional' ? 0.85 : 0.7;
      const building = drawStationBuilding(
        station.architectureStyle,
        station.name,
        buildingScale,
      );
      building.x = 300;
      building.y = 600;
      buildingLayer.addChild(building);

      // ===== PLATFORM & TRACKS =====
      const clock = useSimulationStore.getState().clock;
      const platformElements = drawPlatformElements(station.size, clock % 1440);
      platformElements.x = 200;
      platformElements.y = 600;
      platformLayer.addChild(platformElements);

      // Tracks across the middle-bottom
      const trackY = 660;
      const tracks = new Graphics();
      for (let ti = 0; ti < station.trackCount; ti++) {
        const ty = trackY + ti * 30;
        // Rails
        tracks.moveTo(0, ty);
        tracks.lineTo(SCENE_WIDTH, ty);
        tracks.moveTo(0, ty + 10);
        tracks.lineTo(SCENE_WIDTH, ty + 10);
        tracks.stroke({ color: 0x8C8C8C, width: 2.5 });
        // Crossties
        for (let ctx = 10; ctx < SCENE_WIDTH; ctx += 18) {
          tracks.moveTo(ctx, ty - 3);
          tracks.lineTo(ctx, ty + 13);
          tracks.stroke({ color: 0x6B4226, width: 3 });
        }
      }
      platformLayer.addChild(tracks);

      // ===== TRAIN AT STATION (if present) =====
      const trainStore = useTrainStore.getState();
      for (const trainId of station.trainsAtStation) {
        const train = trainStore.getTrainById(trainId);
        if (!train) continue;
        const sprite = drawTrain(train.name, train.color, train.type, 0.8, train.id);
        sprite.container.x = SCENE_WIDTH / 2 + 100;
        sprite.container.y = trackY + 5;
        platformLayer.addChild(sprite.container);
      }

      // ===== WAITING PASSENGERS =====
      const waitingPassengers = usePassengerStore.getState().getWaitingAtStation(stationId);
      const maxDisplayPassengers = Math.min(waitingPassengers.length, 12);
      for (let i = 0; i < maxDisplayPassengers; i++) {
        const p = waitingPassengers[i];
        const pose = activityToPose(p.activity);
        const charContainer = drawCharacter({
          appearance: p.appearance,
          pose,
          scale: 0.6,
        });
        charContainer.x = 280 + i * 45 + (Math.random() - 0.5) * 10;
        charContainer.y = 595;
        charContainer.eventMode = 'static';
        charContainer.cursor = 'pointer';

        charContainer.on('pointerdown', (e) => {
          setTooltipData({
            data: p,
            type: 'passenger',
            position: { x: e.global.x, y: e.global.y },
          });
        });

        platformLayer.addChild(charContainer);
      }

      // ===== WORKERS =====
      const conductor = drawWorker('conductor', 0.65);
      conductor.x = 750;
      conductor.y = 595;
      conductor.eventMode = 'static';
      conductor.cursor = 'pointer';
      conductor.on('pointerdown', (e) => {
        setTooltipData({
          data: { role: 'conductor' },
          type: 'worker',
          position: { x: e.global.x, y: e.global.y },
        });
      });
      platformLayer.addChild(conductor);

      if (station.size !== 'local') {
        const porter = drawWorker('porter', 0.6);
        porter.x = 850;
        porter.y = 595;
        porter.eventMode = 'static';
        porter.cursor = 'pointer';
        porter.on('pointerdown', (e) => {
          setTooltipData({
            data: { role: 'porter' },
            type: 'worker',
            position: { x: e.global.x, y: e.global.y },
          });
        });
        platformLayer.addChild(porter);
      }

      // ===== FOREGROUND (ground, stamps, near trees) =====
      // Ground fill
      const ground = new Graphics();
      ground.rect(0, SCENE_HEIGHT - 60, SCENE_WIDTH, 60);
      ground.fill(0x2D5A3D);
      foregroundLayer.addChild(ground);

      // Near foreground trees (a few scattered along edges)
      const nearTrees = scatterTrees(
        0, 200,
        () => SCENE_HEIGHT - 60,
        'near', 1.5, terrainSeed + 200,
      );
      foregroundLayer.addChild(nearTrees);
      const nearTreesRight = scatterTrees(
        SCENE_WIDTH - 250, SCENE_WIDTH,
        () => SCENE_HEIGHT - 60,
        'near', 1.5, terrainSeed + 300,
      );
      foregroundLayer.addChild(nearTreesRight);

      // Ground stamps (grass tufts, flowers, rocks)
      const stamps = scatterGroundStamps(
        0, SCENE_WIDTH,
        SCENE_HEIGHT - 55,
        4, terrainSeed + 400,
      );
      foregroundLayer.addChild(stamps);

      // ===== TIME OVERLAY =====
      const timeOverlay = new Graphics();
      timeOverlay.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      timeOverlay.fill({ color: 0x000000, alpha: 0 });
      app.stage.addChild(timeOverlay);

      // ===== PAPER GRAIN OVERLAY =====
      const paperGrain = createSimplePaperGrain(SCENE_WIDTH, SCENE_HEIGHT, 0.04);
      app.stage.addChild(paperGrain);

      // ===== AMBIENT EFFECTS =====
      const ambient = new StationAmbient(SCENE_WIDTH);
      skyLayer.addChild(ambient.container);

      // ===== NARRATOR INTRO =====
      const introPassengers = usePassengerStore.getState().getWaitingAtStation(stationId);
      const introCargo = useCargoStore.getState().getWaitingAtStation(stationId);
      const introText = narrateStation(
        station,
        introPassengers,
        introCargo,
        station.trainsAtStation,
        useSimulationStore.getState().clock,
      );
      showNarrator(introText, 10000);

      // ===== RENDER LOOP =====
      const dayColor = hexToNumber('#87CEEB');
      const nightColor = TWILIGHT_BLUE;
      const dawnColor = hexToNumber('#FFB08C');
      const duskColor = hexToNumber('#B46440');

      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const simStore = useSimulationStore.getState();
        const hour = getHour(simStore.clock);
        const minFrac = (simStore.clock % 60) / 60;

        // Sky color
        let skyColor: number;
        if (hour >= 5 && hour < 7) {
          skyColor = lerpHexNum(nightColor, dawnColor, (hour - 5 + minFrac) / 2);
        } else if (hour >= 7 && hour < 9) {
          skyColor = lerpHexNum(dawnColor, dayColor, (hour - 7 + minFrac) / 2);
        } else if (hour >= 17 && hour < 19) {
          skyColor = lerpHexNum(dayColor, duskColor, (hour - 17 + minFrac) / 2);
        } else if (hour >= 19 && hour < 21) {
          skyColor = lerpHexNum(duskColor, nightColor, (hour - 19 + minFrac) / 2);
        } else if (hour >= 9 && hour < 17) {
          skyColor = dayColor;
        } else {
          skyColor = nightColor;
        }

        sky.clear();
        sky.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
        sky.fill(skyColor);

        // Time overlay
        timeOverlay.clear();
        timeOverlay.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
        if (hour >= 19 || hour < 5) {
          timeOverlay.fill({ color: 0x141E3C, alpha: 0.35 });
        } else if (hour >= 17 && hour < 19) {
          timeOverlay.fill({ color: 0xB4643C, alpha: 0.2 });
        } else if (hour >= 5 && hour < 7) {
          timeOverlay.fill({ color: 0xFFB48C, alpha: 0.15 });
        } else {
          timeOverlay.fill({ color: 0x000000, alpha: 0 });
        }

        // Cloud drift
        for (const child of skyLayer.children) {
          if (child !== sky && child !== ambient.container) {
            child.x += dt * 2;
            if (child.x > SCENE_WIDTH + 100) child.x = -100;
          }
        }

        // Ambient update
        ambient.update(dt);
      });

      // -- Click outside to dismiss tooltip --
      app.canvas.addEventListener('pointerdown', () => {
        setTooltipData({ data: null, type: null, position: { x: 0, y: 0 } });
      });
    };

    init();

    return () => {
      destroyed = true;
      if (narratorTimerRef.current) clearTimeout(narratorTimerRef.current);
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [stationId, station, showNarrator]);

  if (!station) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', color: '#FDF6E3', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
        Station not found
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#1A1A2E' }}>
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <TopBar />
      <DepartureBoard stationId={stationId!} />
      <Narrator text={narratorText} />
      <DetailTooltip
        data={tooltipData.data}
        type={tooltipData.type}
        position={tooltipData.position}
        onClose={() => setTooltipData({ data: null, type: null, position: { x: 0, y: 0 } })}
      />
    </div>
  );
}
