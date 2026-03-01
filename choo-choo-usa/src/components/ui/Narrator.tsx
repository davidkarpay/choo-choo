import { motion, AnimatePresence } from 'framer-motion';

interface NarratorProps {
  text: string | null;
}

export function Narrator({ text }: NarratorProps) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          className="narrator"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <p className="narrator__text">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
