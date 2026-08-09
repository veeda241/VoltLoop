import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../state/store";

const toneStyles = {
  volt: "border-volt/40 bg-bg-card text-volt",
  warn: "border-warn/40 bg-bg-card text-warn",
  danger: "border-danger/40 bg-bg-card text-danger",
  muted: "border-line bg-bg-card text-muted",
};

function Toast({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${
        toneStyles[toast.tone] || toneStyles.muted
      }`}
    >
      {toast.message}
    </motion.div>
  );
}

export default function Toaster() {
  const { state, dispatch } = useStore();
  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {state.toasts.map((t) => (
          <Toast key={t.id} toast={t} onDone={() => dispatch({ type: "DISMISS_TOAST", payload: { id: t.id } })} />
        ))}
      </AnimatePresence>
    </div>
  );
}
