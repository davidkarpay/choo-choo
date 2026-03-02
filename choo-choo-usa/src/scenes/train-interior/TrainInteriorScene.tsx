/**
 * TrainInteriorScene.tsx
 *
 * Horizontally-scrollable cutaway view of an entire train. Composes car
 * interior renderers from M2 into a wide scrollable canvas. Supports
 * drag, scroll wheel, and arrow key navigation. Off-screen cars are
 * culled for performance.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: specs/PHASE_4_INTERIORS.md for design reference
 *
 * Dependencies:
 *   - pixi.js: Application, Container, Graphics, TilingSprite, RenderTexture
 *   - drawCarInterior: all car type renderers
 *   - TrainAmbient: ambient effects
 *   - Zustand stores: train, passenger, cargo, simulation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Application, Container, Graphics, RenderTexture, TilingSprite } from 'pixi.js';
import { useTrainStore } from '../../stores/useTrainStore';
import { usePassengerStore } from '../../stores/usePassengerStore';
import { useCargoStore } from '../../stores/useCargoStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { useStationStore } from '../../stores/useStationStore';
import {
  drawLocomotiveCab,
  drawPassengerCoach,
  drawDiningCar,
  drawSleeperCar,
  drawBoxcar,
  drawTankerExterior,
  drawFlatcar,
  drawCaboose,
  cargoToVisualType,
  CAR_WIDTH,
  CAR_HEIGHT,
  COUPLING_WIDTH,
  type InteractiveElement,
} from '../../utils/drawCarInterior';
import { carsRequired } from '../../engine/cargoCapacity';
import { TrainAmbient } from './TrainAmbient';
import { narrateTrainInterior } from '../../engine/narratorMessages';
import { startWindLoop, startMurmurLoop } from '../../utils/sound';
import { TopBar } from '../../components/hud/TopBar';
import { Narrator } from '../../components/ui/Narrator';
import { DetailTooltip } from '../../components/ui/DetailTooltip';
import { clamp } from '../../utils/animation';
import type { Passenger } from '../../types/passenger';
import type { CargoShipment } from '../../types/cargo';
import '../../styles/globals.css';
import '../../styles/storybook.css';

const SCENE_HEIGHT = 900;
const VIEW_WIDTH = 1600;
const CAR_Y_OFFSET = (SCENE_HEIGHT - CAR_HEIGHT) / 2;

export function TrainInteriorScene() {
  const { id: trainId } = useParams<{ id: string }>();
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

  const train = useTrainStore((s) => s.getTrainById(trainId ?? ''));

  const showNarrator = useCallback((text: string, duration = 10000) => {
    setNarratorText(text);
    if (narratorTimerRef.current) clearTimeout(narratorTimerRef.current);
    narratorTimerRef.current = window.setTimeout(() => setNarratorText(null), duration);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !trainId || !train) return;

    let destroyed = false;
    const app = new Application();

    // Sound loops to clean up
    let windStop: (() => void) | null = null;
    let murmurStop: (() => void) | null = null;

    const init = async () => {
      await app.init({
        width: VIEW_WIDTH,
        height: SCENE_HEIGHT,
        backgroundColor: 0x87CEEB,
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

      // -- Build car list --
      const passengers = usePassengerStore.getState().getOnTrain(trainId);
      const cargo = useCargoStore.getState().getOnTrain(trainId);
      const isPassengerTrain = train.category === 'passenger' || train.cargoCapability.includes('passengers');
      const clock = useSimulationStore.getState().clock;
      const isNight = (clock % 1440) >= 1140 || (clock % 1440) < 360;

      // Assemble car rendering list
      interface CarEntry {
        type: string;
        render: () => { container: Container; interactiveElements: InteractiveElement[] };
      }

      const carList: CarEntry[] = [];

      // 1. Locomotive (always first)
      carList.push({
        type: 'locomotive',
        render: () => {
          const result = drawLocomotiveCab(train.color, train.type);
          return { container: result.container, interactiveElements: result.interactiveElements };
        },
      });

      // 2. Passenger coaches
      if (isPassengerTrain && passengers.length > 0) {
        const passengersPerCar = 5;
        const numCoaches = Math.ceil(passengers.length / passengersPerCar);
        for (let ci = 0; ci < numCoaches; ci++) {
          const chunk = passengers.slice(ci * passengersPerCar, (ci + 1) * passengersPerCar);
          carList.push({
            type: 'passenger',
            render: () => {
              const result = drawPassengerCoach(chunk);
              return { container: result.container, interactiveElements: result.interactiveElements };
            },
          });

          // Dining car after first coach
          if (ci === 0 && numCoaches > 1) {
            const diners = passengers.slice(0, 3);
            carList.push({
              type: 'dining',
              render: () => {
                const result = drawDiningCar(diners);
                return { container: result.container, interactiveElements: result.interactiveElements };
              },
            });
          }
        }

        // Sleeper car if night
        if (isNight && passengers.length > 2) {
          const sleepers = passengers.slice(0, 4);
          carList.push({
            type: 'sleeper',
            render: () => {
              const result = drawSleeperCar(sleepers);
              return { container: result.container, interactiveElements: result.interactiveElements };
            },
          });
        }
      }

      // 3. Cargo cars
      // Group cargo by visual type
      const cargoByType = new Map<string, CargoShipment[]>();
      for (const c of cargo) {
        const vt = cargoToVisualType(c.type);
        const arr = cargoByType.get(vt) ?? [];
        arr.push(c);
        cargoByType.set(vt, arr);
      }

      for (const [vt, shipments] of cargoByType) {
        // Cap at 3 visual cars per type
        const numCars = Math.min(3, shipments.reduce((sum, s) => sum + carsRequired(s.type, s.quantity), 0));
        for (let ci = 0; ci < numCars; ci++) {
          const cargoChunk = shipments.slice(ci * 2, (ci + 1) * 2);
          if (cargoChunk.length === 0) continue;

          carList.push({
            type: vt,
            render: () => {
              switch (vt) {
                case 'tanker': {
                  const result = drawTankerExterior(cargoChunk[0]);
                  return { container: result.container, interactiveElements: result.interactiveElements };
                }
                case 'flatcar': {
                  const result = drawFlatcar(cargoChunk);
                  return { container: result.container, interactiveElements: result.interactiveElements };
                }
                default: {
                  const result = drawBoxcar(cargoChunk);
                  return { container: result.container, interactiveElements: result.interactiveElements };
                }
              }
            },
          });
        }
      }

      // 4. Caboose (always last)
      carList.push({
        type: 'caboose',
        render: () => {
          const result = drawCaboose(train.name);
          return { container: result.container, interactiveElements: result.interactiveElements };
        },
      });

      // -- Scrollable world --
      const totalWidth = carList.length * (CAR_WIDTH + COUPLING_WIDTH);
      const world = new Container();
      app.stage.addChild(world);

      // -- Parallax landscape behind windows --
      const landscapeTexture = generateLandscapeTexture(app, VIEW_WIDTH, CAR_HEIGHT);
      const landscapeBg = new TilingSprite({
        texture: landscapeTexture,
        width: VIEW_WIDTH,
        height: CAR_HEIGHT,
      });
      landscapeBg.y = CAR_Y_OFFSET;
      world.addChild(landscapeBg);

      // -- Render all cars --
      const carContainers: Container[] = [];
      const allInteractives: InteractiveElement[] = [];

      for (let i = 0; i < carList.length; i++) {
        const entry = carList[i];
        const { container: carContainer, interactiveElements } = entry.render();
        const x = i * (CAR_WIDTH + COUPLING_WIDTH);
        carContainer.x = x;
        carContainer.y = CAR_Y_OFFSET;

        // Wire up interactive elements
        for (const ie of interactiveElements) {
          ie.container.on('pointerdown', (e) => {
            setTooltipData({
              data: ie.data,
              type: ie.type,
              position: { x: e.global.x, y: e.global.y },
            });
          });
        }
        allInteractives.push(...interactiveElements);

        world.addChild(carContainer);
        carContainers.push(carContainer);
      }

      // -- Ambient effects --
      const ambient = new TrainAmbient();
      ambient.setCarContainers(carContainers);
      ambient.setSpeed(train.speedMph);

      // Sound loops
      if (train.status === 'en_route') {
        windStop = startWindLoop().stop;
        if (isPassengerTrain && passengers.length > 3) {
          murmurStop = startMurmurLoop().stop;
        }
      }

      // -- Narrator intro --
      const stationLookup = (id: string) => {
        const st = useStationStore.getState().getStationById(id);
        return st ? st.name : id;
      };
      const introText = narrateTrainInterior(train, passengers, cargo, stationLookup);
      showNarrator(introText, 12000);

      // -- Scroll state --
      let scrollX = 0;
      const maxScroll = Math.max(0, totalWidth - VIEW_WIDTH);

      function updateScroll(): void {
        world.x = -scrollX;

        // Cull off-screen cars for performance
        for (let i = 0; i < carContainers.length; i++) {
          const carX = i * (CAR_WIDTH + COUPLING_WIDTH);
          const inView = carX + CAR_WIDTH > scrollX - 100 && carX < scrollX + VIEW_WIDTH + 100;
          carContainers[i].visible = inView;
        }
      }

      // Arrow key scrolling
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          scrollX = clamp(scrollX - 80, 0, maxScroll);
          updateScroll();
        } else if (e.key === 'ArrowRight') {
          scrollX = clamp(scrollX + 80, 0, maxScroll);
          updateScroll();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Scroll wheel
      const handleWheel = (e: WheelEvent) => {
        scrollX = clamp(scrollX + e.deltaX + e.deltaY, 0, maxScroll);
        updateScroll();
        e.preventDefault();
      };
      app.canvas.addEventListener('wheel', handleWheel, { passive: false });

      // Drag scrolling
      let pointerDown = false;
      let isDragging = false;
      let dragStartX = 0;
      let dragScrollStart = 0;
      const DRAG_THRESHOLD = 8;

      const handlePointerDown = (e: PointerEvent) => {
        pointerDown = true;
        isDragging = false;
        dragStartX = e.clientX;
        dragScrollStart = scrollX;
      };
      const handlePointerMove = (e: PointerEvent) => {
        if (!pointerDown) return;
        const dx = e.clientX - dragStartX;
        if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) isDragging = true;
        if (isDragging) {
          scrollX = clamp(dragScrollStart - dx, 0, maxScroll);
          updateScroll();
        }
      };
      const handlePointerUp = () => {
        pointerDown = false;
        isDragging = false;
      };

      app.canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      // -- Click to dismiss tooltip --
      app.canvas.addEventListener('pointerdown', () => {
        if (!isDragging) {
          setTooltipData({ data: null, type: null, position: { x: 0, y: 0 } });
        }
      });

      // -- Render loop --
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const simClock = useSimulationStore.getState().clock;

        // Ambient
        ambient.update(dt, simClock);

        // Parallax landscape scrolls with train speed
        if (train.speedMph > 0) {
          landscapeBg.tilePosition.x -= dt * train.speedMph * 0.5;
        }
      });

      updateScroll();

      // Store cleanup refs
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        ambient.destroy();
      };
    };

    let cleanup: (() => void) | undefined;
    init().then((c) => { cleanup = c; });

    return () => {
      destroyed = true;
      if (narratorTimerRef.current) clearTimeout(narratorTimerRef.current);
      if (windStop) windStop();
      if (murmurStop) murmurStop();
      cleanup?.();
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [trainId, train, showNarrator]);

  if (!train) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', color: '#FDF6E3', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
        Train not found
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#1A1A2E' }}>
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <TopBar />
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

/**
 * Generate a simple programmatic landscape RenderTexture for the parallax
 * window scenery. Green hills, blue sky, simple trees.
 */
function generateLandscapeTexture(app: Application, width: number, height: number): RenderTexture {
  const container = new Container();
  const g = new Graphics();

  // Sky
  g.rect(0, 0, width, height);
  g.fill(0x87CEEB);

  // Hills (background)
  g.moveTo(0, height * 0.6);
  for (let x = 0; x <= width; x += 20) {
    g.lineTo(x, height * 0.5 + Math.sin(x * 0.008) * 30 + Math.sin(x * 0.02) * 15);
  }
  g.lineTo(width, height);
  g.lineTo(0, height);
  g.closePath();
  g.fill(0x3A7A4F);

  // Foreground ground
  g.rect(0, height * 0.75, width, height * 0.25);
  g.fill(0x2D5A3D);

  // Simple trees
  for (let tx = 30; tx < width; tx += 60 + Math.random() * 40) {
    // Trunk
    g.rect(tx - 2, height * 0.55, 4, 20);
    g.fill(0x6B4226);
    // Canopy
    g.circle(tx, height * 0.5, 12);
    g.fill(0x2D5A3D);
  }

  // Fence posts along bottom
  for (let fx = 0; fx < width; fx += 30) {
    g.rect(fx, height * 0.7, 3, 15);
    g.fill(0x6B4226);
  }
  // Fence rail
  g.rect(0, height * 0.72, width, 2);
  g.fill(0x6B4226);

  container.addChild(g);

  const texture = RenderTexture.create({ width, height });
  app.renderer.render({ container, target: texture });
  container.destroy({ children: true });

  return texture;
}
