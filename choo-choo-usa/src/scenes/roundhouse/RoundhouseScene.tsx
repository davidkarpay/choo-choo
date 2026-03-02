/**
 * RoundhouseScene.tsx
 *
 * The opening scene and emotional heart of Choo-Choo USA.
 * A round brick building with 6 train berths radiating from a central turntable.
 * Time-of-day drives visuals: sleeping at night, waking at dawn, departing in morning.
 *
 * Built with PixiJS v8 for GPU-accelerated 2D rendering.
 * React wrapper mounts the PixiJS application and syncs with Zustand stores.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { useTrainStore } from '../../stores/useTrainStore';
import { TopBar } from '../../components/hud/TopBar';
import { Narrator } from '../../components/ui/Narrator';
import { TrainDetail } from '../../components/ui/TrainDetail';
import { drawTrain } from './drawTrain';
import type { TrainSprite } from './drawTrain';
import { SmokeEffect } from './SmokeEffect';
import { getSkyBrightness, getHour } from '../../utils/time';
import { easeInOutCubic, lerp, hexToNumber } from '../../utils/animation';
import { playWhistle, playChug, playGearGrind, playBell } from '../../utils/sound';
import { startSimulation, stopSimulation } from '../../engine/simulation';
import { createSimplePaperGrain } from '../../utils/backgrounds/paperGrain';
import type { Train } from '../../types/train';
import '../../styles/globals.css';
import '../../styles/storybook.css';

// -- Layout Constants --
const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;
const CENTER_X = SCENE_WIDTH / 2;
const CENTER_Y = SCENE_HEIGHT / 2 + 40;
const TURNTABLE_RADIUS = 80;
const BERTH_DISTANCE = 280;
const NUM_BERTHS = 6;

// Color constants
const WARM_BRICK = 0xC45B3E;
const CREAM = 0xFDF6E3;
const INK = 0x1A1A2E;
const RAIL_SILVER = 0x8C8C8C;
const LANTERN_ORANGE = 0xE8913A;
const COAL_DARK = 0x2E2E38;
const TWILIGHT_BLUE = 0x1B3A5C;

// Narrator text snippets
const TRAIN_TOOLTIPS: Record<string, string> = {
  'big-thunder': 'Big Thunder is the pride of the roundhouse. His whistle is so deep you can feel it in your chest.',
  'daisy-belle': 'Daisy Belle loves people. She is always on time because she knows her passengers are counting on her.',
  'iron-mike': 'Iron Mike is small but fierce. When the big trains need to climb a mountain pass, Iron Mike pushes with everything he has got.',
  'starlight-express': 'Starlight Express works while the world sleeps. She carries fresh food across the country so families can have oranges for breakfast.',
  'old-faithful': 'Old Faithful has been running the same route for fifty years. She has never missed a single run. Not once.',
  'copper-king': 'Copper King is the longest train in the fleet. He is serious and methodical, and when he blows his whistle, people listen.',
};

const TURNTABLE_TOOLTIP = 'The turntable sits in the center of the roundhouse like the hub of a great wheel. It spins to line up with each track, guiding the trains in and out of their berths.';
const KEEPER_TOOLTIP = 'The roundhouse keeper is a cheerful old fellow with a lantern and a big ring of keys. He checks on each train, tops off their water, feeds their fireboxes, and whispers, "Rest well now."';

export function RoundhouseScene() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [narratorText, setNarratorText] = useState<string | null>(null);
  const narratorTimerRef = useRef<number | null>(null);
  const handlersRef = useRef<{
    keydown: ((e: KeyboardEvent) => void) | null;
    pointermove: ((e: PointerEvent) => void) | null;
    pointerup: (() => void) | null;
  }>({ keydown: null, pointermove: null, pointerup: null });

  const selectedTrainId = useTrainStore((s) => s.selectedTrainId);
  const selectTrain = useTrainStore((s) => s.selectTrain);
  const trains = useTrainStore((s) => s.trains);
  const selectedTrain = trains.find((t) => t.id === selectedTrainId) ?? null;

  const showNarrator = useCallback((text: string, duration = 5000) => {
    setNarratorText(text);
    if (narratorTimerRef.current) clearTimeout(narratorTimerRef.current);
    narratorTimerRef.current = window.setTimeout(() => setNarratorText(null), duration);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;
    const app = new Application();

    const init = async () => {
      await app.init({
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        backgroundColor: 0x1A1A2E,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) { app.destroy(); return; }
      appRef.current = app;
      canvasRef.current!.appendChild(app.canvas);

      // Make canvas fill the container while preserving aspect ratio
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.objectFit = 'contain';

      // -- Root container for camera panning --
      const world = new Container();
      app.stage.addChild(world);

      // -- Layers (parallax) --
      const skyLayer = new Container();        // 0.2x parallax
      const buildingLayer = new Container();    // 0.5x parallax
      const mainLayer = new Container();        // 1.0x
      const foregroundLayer = new Container();  // 1.3x

      world.addChild(skyLayer);
      world.addChild(buildingLayer);
      world.addChild(mainLayer);
      world.addChild(foregroundLayer);

      // ===== SKY LAYER =====
      const sky = new Graphics();
      sky.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      sky.fill(TWILIGHT_BLUE);
      skyLayer.addChild(sky);

      // Stars (visible at night)
      const starsContainer = new Container();
      for (let i = 0; i < 60; i++) {
        const star = new Graphics();
        star.circle(0, 0, 1 + Math.random() * 1.5);
        star.fill({ color: 0xFDF6E3, alpha: 0.5 + Math.random() * 0.5 });
        star.x = Math.random() * SCENE_WIDTH;
        star.y = Math.random() * (SCENE_HEIGHT * 0.4);
        starsContainer.addChild(star);
      }
      skyLayer.addChild(starsContainer);

      // Clouds
      const cloudsContainer = new Container();
      for (let i = 0; i < 5; i++) {
        const cloud = new Graphics();
        const cx = Math.random() * SCENE_WIDTH;
        const cy = 60 + Math.random() * 120;
        // Fluffy cloud from overlapping circles
        for (let j = 0; j < 4; j++) {
          cloud.circle(cx + j * 25 - 37, cy + (Math.random() - 0.5) * 15, 20 + Math.random() * 15);
        }
        cloud.fill({ color: 0xF0EDE4, alpha: 0.3 });
        cloudsContainer.addChild(cloud);
      }
      skyLayer.addChild(cloudsContainer);

      // ===== BUILDING EXTERIOR LAYER =====
      // Curved brick walls of the roundhouse
      const walls = new Graphics();
      // Large arc representing the roundhouse exterior
      walls.ellipse(CENTER_X, CENTER_Y, BERTH_DISTANCE + 100, BERTH_DISTANCE + 60);
      walls.fill(WARM_BRICK);
      walls.stroke({ color: INK, width: 3 });
      buildingLayer.addChild(walls);

      // Mortar lines pattern
      const mortar = new Graphics();
      for (let row = 0; row < 20; row++) {
        const y = CENTER_Y - BERTH_DISTANCE - 40 + row * 20;
        mortar.moveTo(CENTER_X - BERTH_DISTANCE - 80, y);
        mortar.lineTo(CENTER_X + BERTH_DISTANCE + 80, y);
      }
      mortar.stroke({ color: 0xA04A32, width: 1, alpha: 0.3 });
      buildingLayer.addChild(mortar);

      // Arched windows along the top
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI * 0.15 + (i / 7) * Math.PI * 0.3;
        const wx = CENTER_X + Math.cos(angle) * (BERTH_DISTANCE + 70);
        const wy = CENTER_Y - 100 + Math.sin(angle) * 30;
        const win = new Graphics();
        // Window arch
        win.roundRect(wx - 15, wy - 25, 30, 40, 15);
        win.fill(0xF4C542);
        win.stroke({ color: INK, width: 2 });
        // Window frame cross
        win.moveTo(wx, wy - 25);
        win.lineTo(wx, wy + 15);
        win.moveTo(wx - 15, wy - 5);
        win.lineTo(wx + 15, wy - 5);
        win.stroke({ color: INK, width: 1.5 });
        buildingLayer.addChild(win);
      }

      // Roof dome
      const roof = new Graphics();
      roof.ellipse(CENTER_X, CENTER_Y - 30, BERTH_DISTANCE + 90, 60);
      roof.fill({ color: 0x8B4513, alpha: 0.6 });
      roof.stroke({ color: INK, width: 2 });
      buildingLayer.addChild(roof);

      // Central chimney
      const chimney = new Graphics();
      chimney.rect(CENTER_X - 20, CENTER_Y - BERTH_DISTANCE - 80, 40, 60);
      chimney.fill(WARM_BRICK);
      chimney.stroke({ color: INK, width: 2 });
      // Chimney cap
      chimney.rect(CENTER_X - 25, CENTER_Y - BERTH_DISTANCE - 85, 50, 10);
      chimney.fill(COAL_DARK);
      chimney.stroke({ color: INK, width: 2 });
      buildingLayer.addChild(chimney);

      // ===== MAIN LAYER: FLOOR, TRACKS, TURNTABLE, TRAINS =====

      // Floor
      const floor = new Graphics();
      floor.ellipse(CENTER_X, CENTER_Y, BERTH_DISTANCE + 80, BERTH_DISTANCE + 40);
      floor.fill(0x5C5040);
      floor.stroke({ color: 0x4A4035, width: 2 });
      mainLayer.addChild(floor);

      // Draw tracks radiating from center to berths
      const berthAngles: number[] = [];
      for (let i = 0; i < NUM_BERTHS; i++) {
        const angle = -Math.PI / 2 + (i / (NUM_BERTHS - 1)) * Math.PI;
        berthAngles.push(angle);

        // Track rails
        const track = new Graphics();
        const startX = CENTER_X + Math.cos(angle) * (TURNTABLE_RADIUS + 10);
        const startY = CENTER_Y + Math.sin(angle) * (TURNTABLE_RADIUS + 10);
        const endX = CENTER_X + Math.cos(angle) * BERTH_DISTANCE;
        const endY = CENTER_Y + Math.sin(angle) * BERTH_DISTANCE;

        // Two parallel rails
        const perpX = -Math.sin(angle) * 6;
        const perpY = Math.cos(angle) * 6;
        track.moveTo(startX + perpX, startY + perpY);
        track.lineTo(endX + perpX, endY + perpY);
        track.moveTo(startX - perpX, startY - perpY);
        track.lineTo(endX - perpX, endY - perpY);
        track.stroke({ color: RAIL_SILVER, width: 2.5 });

        // Crossties
        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const numTies = Math.floor(len / 20);
        for (let t = 0; t < numTies; t++) {
          const frac = t / numTies;
          const tx = startX + dx * frac;
          const ty = startY + dy * frac;
          const tie = new Graphics();
          tie.moveTo(tx + perpX * 1.8, ty + perpY * 1.8);
          tie.lineTo(tx - perpX * 1.8, ty - perpY * 1.8);
          tie.stroke({ color: 0x6B4226, width: 3 });
          mainLayer.addChild(tie);
        }

        mainLayer.addChild(track);

        // Berth name plaques
        const plaqueX = endX + Math.cos(angle) * 15;
        const plaqueY = endY + Math.sin(angle) * 15;
        const plaque = new Graphics();
        plaque.roundRect(plaqueX - 35, plaqueY - 10, 70, 20, 3);
        plaque.fill(0x6B4226);
        plaque.stroke({ color: INK, width: 1.5 });
        mainLayer.addChild(plaque);
      }

      // Main exit track (going south/down from turntable)
      const exitTrack = new Graphics();
      exitTrack.moveTo(CENTER_X - 6, CENTER_Y + TURNTABLE_RADIUS + 10);
      exitTrack.lineTo(CENTER_X - 6, SCENE_HEIGHT + 20);
      exitTrack.moveTo(CENTER_X + 6, CENTER_Y + TURNTABLE_RADIUS + 10);
      exitTrack.lineTo(CENTER_X + 6, SCENE_HEIGHT + 20);
      exitTrack.stroke({ color: RAIL_SILVER, width: 2.5 });
      // Exit track ties
      for (let y = CENTER_Y + TURNTABLE_RADIUS + 20; y < SCENE_HEIGHT + 20; y += 20) {
        exitTrack.moveTo(CENTER_X - 12, y);
        exitTrack.lineTo(CENTER_X + 12, y);
        exitTrack.stroke({ color: 0x6B4226, width: 3 });
      }
      mainLayer.addChild(exitTrack);

      // Turntable pit
      const pit = new Graphics();
      pit.circle(CENTER_X, CENTER_Y, TURNTABLE_RADIUS + 15);
      pit.fill(0x3A3530);
      pit.stroke({ color: INK, width: 2 });
      mainLayer.addChild(pit);

      // Turntable platform (rotates)
      const turntableContainer = new Container();
      turntableContainer.x = CENTER_X;
      turntableContainer.y = CENTER_Y;
      turntableContainer.eventMode = 'static';
      turntableContainer.cursor = 'pointer';

      const turntablePlatform = new Graphics();
      turntablePlatform.circle(0, 0, TURNTABLE_RADIUS);
      turntablePlatform.fill(0x5C5040);
      turntablePlatform.stroke({ color: RAIL_SILVER, width: 3 });
      // Inner track on turntable
      turntablePlatform.moveTo(-TURNTABLE_RADIUS + 5, -6);
      turntablePlatform.lineTo(TURNTABLE_RADIUS - 5, -6);
      turntablePlatform.moveTo(-TURNTABLE_RADIUS + 5, 6);
      turntablePlatform.lineTo(TURNTABLE_RADIUS - 5, 6);
      turntablePlatform.stroke({ color: RAIL_SILVER, width: 2 });
      // Center gear
      turntablePlatform.circle(0, 0, 12);
      turntablePlatform.fill(RAIL_SILVER);
      turntablePlatform.stroke({ color: INK, width: 2 });
      // Gear teeth
      for (let g = 0; g < 8; g++) {
        const ga = (g / 8) * Math.PI * 2;
        turntablePlatform.moveTo(Math.cos(ga) * 8, Math.sin(ga) * 8);
        turntablePlatform.lineTo(Math.cos(ga) * 15, Math.sin(ga) * 15);
        turntablePlatform.stroke({ color: RAIL_SILVER, width: 2 });
      }
      turntableContainer.addChild(turntablePlatform);
      mainLayer.addChild(turntableContainer);

      turntableContainer.on('pointerdown', () => {
        showNarrator(TURNTABLE_TOOLTIP);
      });

      // ===== TRAIN SPRITES =====
      const trainContainers: Map<string, Container> = new Map();
      const trainSprites: Map<string, TrainSprite> = new Map();
      const smokeEffects: Map<string, SmokeEffect> = new Map();
      const trainStore = useTrainStore.getState();

      for (const train of trainStore.trains) {
        const angle = berthAngles[train.berthIndex];
        const berthX = CENTER_X + Math.cos(angle) * (BERTH_DISTANCE - 60);
        const berthY = CENTER_Y + Math.sin(angle) * (BERTH_DISTANCE - 60);

        const sprite = drawTrain(train.name, train.color, train.type, 0.65, train.id);
        const trainContainer = sprite.container;
        trainContainer.x = berthX;
        trainContainer.y = berthY;
        trainContainer.rotation = angle + Math.PI; // Face toward center
        trainContainer.eventMode = 'static';
        trainContainer.cursor = 'pointer';

        trainContainer.on('pointerdown', () => {
          const store = useTrainStore.getState();
          store.selectTrain(train.id);
          showNarrator(TRAIN_TOOLTIPS[train.id] ?? train.personality);
        });

        mainLayer.addChild(trainContainer);
        trainContainers.set(train.id, trainContainer);
        trainSprites.set(train.id, sprite);

        // Smoke emitter per train — use smokeOrigin from the sprite
        const smoke = new SmokeEffect();
        smoke.container.x = 0;
        smoke.container.y = 0;
        // Transform smoke origin from local train coords to scene coords
        const cosA = Math.cos(angle + Math.PI);
        const sinA = Math.sin(angle + Math.PI);
        smoke.emitX = berthX + cosA * sprite.smokeOrigin.x - sinA * sprite.smokeOrigin.y;
        smoke.emitY = berthY + sinA * sprite.smokeOrigin.x + cosA * sprite.smokeOrigin.y;
        mainLayer.addChild(smoke.container);
        smokeEffects.set(train.id, smoke);

        // Berth lanterns (glow when occupied)
        const lanternX = berthX + Math.cos(angle) * 40 + Math.sin(angle) * 25;
        const lanternY = berthY + Math.sin(angle) * 40 - Math.cos(angle) * 25;
        const lantern = new Graphics();
        lantern.circle(lanternX, lanternY, 5);
        lantern.fill(LANTERN_ORANGE);
        lantern.circle(lanternX, lanternY, 12);
        lantern.fill({ color: LANTERN_ORANGE, alpha: 0.15 });
        mainLayer.addChild(lantern);
      }

      // ===== ROUNDHOUSE KEEPER =====
      const keeper = new Container();
      keeper.x = CENTER_X + 100;
      keeper.y = CENTER_Y + 50;
      keeper.eventMode = 'static';
      keeper.cursor = 'pointer';

      // Simple stick-figure keeper
      const keeperG = new Graphics();
      // Head
      keeperG.circle(0, -45, 8);
      keeperG.fill(0xE8B87A);
      keeperG.stroke({ color: INK, width: 1.5 });
      // Hat (conductor style)
      keeperG.roundRect(-10, -57, 20, 8, 2);
      keeperG.fill(INK);
      keeperG.rect(-7, -52, 14, 3);
      keeperG.fill(INK);
      // Body
      keeperG.roundRect(-8, -35, 16, 28, 3);
      keeperG.fill(0x4A6FA5);
      keeperG.stroke({ color: INK, width: 1.5 });
      // Legs
      keeperG.moveTo(-4, -7);
      keeperG.lineTo(-6, 10);
      keeperG.moveTo(4, -7);
      keeperG.lineTo(6, 10);
      keeperG.stroke({ color: INK, width: 2.5 });
      // Lantern in hand
      keeperG.circle(14, -20, 4);
      keeperG.fill(LANTERN_ORANGE);
      keeperG.circle(14, -20, 8);
      keeperG.fill({ color: LANTERN_ORANGE, alpha: 0.2 });
      // Arm holding lantern
      keeperG.moveTo(8, -30);
      keeperG.lineTo(14, -20);
      keeperG.stroke({ color: INK, width: 2 });

      keeper.addChild(keeperG);
      mainLayer.addChild(keeper);

      keeper.on('pointerdown', () => {
        showNarrator(KEEPER_TOOLTIP);
      });

      // ===== FOREGROUND LAYER =====
      // Tools, oil cans, broom
      const drawTool = (x: number, y: number, type: 'broom' | 'oilcan' | 'wrench') => {
        const tool = new Graphics();
        tool.eventMode = 'static';
        tool.cursor = 'pointer';

        if (type === 'broom') {
          tool.moveTo(x, y);
          tool.lineTo(x, y - 50);
          tool.stroke({ color: 0x6B4226, width: 3 });
          // Bristles
          for (let b = -8; b <= 8; b += 3) {
            tool.moveTo(x + b, y);
            tool.lineTo(x + b, y + 12);
          }
          tool.stroke({ color: 0x8B7355, width: 1.5 });
          tool.on('pointerdown', () => showNarrator('A well-worn broom leans against the wall. The roundhouse keeper sweeps the floor every evening, clearing away coal dust and cinders.'));
        } else if (type === 'oilcan') {
          tool.roundRect(x - 8, y - 18, 16, 18, 3);
          tool.fill(RAIL_SILVER);
          tool.stroke({ color: INK, width: 1.5 });
          // Spout
          tool.moveTo(x + 8, y - 15);
          tool.lineTo(x + 18, y - 22);
          tool.stroke({ color: RAIL_SILVER, width: 2.5 });
          tool.on('pointerdown', () => showNarrator('An oil can, always within reach. Every joint, every bearing, every sliding part needs a drop of oil to keep running smooth.'));
        } else {
          tool.moveTo(x - 12, y - 5);
          tool.lineTo(x + 12, y + 5);
          tool.stroke({ color: RAIL_SILVER, width: 4 });
          tool.roundRect(x + 8, y, 12, 8, 2);
          tool.stroke({ color: RAIL_SILVER, width: 2 });
          tool.on('pointerdown', () => showNarrator('A heavy iron wrench, sized for the great bolts that hold a locomotive together. It takes two hands and a strong back to turn it.'));
        }

        foregroundLayer.addChild(tool);
      };

      drawTool(150, SCENE_HEIGHT - 80, 'broom');
      drawTool(250, SCENE_HEIGHT - 100, 'oilcan');
      drawTool(SCENE_WIDTH - 200, SCENE_HEIGHT - 90, 'wrench');

      // Hanging lanterns
      for (let i = 0; i < 6; i++) {
        const lx = 200 + i * (SCENE_WIDTH - 400) / 5;
        const ly = 50 + Math.sin(i * 1.2) * 15;
        const lantern = new Graphics();
        // Chain
        lantern.moveTo(lx, 0);
        lantern.lineTo(lx, ly);
        lantern.stroke({ color: RAIL_SILVER, width: 1 });
        // Lamp body
        lantern.roundRect(lx - 6, ly, 12, 16, 2);
        lantern.fill(0x6B4226);
        lantern.stroke({ color: INK, width: 1 });
        // Glow
        lantern.circle(lx, ly + 8, 10);
        lantern.fill({ color: LANTERN_ORANGE, alpha: 0.15 });
        foregroundLayer.addChild(lantern);
      }

      // ===== TIME-OF-DAY OVERLAY =====
      const timeOverlay = new Graphics();
      timeOverlay.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      timeOverlay.fill({ color: 0x000000, alpha: 0 });
      app.stage.addChild(timeOverlay);

      // ===== PAPER GRAIN OVERLAY =====
      const paperGrain = createSimplePaperGrain(SCENE_WIDTH, SCENE_HEIGHT, 0.035);
      app.stage.addChild(paperGrain);

      // ===== DEPARTURE ANIMATION STATE =====
      let departureSequenceActive = false;
      let departurePhase = -1;
      let departureTimer = 0;
      let departingTrainIndex = -1;
      let turntableTargetAngle = 0;
      let turntableCurrentAngle = 0;
      let departedTrains = new Set<string>();

      // Return animation state
      let returnSequenceActive = false;
      let returnPhase = -1;
      let returnTimer = 0;
      let returningTrainIndex = -1;
      let returnedTrains = new Set<string>();

      // Previous hour for detecting transitions
      let prevHour = -1;

      // Chug rhythm timer
      let chugTimer = 0;

      // ===== MAIN RENDER LOOP =====
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const simStore = useSimulationStore.getState();
        const tStore = useTrainStore.getState();
        const hour = getHour(simStore.clock);
        const brightness = getSkyBrightness(simStore.clock);

        // -- Update sky color based on time of day --
        sky.clear();
        sky.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
        const dayColor = hexToNumber('#87CEEB');
        const nightColor = TWILIGHT_BLUE;
        const dawnColor = hexToNumber('#FFB08C');
        const duskColor = hexToNumber('#B46440');

        let skyColor: number;
        if (hour >= 5 && hour < 7) {
          // Dawn: blend from night to dawn colors
          const t = (hour - 5 + getMinFrac(simStore.clock)) / 2;
          skyColor = lerpHexNum(nightColor, dawnColor, t);
        } else if (hour >= 7 && hour < 9) {
          // Morning: dawn to day
          const t = (hour - 7 + getMinFrac(simStore.clock)) / 2;
          skyColor = lerpHexNum(dawnColor, dayColor, t);
        } else if (hour >= 17 && hour < 19) {
          // Dusk
          const t = (hour - 17 + getMinFrac(simStore.clock)) / 2;
          skyColor = lerpHexNum(dayColor, duskColor, t);
        } else if (hour >= 19 && hour < 21) {
          // Night falling
          const t = (hour - 19 + getMinFrac(simStore.clock)) / 2;
          skyColor = lerpHexNum(duskColor, nightColor, t);
        } else if (hour >= 9 && hour < 17) {
          skyColor = dayColor;
        } else {
          skyColor = nightColor;
        }
        sky.fill(skyColor);

        // Stars visibility
        starsContainer.alpha = 1 - brightness;
        // Clouds visibility (more visible during day)
        cloudsContainer.alpha = brightness * 0.5;
        // Cloud drift
        for (const cloud of cloudsContainer.children) {
          cloud.x += dt * 3;
          if (cloud.x > SCENE_WIDTH + 100) cloud.x = -100;
        }

        // Time overlay (atmospheric tint)
        timeOverlay.clear();
        timeOverlay.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
        if (hour >= 19 || hour < 5) {
          timeOverlay.fill({ color: 0x141E3C, alpha: 0.35 });
        } else if (hour >= 17 && hour < 19) {
          timeOverlay.fill({ color: 0xB4643C, alpha: 0.2 });
        } else if (hour >= 5 && hour < 7) {
          timeOverlay.fill({ color: 0xFFB48C, alpha: 0.15 });
        } else if (hour >= 11 && hour < 14) {
          timeOverlay.fill({ color: 0xFFFFC8, alpha: 0.08 });
        } else if (hour >= 14 && hour < 17) {
          timeOverlay.fill({ color: 0xFFC864, alpha: 0.12 });
        } else {
          timeOverlay.fill({ color: 0x000000, alpha: 0 });
        }

        // -- Update smoke based on train status --
        for (const train of tStore.trains) {
          const smoke = smokeEffects.get(train.id);
          if (!smoke) continue;

          if (train.status === 'sleeping') {
            smoke.active = false;
            smoke.intensity = 0;
          } else if (train.status === 'warming_up') {
            smoke.active = true;
            smoke.intensity = 0.3;
            smoke.emissionRate = 2;
          } else if (train.status === 'departing') {
            smoke.active = true;
            smoke.intensity = 0.8;
            smoke.emissionRate = 5;
          } else {
            smoke.active = false;
          }
          smoke.update(dt);
        }

        // -- Firebox glow effect on warming/departing trains --
        for (const train of tStore.trains) {
          const container = trainContainers.get(train.id);
          if (!container) continue;

          if (train.status === 'warming_up' || train.status === 'departing') {
            container.visible = true;
            container.alpha = 1;
          } else if (train.status === 'sleeping') {
            // Recover from any missed return animation — reset to berth position
            container.visible = true;
            const berthAngle = berthAngles[train.berthIndex];
            container.x = CENTER_X + Math.cos(berthAngle) * (BERTH_DISTANCE - 60);
            container.y = CENTER_Y + Math.sin(berthAngle) * (BERTH_DISTANCE - 60);
            container.rotation = berthAngle + Math.PI;
            // Gentle breathing pulse at night
            container.alpha = 0.7 + Math.sin(simStore.clock * 0.5) * 0.05;
          } else if (train.status === 'en_route' || train.status === 'returning') {
            // Trains that are out on the rails should not be visible in the roundhouse
            // unless a return animation is actively running for them
            if (!returnSequenceActive || returnedTrains.has(train.id)) {
              // Not animating — hide if en_route, show if returned
              if (train.status === 'en_route') {
                container.visible = false;
              }
            }
            // If returnSequenceActive and not yet returned, the return animation
            // loop below handles positioning and visibility
          }
        }

        // -- Morning departure sequence --
        const departureTriggered = (prevHour < 7 && hour >= 7 && hour < 9) ||
          (prevHour > hour && hour >= 0 && hour < 9 && 7 >= 0); // day rollover
        if (departureTriggered && !departureSequenceActive) {
          departureSequenceActive = true;
          departurePhase = 0;
          departureTimer = 0;
          departingTrainIndex = 0;
          departedTrains.clear();

          // Play whistles staggered
          setTimeout(() => playWhistle('deep', 2), 500);
          setTimeout(() => playWhistle('high', 1.5), 1500);
          setTimeout(() => playWhistle('horn', 1), 2500);
          setTimeout(() => playWhistle('mellow', 1.5), 3500);
          setTimeout(() => playWhistle('scratchy', 1.5), 4500);
          setTimeout(() => playWhistle('sharp', 1), 5500);
        }

        if (departureSequenceActive) {
          departureTimer += dt;

          if (departingTrainIndex < tStore.trains.length) {
            const departureTrain = tStore.trains[departingTrainIndex];
            const container = trainContainers.get(departureTrain.id);
            const smoke = smokeEffects.get(departureTrain.id);

            if (container && !departedTrains.has(departureTrain.id)) {
              // Each train gets ~3 seconds to depart
              const trainDepartTime = departingTrainIndex * 3;

              if (departureTimer >= trainDepartTime) {
                const localT = Math.min((departureTimer - trainDepartTime) / 2.5, 1);
                const eased = easeInOutCubic(localT);

                // Rotate turntable toward exit
                const berthAngle = berthAngles[departureTrain.berthIndex];
                turntableTargetAngle = Math.PI / 2; // point toward exit

                // Interpolate turntable
                turntableCurrentAngle = lerp(berthAngle, turntableTargetAngle, eased);
                turntableContainer.rotation = turntableCurrentAngle;

                // Move train toward center then down to exit
                const startX = CENTER_X + Math.cos(berthAngle) * (BERTH_DISTANCE - 60);
                const startY = CENTER_Y + Math.sin(berthAngle) * (BERTH_DISTANCE - 60);
                const midX = CENTER_X;
                const midY = CENTER_Y;
                const exitX = CENTER_X;
                const exitY = SCENE_HEIGHT + 50;

                if (localT < 0.4) {
                  // Move to turntable center
                  const subT = localT / 0.4;
                  container.x = lerp(startX, midX, easeInOutCubic(subT));
                  container.y = lerp(startY, midY, easeInOutCubic(subT));
                  container.rotation = lerp(berthAngle + Math.PI, Math.PI / 2, easeInOutCubic(subT));
                } else {
                  // Move from center to exit
                  const subT = (localT - 0.4) / 0.6;
                  container.x = lerp(midX, exitX, easeInOutCubic(subT));
                  container.y = lerp(midY, exitY, easeInOutCubic(subT));
                  container.rotation = Math.PI / 2;

                  // Accelerating chug sounds
                  chugTimer += dt;
                  const chugInterval = lerp(0.4, 0.1, subT);
                  if (chugTimer >= chugInterval) {
                    playChug(0.8 + subT * 0.5);
                    chugTimer = 0;
                  }

                  // Update smoke position to follow train
                  if (smoke) {
                    smoke.emitX = container.x;
                    smoke.emitY = container.y - 40;
                    smoke.active = true;
                    smoke.intensity = 0.5 + subT * 0.5;
                    smoke.emissionRate = 3 + subT * 4;
                  }
                }

                if (localT >= 1) {
                  container.visible = false;
                  departedTrains.add(departureTrain.id);
                  if (smoke) {
                    smoke.active = false;
                    smoke.clear();
                  }
                  departingTrainIndex++;
                  chugTimer = 0;

                  if (departingTrainIndex < tStore.trains.length) {
                    playGearGrind(0.8);
                  }
                }
              }
            }
          } else {
            departureSequenceActive = false;
            // Clear all lingering smoke after departure sequence ends
            for (const smoke of smokeEffects.values()) {
              smoke.active = false;
              smoke.clear();
            }
          }
        }

        // -- Evening return sequence --
        const returnTriggered = (prevHour < 18 && hour >= 18 && hour < 20) ||
          (prevHour > hour && hour >= 18 && hour < 20); // day rollover (unlikely but safe)
        if (returnTriggered && !returnSequenceActive) {
          returnSequenceActive = true;
          returnPhase = 0;
          returnTimer = 0;
          returningTrainIndex = 0;
          returnedTrains.clear();
          playBell();
        }

        if (returnSequenceActive) {
          returnTimer += dt;

          if (returningTrainIndex < tStore.trains.length) {
            const returningTrain = tStore.trains[returningTrainIndex];
            const container = trainContainers.get(returningTrain.id);
            const smoke = smokeEffects.get(returningTrain.id);

            if (container && !returnedTrains.has(returningTrain.id)) {
              container.visible = true;

              const trainReturnTime = returningTrainIndex * 3;

              if (returnTimer >= trainReturnTime) {
                const localT = Math.min((returnTimer - trainReturnTime) / 3, 1);
                const eased = easeInOutCubic(localT);

                const berthAngle = berthAngles[returningTrain.berthIndex];
                const berthX = CENTER_X + Math.cos(berthAngle) * (BERTH_DISTANCE - 60);
                const berthY = CENTER_Y + Math.sin(berthAngle) * (BERTH_DISTANCE - 60);
                const enterX = CENTER_X;
                const enterY = SCENE_HEIGHT + 50;

                if (localT < 0.5) {
                  // Enter from bottom to center
                  const subT = localT / 0.5;
                  container.x = lerp(enterX, CENTER_X, easeInOutCubic(subT));
                  container.y = lerp(enterY, CENTER_Y, easeInOutCubic(subT));
                  container.rotation = -Math.PI / 2;

                  if (smoke) {
                    smoke.emitX = container.x;
                    smoke.emitY = container.y - 40;
                    smoke.active = true;
                    smoke.intensity = 0.3;
                    smoke.emissionRate = 2;
                  }
                } else {
                  // Move from center to berth
                  const subT = (localT - 0.5) / 0.5;
                  container.x = lerp(CENTER_X, berthX, easeInOutCubic(subT));
                  container.y = lerp(CENTER_Y, berthY, easeInOutCubic(subT));
                  container.rotation = lerp(-Math.PI / 2, berthAngle + Math.PI, easeInOutCubic(subT));

                  turntableCurrentAngle = lerp(Math.PI / 2, berthAngle, easeInOutCubic(subT));
                  turntableContainer.rotation = turntableCurrentAngle;
                }

                if (localT >= 1) {
                  returnedTrains.add(returningTrain.id);
                  if (smoke) {
                    smoke.active = false;
                  }
                  returningTrainIndex++;

                  if (returningTrainIndex < tStore.trains.length) {
                    playGearGrind(0.6);
                  }
                }
              }
            }
          } else {
            returnSequenceActive = false;
            departedTrains.clear();
            // Clear all lingering smoke after return sequence ends
            for (const smoke of smokeEffects.values()) {
              smoke.active = false;
              smoke.clear();
            }
          }
        }

        // -- At high sim speeds, reduce smoke to prevent visual clutter --
        if (simStore.speed >= 15) {
          for (const smoke of smokeEffects.values()) {
            if (smoke.active) {
              smoke.intensity = Math.min(smoke.intensity, 0.2);
              smoke.emissionRate = Math.min(smoke.emissionRate, 1);
            }
          }
        }

        // -- Keeper gentle animation (breathing) --
        keeper.y = CENTER_Y + 50 + Math.sin(simStore.clock * 0.3) * 2;

        prevHour = hour;
      });

      // -- Camera panning with arrow keys --
      let cameraX = 0;
      const MAX_PAN = (SCENE_WIDTH - window.innerWidth) / 2;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          cameraX = Math.max(cameraX - 30, -MAX_PAN);
        } else if (e.key === 'ArrowRight') {
          cameraX = Math.min(cameraX + 30, MAX_PAN);
        } else if (e.key === 'Escape') {
          useTrainStore.getState().selectTrain(null);
          setNarratorText(null);
        }
        world.x = -cameraX;
      };
      window.addEventListener('keydown', handleKeyDown);

      // Mouse drag panning with dead zone (Bug 6)
      let pointerIsDown = false;
      let isDragging = false;
      let dragStartX = 0;
      let dragCameraStart = 0;
      const DRAG_THRESHOLD = 8;

      const handlePointerDown = (e: PointerEvent) => {
        pointerIsDown = true;
        isDragging = false;
        dragStartX = e.clientX;
        dragCameraStart = cameraX;
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!pointerIsDown) return;
        const dx = e.clientX - dragStartX;
        if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
          isDragging = true;
        }
        if (isDragging) {
          cameraX = Math.max(-MAX_PAN, Math.min(MAX_PAN, dragCameraStart - dx));
          world.x = -cameraX;
        }
      };

      const handlePointerUp = () => {
        pointerIsDown = false;
        isDragging = false;
      };

      app.canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      // Store handlers in ref so cleanup can access them
      handlersRef.current = {
        keydown: handleKeyDown,
        pointermove: handlePointerMove,
        pointerup: handlePointerUp,
      };

      // Start simulation
      startSimulation();
    };

    init();

    return () => {
      destroyed = true;
      stopSimulation();
      // Remove all window event listeners
      const h = handlersRef.current;
      if (h.keydown) window.removeEventListener('keydown', h.keydown as EventListener);
      if (h.pointermove) window.removeEventListener('pointermove', h.pointermove as EventListener);
      if (h.pointerup) window.removeEventListener('pointerup', h.pointerup as EventListener);
      handlersRef.current = { keydown: null, pointermove: null, pointerup: null };
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [showNarrator]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#1A1A2E' }}>
      <div
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
      <TopBar />
      <TrainDetail train={selectedTrain} onClose={() => selectTrain(null)} />
      <Narrator text={narratorText} />
    </div>
  );
}

// -- Helper functions --

function getMinFrac(clock: number): number {
  return (clock % 60) / 60;
}

function lerpHexNum(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xFF;
  const ag = (a >> 8) & 0xFF;
  const ab = a & 0xFF;
  const br = (b >> 16) & 0xFF;
  const bg = (b >> 8) & 0xFF;
  const bb = b & 0xFF;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
