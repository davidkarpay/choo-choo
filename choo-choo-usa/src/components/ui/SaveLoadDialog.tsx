/**
 * SaveLoadDialog.tsx
 *
 * Parchment-styled dialog shown on startup when a saved game exists.
 * Offers "Continue" (restore) or "New Game" (fresh start).
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - framer-motion: animations
 *   - persistence: save/load functions
 */

import { motion } from 'framer-motion';

interface SaveLoadDialogProps {
  onContinue: () => void;
  onNewGame: () => void;
}

export function SaveLoadDialog({ onContinue, onNewGame }: SaveLoadDialogProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(26, 26, 46, 0.85)',
      zIndex: 9999,
      fontFamily: 'Lora, Georgia, serif',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          background: '#FDF6E3',
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '3px solid #1A1A2E',
        }}
      >
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '1.8rem',
          color: '#1A1A2E',
          marginBottom: 8,
          fontWeight: 900,
        }}>
          Welcome Back!
        </h1>

        <p style={{
          color: '#1A1A2E',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: 32,
          opacity: 0.8,
        }}>
          A saved railroad world was found. Would you like to continue where you left off, or start a brand new adventure?
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={onContinue}
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '12px 28px',
              borderRadius: 8,
              border: '2px solid #1A1A2E',
              background: '#F4C542',
              color: '#1A1A2E',
              cursor: 'pointer',
              minWidth: 140,
              minHeight: 44,
            }}
          >
            Continue
          </button>

          <button
            onClick={onNewGame}
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '12px 28px',
              borderRadius: 8,
              border: '2px solid #1A1A2E',
              background: '#FDF6E3',
              color: '#1A1A2E',
              cursor: 'pointer',
              minWidth: 140,
              minHeight: 44,
            }}
          >
            New Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
