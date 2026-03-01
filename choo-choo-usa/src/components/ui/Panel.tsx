import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  visible?: boolean;
  className?: string;
}

export function Panel({ title, children, onClose, visible = true, className = '' }: PanelProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`panel ${className}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {onClose && (
            <button className="panel__close" onClick={onClose} aria-label="Close panel">
              ✕
            </button>
          )}
          <h2 className="panel__header">{title}</h2>
          <div className="panel__body">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
