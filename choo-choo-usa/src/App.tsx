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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoundhouseScene } from './scenes/roundhouse/RoundhouseScene';
import { NationalMapScene } from './scenes/national-map/NationalMapScene';
import { SaveLoadDialog } from './components/ui/SaveLoadDialog';
import { hasSavedGame, loadGameState, clearGameState, startAutoSave } from './engine/persistence';

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
      {ready && (
        <Routes>
          <Route path="/" element={<RoundhouseScene />} />
          <Route path="/map" element={<NationalMapScene />} />
          {/* Phase 4 routes */}
          <Route path="/station/:id" element={<PlaceholderScene name="Station" />} />
          <Route path="/train/:id" element={<PlaceholderScene name="Train Interior" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

function PlaceholderScene({ name }: { name: string }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A1A2E',
      color: '#FDF6E3',
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: '2rem',
    }}>
      {name} — Coming in Phase 4
    </div>
  );
}
