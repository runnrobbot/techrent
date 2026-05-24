import { motion, AnimatePresence } from "framer-motion";
import { UserNav, PageTransition, EmptyState } from "../../components/common/Layout";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { formatRupiah } from "../../lib/data";

export default function CartPage() {
  const { cart, removeFromCart, updateCartItem, cartTotal } = useCart();
  const { navigate } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const handleRemove = async (item) => {
    const ok = await confirm({
      title:        "Hapus dari keranjang?",
      description:  `"${item.name}" akan dihapus dari keranjang sewa.`,
      confirmLabel: "Hapus",
      cancelLabel:  "Batal",
      variant:      "danger",
    });
    if (!ok) return;
    removeFromCart(item.id);
    toast.info("Item dihapus dari keranjang.");
  };

  // Helper: hitung subtotal per item dengan defensif (cegah NaN)
  const lineTotal = (item) => (item.price_per_day || 0) * (item.days || 1) * (item.quantity || 1);

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Keranjang Sewa</h1>

          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Keranjang Kosong"
              description="Belum ada perangkat yang kamu tambahkan ke keranjang."
              action={
                <button
                  onClick={() => navigate("home")}
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm"
                >
                  Mulai Cari Perangkat
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 shadow-sm"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">{item.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{item.store_name || "—"}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                            <button
                              aria-label="Kurangi hari"
                              onClick={() => updateCartItem(item.id, { days: Math.max(1, (item.days || 1) - 1) })}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">{item.days || 1}h</span>
                            <button
                              aria-label="Tambah hari"
                              onClick={() => updateCartItem(item.id, { days: Math.min(30, (item.days || 1) + 1) })}
                              className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{formatRupiah(lineTotal(item))}</span>
                        </div>
                      </div>
                      <button
                        aria-label="Hapus item"
                        onClick={() => handleRemove(item)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-start"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                  <h3 className="font-bold text-slate-800 mb-4">Ringkasan Pesanan</h3>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-slate-600 mb-2">
                      <span className="truncate mr-2">{item.name} ({item.days || 1}h)</span>
                      <span className="flex-shrink-0 font-medium">{formatRupiah(lineTotal(item))}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatRupiah(cartTotal)}</span>
                  </div>
                  <button
                    onClick={() => navigate("checkout")}
                    className="w-full mt-4 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                  >
                    Lanjut ke Checkout <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
