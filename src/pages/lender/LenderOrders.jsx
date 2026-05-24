import { useState, useEffect } from "react";
import { LenderSidebar, PageTransition, StatusBadge } from "../../components/common/Layout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import { fetchOrdersByLender, updateOrderStatus } from "../../lib/supabase";
import { ShoppingBag, Loader2, ChevronRight } from "lucide-react";

// ─── Status Actions (dari perspektif lender) ─────────────────────────────────
// pending   = pesanan baru masuk, lender perlu siapkan barang → confirmed
// confirmed = barang sudah disiapkan, lender kirim → shipped
// shipped   = barang sudah dikirim, lender konfirmasi diterima → active
// active    = barang sedang dipakai, lender tandai dikembalikan → returned
// returned  = barang sudah dikembalikan, lender selesaikan → completed
const LENDER_ACTIONS = {
  pending: { label: "Siapkan Barang", next: "confirmed", cls: "bg-blue-600 hover:bg-blue-700 text-white" },
  confirmed: { label: "Kirim Barang", next: "shipped", cls: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  shipped: { label: "Konfirmasi Terima", next: "active", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  active: { label: "Tandai Dikembalikan", next: "returned", cls: "bg-amber-600 hover:bg-amber-700 text-white" },
  returned: { label: "Selesaikan", next: "completed", cls: "bg-slate-600 hover:bg-slate-700 text-white" },
};

export default function LenderOrders() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // orderId yang sedang diupdate

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await fetchOrdersByLender(user.id);
      if (cancelled) return;
      if (error) {
        console.error("[LenderOrders] error:", error);
        toast.error("Gagal memuat pesanan masuk.");
      }
      setOrders(data || []);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusUpdate = async (order, nextStatus) => {
    setUpdating(order.id);
    const { data, error } = await updateOrderStatus(order.id, nextStatus);
    setUpdating(null);
    if (error) {
      toast.error("Gagal memperbarui status: " + error.message);
      return;
    }
    // Update local state supaya tabel langsung reflect perubahan
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: data.status } : o));
    toast.success("Status pesanan berhasil diperbarui.");
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-orders" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Pesanan Masuk</h1>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada pesanan masuk.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">ID Pesanan</th>
                      <th className="px-4 py-3 text-left">Penyewa</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Produk</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">Hari</th>
                      <th className="px-4 py-3 text-right hidden md:table-cell">Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(o => {
                      const action = LENDER_ACTIONS[o.status];
                      const isUpdating = updating === o.id;
                      // Tampilkan nama, fallback ke bagian awal email jika nama kosong
                      const buyerName = o.user?.name || o.user?.email?.split("@")[0] || "—";
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{o.id.slice(0, 8)}…</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-800">{buyerName}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">{o.product?.name || "—"}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 text-center hidden md:table-cell">{o.duration_days} hari</td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right hidden md:table-cell">{formatRupiah(o.total_price)}</td>
                          <td className="px-4 py-4 text-center"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-4 text-center">
                            {action ? (
                              <button
                                onClick={() => handleStatusUpdate(o, action.next)}
                                disabled={isUpdating}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 whitespace-nowrap ${action.cls}`}
                              >
                                {isUpdating
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <ChevronRight className="w-3 h-3" />
                                }
                                {action.label}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Selesai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}