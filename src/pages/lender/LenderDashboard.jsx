import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LenderSidebar, PageTransition, StatusBadge } from "../../components/common/Layout";
import { TrendingUp, Package, ShoppingBag, DollarSign, Plus, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import { supabase } from "../../lib/supabase";

// ─── Helper: aggregate stats dari list orders + products ────────────────
const computeStats = (products, orders) => {
  // Revenue: ambil semua order yang sudah confirmed (lender sudah setuju
  // menerima order). pending = belum di-acc lender, cancelled = tidak hitung.
  const earningStatuses = ["confirmed", "shipped", "active", "returned", "completed"];
  const revenue = orders
    .filter(o => earningStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  // Aktif: penyewaan yang sedang berjalan (sudah diterima penyewa)
  const activeOrders  = orders.filter(o => o.status === "active").length;
  // Order yang butuh attention lender (perlu di-acc / disiapkan / dikirim)
  const pendingOrders = orders.filter(o => ["pending", "confirmed", "shipped"].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === "completed").length;

  const productsWithRating = products.filter(p => p.rating > 0);
  const avgRating = productsWithRating.length
    ? productsWithRating.reduce((s, p) => s + Number(p.rating), 0) / productsWithRating.length
    : 0;

  const reviewCount = products.reduce((s, p) => s + (p.review_count || 0), 0);

  return {
    revenue,
    activeOrders,
    pendingOrders,
    completedOrders,
    totalOrders:   orders.length,
    totalProducts: products.length,
    rating:        avgRating,
    reviewCount,
  };
};

export default function LenderDashboard() {
  const { navigate, user, profile } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    revenue: 0, activeOrders: 0, pendingOrders: 0, completedOrders: 0,
    totalOrders: 0, totalProducts: 0, rating: 0, reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }

      try {
        // Paralel: fetch 5 produk terbaru + semua orders milik lender ini
        const [prodRes, orderRes] = await Promise.all([
          supabase.from("products")
            .select("*").eq("lender_id", user.id)
            .order("created_at", { ascending: false }).limit(5),
          supabase.from("orders")
            .select("total_price, status").eq("lender_id", user.id),
        ]);

        if (cancelled) return;

        if (prodRes.error)  console.error("[LenderDashboard] products error:", prodRes.error);
        if (orderRes.error) console.error("[LenderDashboard] orders error:", orderRes.error);
        if (prodRes.error || orderRes.error) toast.error("Gagal memuat sebagian data dashboard.");

        const prods  = prodRes.data  || [];
        const orders = orderRes.data || [];
        setProducts(prods);
        setStats(computeStats(prods, orders));
      } catch (err) {
        if (!cancelled) {
          console.error("[LenderDashboard] error:", err);
          toast.error("Gagal memuat dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending  = products.filter(p => p.status === "pending").length;
  const rejected = products.filter(p => p.status === "rejected").length;
  const approved = products.filter(p => p.status === "approved").length;

  const statCards = [
    {
      label: "Total Pendapatan",
      value: formatRupiah(stats.revenue),
      sub:   `dari ${stats.totalOrders} pesanan`,
      icon:  DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Penyewaan Aktif",
      value: `${stats.activeOrders} aktif`,
      sub:   stats.pendingOrders > 0
              ? `${stats.pendingOrders} menunggu tindakan`
              : "saat ini berjalan",
      icon:  ShoppingBag,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Produk",
      value: `${stats.totalProducts} produk`,
      sub:   `${approved} disetujui`,
      icon:  Package,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Rating Toko",
      value: stats.rating ? `${stats.rating.toFixed(2)} ★` : "—",
      sub:   stats.reviewCount ? `dari ${stats.reviewCount} ulasan` : "belum ada ulasan",
      icon:  TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-dashboard" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm">Selamat datang, {profile?.name || "Lender"}</p>
            </div>
            <button
              onClick={() => navigate("lender-add-product")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 text-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Produk
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
                    >
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Alerts */}
              {(pending > 0 || rejected > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {pending > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">{pending} Produk Menunggu Review</p>
                        <p className="text-xs text-amber-600">Admin sedang memeriksa produk kamu</p>
                      </div>
                    </div>
                  )}
                  {rejected > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-800 text-sm">{rejected} Produk Ditolak</p>
                        <p className="text-xs text-red-600">Lihat detail di halaman inventaris</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent products */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Produk Terbaru</h3>
                  <button
                    onClick={() => navigate("lender-inventory")}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Lihat Semua
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Belum ada produk.{" "}
                    <button onClick={() => navigate("lender-add-product")} className="text-blue-600 underline">
                      Tambah sekarang
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                          <th className="px-6 py-3 text-left">Produk</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Stok</th>
                          <th className="px-4 py-3 text-right">Harga/hari</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-sm text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-500">
                                {p.category}{p.brand ? ` · ${p.brand}` : ""}
                              </p>
                              {p.reject_reason && (
                                <p className="text-xs text-red-500 mt-1">"{p.reject_reason}"</p>
                              )}
                            </td>
                            <td className="px-4 py-4"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-4 text-right text-sm text-slate-600">{p.stock}</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">
                              {formatRupiah(p.price_per_day)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
