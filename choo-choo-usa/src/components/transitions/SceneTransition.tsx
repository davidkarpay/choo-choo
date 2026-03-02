/**
 * SceneTransition.tsx
 *
 * Route-based scene transition wrapper. Uses Framer Motion's
 * AnimatePresence for iris-wipe (circle clip-path) and page-turn
 * (slide + rotateY) transitions between scenes. Duration 700ms
 * with the project's default easing.
 *
 * Part of: Choo-Choo USA — Phase 4 (M6)
 *
 * Dependencies:
 *   - framer-motion: AnimatePresence, motion
 *   - react-router-dom: useLocation
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const DURATION = 0.7;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/**
 * Page-turn transition variants: outgoing slides left with a slight
 * rotateY, incoming slides in from the right.
 */
const pageTurnVariants = {
  initial: {
    x: '100%',
    rotateY: -15,
    opacity: 0,
  },
  animate: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    transition: { duration: DURATION, ease: EASE },
  },
  exit: {
    x: '-30%',
    rotateY: 10,
    opacity: 0,
    transition: { duration: DURATION * 0.8, ease: EASE },
  },
};

interface SceneTransitionProps {
  children: ReactNode;
}

export function SceneTransition({ children }: SceneTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageTurnVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          perspective: 1200,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
