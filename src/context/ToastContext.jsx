import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Toast Context ──────────────────────────────────────────────────────────
// Sistem notifikasi global. Pakai di mana saja via:
//   const toast = useToast();
//   toast.success("Berhasil!");
//   toast.error("Ada error");
//   toast.warning("Hati-hati");
//   toast.info("Info");
//
// Toast auto-dismiss setelah 4 detik (bisa di-override).

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

const TOAST_CONFIG = {
  success: { icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200"  },
  error:   { icon: AlertCircle, color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50",  border: "border-amber-200"  },
  info:    { icon: Info,        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((type, message, duration = 4000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  // Helper shortcuts
  const toast = {
    success: (msg, dur) => show("success", msg, dur),
    error:   (msg, dur) => show("error",   msg, dur),
    warning: (msg, dur) => show("warning", msg, dur),
    info:    (msg, dur) => show("info",    msg, dur),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — fixed di pojok kanan atas */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0,   scale: 1   }}
                exit={{    opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-md px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border} shadow-lg backdrop-blur-sm`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                <p className="flex-1 text-sm text-slate-800 leading-snug">{t.message}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
