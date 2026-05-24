import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LenderSidebar, PageTransition, StatusBadge } from "../../components/common/Layout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import {
  fetchOrdersByLender, updateOrderStatus, incrementProductStock,
  uploadHandoverPhoto,
} from "../../lib/supabase";
import {
  ShoppingBag, Loader2, ChevronRight, Upload, X, Camera, CalendarDays,
  CheckCircle, Package, AlertCircle,
} from "lucide-react";

// ─── Status & action map (perspektif lender) ─────────────────────────────────
// pending   → confirmed : siapkan barang
// confirmed → shipped   : kirim barang
// shipped   → active    : konfirmasi barang sudah diterima penyewa
//                         (PERLU foto bukti + tanggal pengembalian)
// active    → returned  : tandai barang sudah dikembalikan dari penyewa
//                         (PERLU foto bukti kondisi saat dikembalikan)
// returned  → completed : selesaikan transaksi (stok dikembalikan)
const LENDER_ACTIONS = {
  pending:   { label: "Siapkan Barang",       next: "confirmed", cls: "bg-blue-600 hover:bg-blue-700 text-white",       needsHandover: false, needsReturn: false },
  confirmed: { label: "Kirim Barang",         next: "shipped",   cls: "bg-indigo-600 hover:bg-indigo-700 text-white",   needsHandover: false, needsReturn: false },
  shipped:   { label: "Konfirmasi Diterima",  next: "active",    cls: "bg-emerald-600 hover:bg-emerald-700 text-white", needsHandover: true,  needsReturn: false },
  active:    { label: "Tandai Dikembalikan",  next: "returned",  cls: "bg-amber-600 hover:bg-amber-700 text-white",     needsHandover: false, needsReturn: true  },
  returned:  { label: "Selesaikan",           next: "completed", cls: "bg-slate-600 hover:bg-slate-700 text-white",     needsHandover: false, needsReturn: false },
};

const MAX_FILE_SIZE_MB = 5;

// ─── Handover Modal (shipped → active) ───────────────────────────────────────
function HandoverModal({ open, order, onClose, onConfirm, processing }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [expectedReturn, setExpectedReturn] = useState("");

  // Default expected return = end_date dari order (dihitung dari days penyewa)
  useEffect(() => {
    if (order?.end_date) setExpectedReturn(order.end_date);
    else                 setExpectedReturn("");
  }, [order?.id]); // eslint-disable-line

  // Cleanup blob URL
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.warning("File harus berupa gambar."); return; }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) { toast.warning(`Ukuran maks ${MAX_FILE_SIZE_MB}MB.`); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!file) {
      toast.warning("Upload foto bukti serah-terima terlebih dahulu.");
      return;
    }
    if (!expectedReturn) {
      toast.warning("Tanggal pengembalian wajib diisi.");
      return;
    }
    onConfirm({ file, expectedReturn, kind: "handover" });
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setExpectedReturn(order?.end_date || "");
    onClose();
  };

  if (!order) return null;
  const minDate = order.start_date || new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={!processing ? handleClose : undefined}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Konfirmasi Serah-Terima</h3>
              </div>
              <button onClick={handleClose} disabled={processing}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700">
                  Upload foto saat menyerahkan <strong>{order.product?.name}</strong> ke penyewa dan tentukan tanggal pengembalian.
                </p>
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Foto Bukti Serah-Terima <span className="text-red-500">*</span>
                </label>
                {preview ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100">
                    <img src={preview} alt="bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processing}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow text-slate-700 hover:text-emerald-600 transition-all text-xs font-medium flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">Klik untuk upload foto</span>
                    <span className="text-xs text-slate-300">JPG / PNG · Maks. {MAX_FILE_SIZE_MB}MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Expected return date */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  Tanggal Pengembalian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedReturn}
                  min={minDate}
                  onChange={e => setExpectedReturn(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Default: {order.end_date || "—"} (dari durasi sewa penyewa). Bisa diubah jika ada kesepakatan baru.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={handleClose} disabled={processing}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={processing || !file || !expectedReturn}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 transition-all disabled:opacity-40">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Konfirmasi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Return Modal (active → returned) ────────────────────────────────────────
function ReturnModal({ open, order, onClose, onConfirm, processing }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [actualReturn, setActualReturn] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.warning("File harus berupa gambar."); return; }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) { toast.warning(`Ukuran maks ${MAX_FILE_SIZE_MB}MB.`); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!file) { toast.warning("Upload foto bukti pengembalian terlebih dahulu."); return; }
    if (!actualReturn) { toast.warning("Tanggal pengembalian wajib diisi."); return; }
    onConfirm({ file, actualReturn, kind: "return" });
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    onClose();
  };

  if (!order) return null;
  const expected = order.expected_return_date || order.end_date;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={!processing ? handleClose : undefined}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800">Bukti Pengembalian</h3>
              </div>
              <button onClick={handleClose} disabled={processing}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  Upload foto kondisi <strong>{order.product?.name}</strong> saat dikembalikan dari penyewa.
                </p>
                {expected && (
                  <p className="text-xs text-amber-600 mt-1">
                    Pengingat: tanggal kembali yang disepakati <strong>{expected}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Foto Kondisi Barang <span className="text-red-500">*</span>
                </label>
                {preview ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100">
                    <img src={preview} alt="bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processing}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow text-slate-700 hover:text-amber-600 transition-all text-xs font-medium flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">Klik untuk upload foto</span>
                    <span className="text-xs text-slate-300">JPG / PNG · Maks. {MAX_FILE_SIZE_MB}MB</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  Tanggal Pengembalian Aktual <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={actualReturn}
                  onChange={e => setActualReturn(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={handleClose} disabled={processing}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={processing || !file || !actualReturn}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white font-semibold rounded-xl text-sm hover:bg-amber-700 transition-all disabled:opacity-40">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Konfirmasi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Order Detail Modal — tampilkan foto-foto bukti ──────────────────────────
function OrderDetailModal({ open, order, onClose }) {
  if (!order) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Detail Pesanan</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">ID Pesanan</p>
                <p className="font-mono text-sm text-slate-800">{order.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCell label="Penyewa" value={order.user?.name || order.user?.email?.split("@")[0] || "—"} />
                <InfoCell label="Status"  value={<StatusBadge status={order.status} />} />
                <InfoCell label="Produk"  value={order.product?.name || "—"} />
                <InfoCell label="Jumlah"  value={`${order.quantity || 1} unit`} />
                <InfoCell label="Durasi"  value={`${order.duration_days} hari`} />
                <InfoCell label="Total"   value={formatRupiah(order.total_price)} />
                <InfoCell label="Mulai"   value={order.start_date} />
                <InfoCell label="Selesai" value={order.end_date} />
                {order.expected_return_date && <InfoCell label="Target Kembali" value={order.expected_return_date} />}
                {order.actual_return_date   && <InfoCell label="Kembali Aktual" value={order.actual_return_date} />}
              </div>

              {order.shipping_address && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Alamat Pengiriman</p>
                  <p className="text-sm text-slate-700">{order.shipping_address}</p>
                </div>
              )}

              {order.handover_photo_url && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Foto Serah-Terima</p>
                  <a href={order.handover_photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={order.handover_photo_url} alt="handover" className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                  </a>
                </div>
              )}

              {order.return_photo_url && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Foto Pengembalian</p>
                  <a href={order.return_photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={order.return_photo_url} alt="return" className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                  </a>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4">
              <button onClick={onClose}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all">
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LenderOrders() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Modal states
  const [handoverOrder, setHandoverOrder] = useState(null);
  const [returnOrder,   setReturnOrder]   = useState(null);
  const [detailOrder,   setDetailOrder]   = useState(null);
  const [modalProcessing, setModalProcessing] = useState(false);

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
  }, [user?.id]); // eslint-disable-line

  // ─── Update status sederhana (tanpa upload foto) ─────────────────────────
  const handleSimpleStatusUpdate = async (order, nextStatus) => {
    setUpdating(order.id);
    const { data, error } = await updateOrderStatus(order.id, nextStatus);
    setUpdating(null);
    if (error) {
      toast.error("Gagal memperbarui status: " + error.message);
      return;
    }
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...data } : o));

    // returned → completed: restore stock
    if (nextStatus === "completed") {
      await incrementProductStock(order.product_id, order.quantity || 1);
    }
    toast.success("Status pesanan berhasil diperbarui.");
  };

  // ─── Handover: shipped → active dengan foto + tanggal target kembali ─────
  const handleHandoverConfirm = async ({ file, expectedReturn }) => {
    if (!handoverOrder) return;
    setModalProcessing(true);
    try {
      const url = await uploadHandoverPhoto(file, handoverOrder.id, "handover");
      if (!url) throw new Error("Gagal mengupload foto.");

      const { data, error } = await updateOrderStatus(handoverOrder.id, "active", {
        handover_photo_url:   url,
        expected_return_date: expectedReturn,
      });
      if (error) throw new Error(error.message);

      setOrders(prev => prev.map(o => o.id === handoverOrder.id ? { ...o, ...data } : o));
      toast.success("Serah-terima berhasil dicatat.");
      setHandoverOrder(null);
    } catch (err) {
      toast.error("Gagal: " + err.message);
    } finally {
      setModalProcessing(false);
    }
  };

  // ─── Return: active → returned dengan foto + tanggal aktual kembali ──────
  const handleReturnConfirm = async ({ file, actualReturn }) => {
    if (!returnOrder) return;
    setModalProcessing(true);
    try {
      const url = await uploadHandoverPhoto(file, returnOrder.id, "return");
      if (!url) throw new Error("Gagal mengupload foto.");

      const { data, error } = await updateOrderStatus(returnOrder.id, "returned", {
        return_photo_url:    url,
        actual_return_date:  actualReturn,
      });
      if (error) throw new Error(error.message);

      setOrders(prev => prev.map(o => o.id === returnOrder.id ? { ...o, ...data } : o));
      toast.success("Pengembalian berhasil dicatat.");
      setReturnOrder(null);
    } catch (err) {
      toast.error("Gagal: " + err.message);
    } finally {
      setModalProcessing(false);
    }
  };

  // ─── Action button click handler ─────────────────────────────────────────
  const handleActionClick = (order) => {
    const action = LENDER_ACTIONS[order.status];
    if (!action) return;
    if (action.needsHandover) setHandoverOrder(order);
    else if (action.needsReturn) setReturnOrder(order);
    else handleSimpleStatusUpdate(order, action.next);
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-orders" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Pesanan Masuk</h1>

          {/* Reminder: active orders dengan target return < 3 hari lagi */}
          <ReturnReminders orders={orders} />

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
                      <th className="px-6 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Penyewa</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Produk</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">Qty × Hari</th>
                      <th className="px-4 py-3 text-right hidden md:table-cell">Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(o => {
                      const action = LENDER_ACTIONS[o.status];
                      const isUpdating = updating === o.id;
                      const buyerName  = o.user?.name || o.user?.email?.split("@")[0] || "—";
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{o.id.slice(0, 8)}…</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-800">{buyerName}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">{o.product?.name || "—"}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 text-center hidden md:table-cell">
                            {(o.quantity || 1)}×{o.duration_days}h
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right hidden md:table-cell">
                            {formatRupiah(o.total_price)}
                          </td>
                          <td className="px-4 py-4 text-center"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => setDetailOrder(o)} title="Detail"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <Package className="w-4 h-4" />
                              </button>
                              {action ? (
                                <button
                                  onClick={() => handleActionClick(o)}
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
                                <span className="text-xs text-slate-400 px-2">Selesai</span>
                              )}
                            </div>
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

      <HandoverModal
        open={!!handoverOrder}
        order={handoverOrder}
        onClose={() => setHandoverOrder(null)}
        onConfirm={handleHandoverConfirm}
        processing={modalProcessing}
      />
      <ReturnModal
        open={!!returnOrder}
        order={returnOrder}
        onClose={() => setReturnOrder(null)}
        onConfirm={handleReturnConfirm}
        processing={modalProcessing}
      />
      <OrderDetailModal
        open={!!detailOrder}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </PageTransition>
  );
}

// ─── Return reminders banner ─────────────────────────────────────────────────
function ReturnReminders({ orders }) {
  const now = new Date();
  const reminders = orders.filter(o => {
    if (o.status !== "active") return false;
    const target = o.expected_return_date || o.end_date;
    if (!target) return false;
    const diff = (new Date(target) - now) / (1000 * 60 * 60 * 24);
    return diff <= 3; // 3 hari atau kurang (termasuk lewat tenggat)
  });

  if (reminders.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-800 text-sm">
          {reminders.length} pesanan mendekati / lewat tenggat pengembalian
        </p>
        <ul className="mt-1.5 space-y-1">
          {reminders.slice(0, 3).map(o => {
            const target = o.expected_return_date || o.end_date;
            const diffDays = Math.round((new Date(target) - now) / (1000 * 60 * 60 * 24));
            return (
              <li key={o.id} className="text-xs text-amber-700">
                <strong>{o.product?.name || "—"}</strong> — kembali {target}
                {diffDays < 0 ? ` (telat ${Math.abs(diffDays)} hari)` : diffDays === 0 ? " (hari ini)" : ` (${diffDays} hari lagi)`}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
