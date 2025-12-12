import { motion, AnimatePresence } from "framer-motion";

interface LoadingModalProps {
  show: boolean;
}

export const LoadingModal = ({ show }: LoadingModalProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#a19887] bg-opacity-100"
          role="dialog"
          aria-modal="true"
        >
          <div className="dot-spinner" role="status" aria-label="Loading">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="dot-spinner__dot"
                style={{ ['--i' as any]: i } as React.CSSProperties}
              />
            ))}
          </div>
          <span className="sr-only">Loading…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
