/**
 * App.tsx
 *
 * Root component with React Router scene switching. Scenes transition
 * like turning storybook pages. Phase 1: Roundhouse, Phase 2: National Map.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for scene navigation hierarchy
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoundhouseScene } from './scenes/roundhouse/RoundhouseScene';
import { NationalMapScene } from './scenes/national-map/NationalMapScene';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoundhouseScene />} />
        <Route path="/map" element={<NationalMapScene />} />
        {/* Phase 4 routes */}
        <Route path="/station/:id" element={<PlaceholderScene name="Station" />} />
        <Route path="/train/:id" element={<PlaceholderScene name="Train Interior" />} />
      </Routes>
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
