import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoundhouseScene } from './scenes/roundhouse/RoundhouseScene';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoundhouseScene />} />
        {/* Phase 2+ routes will be added here */}
        <Route path="/map" element={<PlaceholderScene name="National Map" />} />
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
      {name} — Coming in Phase 2
    </div>
  );
}
