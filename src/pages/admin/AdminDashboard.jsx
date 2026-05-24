import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebar, PageTransition } from "../../components/common/Layout";
import { Users, Package, ShoppingBag, TrendingUp, AlertCircle, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import { fetchAdminStats, fetchPendingProducts, fetchPendingStores, approveProduct, rejectProduct } from "../../lib/supabase";

export default function AdminDashboard() {
  const { navigate } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalStores: 0 });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal reject — ganti dari window.prompt()
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, pp, ps] = await Promise.all([
          fetchAdminStats(),
          fetchPendingProducts(),
          fetchPendingStores(),
        ]);
        if (cancelled) return;
        setStats(s);
        if (pp.error) {
          console.error("[Admin] pending products error:", pp.error);
          toast.error("Gagal memuat produk pending.");
        }
        if (ps.error) {
          console.error("[Admin] pending stores error:", ps.error);
          toast.error("Gagal memuat toko pending.");
        }
        setPendingProducts(pp.data || []);
        setPendingStores(ps.data   || []);
      } catch (err) {
        if (!cancelled) {
          console.error("[Admin] load error:", err);
          toast.error("Gagal memuat data admin.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (id) => {
    setActionLoading(id);
    const { error } = await approveProduct(id);
    if (error) {
      toast.error("Gagal menyetujui produk: " + error.message);
    } else {
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk berhasil disetujui.");
    }
    setActionLoading(null);
  };

  const openRejectModal = (product) => {
    setRejectModal(product);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Alasan penolakan wajib diisi.");
      return;
    }
    const id = rejectModal.id;
    setActionLoading(id);
    const { error } = await rejectProduct(id, rejectReason);
    if (error) {
      toast.error("Gagal menolak produk: " + error.message);
    } else {
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk telah ditolak.");
      setRejectModal(null);
      setRejectReason("");
    }
    setActionLoading(null);
  };

  const statCards = [
    { label: "Total Pengguna",    value: stats.totalUsers.toLocaleString("id-ID"),    sub: "terdaftar",             icon: Users,     color: "text-blue-600 bg-blue-50" },
    { label: "Penyewaan",         value: stats.totalOrders.toLocaleString("id-ID"),   sub: "total transaksi",       icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
    { label: "Produk Disetujui",  value: stats.totalProducts.toLocaleString("id-ID"), sub: `${pendingProducts.length} menunggu review`, icon: Package, color: "text-amber-600 bg-amber-50" },
    { label: "Toko Aktif",        value: stats.totalStores.toLocaleString("id-ID"),   sub: `${pendingStores.length} menunggu verifikasi`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
  ];

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-dashboard" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm">Monitor performa TechRent hari ini</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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

              {/* Pending actions */}
              {(pendingProducts.length > 0 || pendingStores.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-800">Butuh Perhatian</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingProducts.length > 0 && (
                      <button onClick={() => navigate("admin-products")}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-all text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{pendingProducts.length} Produk</p>
                            <p className="text-xs text-slate-500">Menunggu approval</p>
                          </div>
                        </div>
                        <span className="text-blue-600 text-xs font-semibold">Review →</span>
                      </button>
                    )}
                    {pendingStores.length > 0 && (
                      <button onClick={() => navigate("admin-stores")}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-all text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{pendingStores.length} Toko Baru</p>
                            <p className="text-xs text-slate-500">Menunggu verifikasi</p>
                          </div>
                        </div>
                        <span className="text-blue-600 text-xs font-semibold">Review →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recent pending products */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Produk Menunggu Review</h3>
                  <button onClick={() => navigate("admin-products")} className="text-sm text-blue-600 hover:underline font-medium">Lihat Semua</button>
                </div>
                {pendingProducts.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">Tidak ada produk yang menunggu review.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-3 text-left">Produk</th>
                          <th className="px-4 py-3 text-left">Lender</th>
                          <th className="px-4 py-3 text-left">Kategori</th>
                          <th className="px-4 py-3 text-right">Harga/hari</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pendingProducts.slice(0, 5).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.name}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{p.lender?.name || "—"}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{p.category}</td>
                            <td className="px-4 py-4 text-sm text-right font-semibold text-slate-800">{formatRupiah(p.price_per_day)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-all disabled:opacity-40">
                                  {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Setujui
                                </button>
                                <button onClick={() => openRejectModal(p)} disabled={actionLoading === p.id}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-all disabled:opacity-40">
                                  Tolak
                                </button>
                              </div>
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

          {/* Modal Reject — pengganti window.prompt() */}
          <AnimatePresence>
            {rejectModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setRejectModal(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Tolak Produk</h3>
                      <p className="text-xs text-slate-500">{rejectModal.name}</p>
                    </div>
                  </div>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 transition-all resize-none h-24 mb-4"
                    placeholder="Jelaskan alasan penolakan kepada lender..." autoFocus />
                  <div className="flex gap-3">
                    <button onClick={() => setRejectModal(null)} disabled={actionLoading === rejectModal.id}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                      Batal
                    </button>
                    <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                      className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {actionLoading === rejectModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      Tolak Produk
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageTransition>
  );
}
