/**
 * App.tsx
 *
 * Root component with React Router scene switching. Scenes transition
 * like turning storybook pages. On mount, checks for saved game state
 * and offers continue/new game dialog.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for scene navigation hierarchy
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RoundhouseScene } from './scenes/roundhouse/RoundhouseScene';
import { NationalMapScene } from './scenes/national-map/NationalMapScene';
import { StationScene } from './scenes/station/StationScene';
import { TrainInteriorScene } from './scenes/train-interior/TrainInteriorScene';
import { SceneTransition } from './components/transitions/SceneTransition';
import { SaveLoadDialog } from './components/ui/SaveLoadDialog';
import { hasSavedGame, loadGameState, clearGameState, startAutoSave } from './engine/persistence';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <SceneTransition>
      <Routes location={location}>
        <Route path="/" element={<RoundhouseScene />} />
        <Route path="/map" element={<NationalMapScene />} />
        <Route path="/station/:id" element={<StationScene />} />
        <Route path="/train/:id" element={<TrainInteriorScene />} />
      </Routes>
    </SceneTransition>
  );
}

export default function App() {
  const [showDialog, setShowDialog] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasSavedGame().then((hasSave) => {
      if (hasSave) {
        setShowDialog(true);
      } else {
        setReady(true);
        startAutoSave();
      }
    });
  }, []);

  const handleContinue = async () => {
    await loadGameState();
    setShowDialog(false);
    setReady(true);
    startAutoSave();
  };

  const handleNewGame = async () => {
    await clearGameState();
    setShowDialog(false);
    setReady(true);
    startAutoSave();
  };

  return (
    <BrowserRouter>
      {showDialog && (
        <SaveLoadDialog onContinue={handleContinue} onNewGame={handleNewGame} />
      )}
      {ready && <AnimatedRoutes />}
    </BrowserRouter>
  );
}
