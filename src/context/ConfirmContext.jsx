import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";

// ─── Confirm Context ────────────────────────────────────────────────────────
// Global modal konfirmasi sebagai pengganti window.confirm().
// Pakai di mana saja via:
//
//   const confirm = useConfirm();
//
//   const ok = await confirm({
//     title:        "Hapus produk?",
//     description:  "Produk akan dihapus permanen.",
//     confirmLabel: "Hapus",
//     cancelLabel:  "Batal",
//     variant:      "danger" | "warning" | "info",  // default: "warning"
//   });
//
//   if (ok) { /* lanjut hapus */ }
//
// Modal bersifat promise-based — returnnya `true` jika user klik konfirmasi,
// `false` jika cancel/klik overlay/tekan ESC.

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
};

const VARIANTS = {
  danger: {
    icon:        Trash2,
    iconBg:      "bg-red-100",
    iconColor:   "text-red-600",
    confirmBtn:  "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon:        AlertTriangle,
    iconBg:      "bg-amber-100",
    iconColor:   "text-amber-600",
    confirmBtn:  "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon:        Info,
    iconBg:      "bg-blue-100",
    iconColor:   "text-blue-600",
    confirmBtn:  "bg-blue-600 hover:bg-blue-700",
  },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  // Simpan resolve function di ref supaya tetap stable
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        title:        options.title        || "Konfirmasi",
        description:  options.description  || "Apakah kamu yakin?",
        confirmLabel: options.confirmLabel || "Ya",
        cancelLabel:  options.cancelLabel  || "Batal",
        variant:      options.variant      || "warning",
      });
    });
  }, []);

  const handleClose = (result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setState(null);
  };

  const variant = state ? (VARIANTS[state.variant] || VARIANTS.warning) : VARIANTS.warning;
  const Icon = variant.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => handleClose(false)}
            onKeyDown={(e) => { if (e.key === "Escape") handleClose(false); }}
            tabIndex={-1}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              exit={{    scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${variant.iconBg}`}>
                  <Icon className={`w-5 h-5 ${variant.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{state.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{state.description}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all"
                >
                  {state.cancelLabel}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-sm transition-all ${variant.confirmBtn}`}
                  autoFocus
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
