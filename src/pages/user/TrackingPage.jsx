import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserNav, PageTransition, StatusBadge } from "../../components/common/Layout";
import { Package, CheckCircle, Clock, Truck, RotateCcw, Loader2 } from "lucide-react";
import { fetchOrdersByUser } from "../../lib/supabase";
import { formatRupiah } from "../../lib/data";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const TIMELINE_STEPS = [
  { key: "pending",    label: "Pesanan Dikonfirmasi", icon: CheckCircle },
  { key: "confirmed",  label: "Perangkat Disiapkan",  icon: Package },
  { key: "shipped",    label: "Dalam Pengiriman",     icon: Truck },
  { key: "active",     label: "Perangkat Diterima",   icon: Package },
  { key: "returned",   label: "Masa Sewa Aktif",      icon: Clock },
  { key: "completed",  label: "Pengembalian",         icon: RotateCcw },
];

const STATUS_ORDER = ["pending", "confirmed", "shipped", "active", "returned", "completed"];

function OrderTimeline({ order }) {
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Pelacakan Pesanan</h3>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-xs text-slate-400 mb-6 font-mono break-all">{order.id}</p>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const Icon = step.icon;
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`w-0.5 h-8 ${done ? "bg-blue-200" : "bg-slate-100"}`} />
                )}
              </div>
              <div className={`pb-6 ${i === TIMELINE_STEPS.length - 1 ? "pb-0" : ""}`}>
                <p className={`text-sm font-semibold ${done ? "text-slate-800" : "text-slate-400"}`}>
                  {step.label}
                </p>
                {done && order.created_at && i === 0 && (
                  <p className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function TrackingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await fetchOrdersByUser(user.id);
      if (cancelled) return;
      if (error) {
        console.error("[Tracking] error:", error);
        toast.error("Gagal memuat pesanan.");
      }
      const list = data || [];
      setOrders(list);
      if (list.length > 0) setSelected(list[0]);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Pesanan Saya</h1>

          {loading && (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="text-center py-24 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada pesanan</p>
              <p className="text-sm mt-1">Pesanan kamu akan muncul di sini.</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {orders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className={`w-full text-left bg-white rounded-2xl p-4 border-2 transition-all shadow-sm ${
                      selected?.id === order.id ? "border-blue-500" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {order.product?.image_url ? (
                        <img
                          src={order.product.image_url} alt=""
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-400 font-mono truncate">{order.id.slice(0, 8)}…</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <h3 className="font-semibold text-sm text-slate-800 truncate">
                          {order.product?.name || "Produk"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.start_date} — {order.end_date} · {order.duration_days} hari
                        </p>
                        <p className="text-sm font-bold text-blue-600 mt-1">
                          {formatRupiah(order.total_price)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selected && <OrderTimeline order={selected} />}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
