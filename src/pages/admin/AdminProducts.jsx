import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebar, PageTransition, StatusBadge } from "../../components/common/Layout";
import {
  CheckCircle, XCircle, Search, AlertTriangle, Loader2, Package, Users, Eye,
  ChevronDown, ChevronUp, Building2, MapPin, ImageOff, Phone, CreditCard,
  FileText, ExternalLink, Calendar, ShoppingBag,
} from "lucide-react";
import { formatRupiah } from "../../lib/data";
import { useToast } from "../../context/ToastContext";
import {
  fetchPendingProducts, fetchPendingStores, fetchAllUsers, fetchAllTransactions,
  approveProduct, rejectProduct, approveStore, rejectStore,
  getDocumentSignedUrl, supabase,
} from "../../lib/supabase";

// ─── Reject Modal ────────────────────────────────────────────────────────────
function RejectModal({ open, target, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) setReason(""); }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Alasan Penolakan</h3>
                {target?.label && <p className="text-xs text-slate-500 truncate max-w-[200px]">{target.label}</p>}
              </div>
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 transition-all resize-none h-24 mb-4"
              placeholder="Jelaskan alasan penolakan..." autoFocus />
            <div className="flex gap-3">
              <button onClick={onClose} disabled={loading}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Tolak
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Product Preview Modal ───────────────────────────────────────────────────
function ProductPreviewModal({ open, product, onClose, onApprove, onReject, actionLoading }) {
  if (!product) return null;

  const conditionColor = {
    "Baru":       "bg-green-100 text-green-700",
    "Sangat Baik":"bg-blue-100 text-blue-700",
    "Baik":       "bg-amber-100 text-amber-700",
    "Cukup":      "bg-orange-100 text-orange-700",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Preview Produk</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image + basic info */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-48 h-48 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                      <ImageOff className="w-10 h-10" />
                      <span className="text-xs">Belum ada foto</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{product.category}</span>
                    {product.condition && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conditionColor[product.condition] || "bg-slate-100 text-slate-600"}`}>
                        {product.condition}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h2>
                  {product.brand && <p className="text-sm text-slate-500 mb-3">{product.brand}</p>}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-24">Harga/hari</span>
                      <span className="text-base font-bold text-blue-600">{formatRupiah(product.price_per_day)}</span>
                    </div>
                    {product.price_per_week && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-24">Harga/minggu</span>
                        <span className="text-sm font-semibold text-slate-700">{formatRupiah(product.price_per_week)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-24">Stok</span>
                      <span className="text-sm font-semibold text-slate-700">{product.stock} unit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lender info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Informasi Lender</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(product.lender?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{product.lender?.name || "—"}</p>
                    {product.store && (
                      <p className="text-xs text-slate-500">{product.store.store_name}{product.store.city ? ` · ${product.store.city}` : ""}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deskripsi</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {/* Specs */}
              {Array.isArray(product.specs) && product.specs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Spesifikasi</p>
                  <ul className="space-y-1.5">
                    {product.specs.map((spec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Diajukan */}
              <p className="text-xs text-slate-400">
                Diajukan: {new Date(product.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all">
                Tutup
              </button>
              <button onClick={() => { onReject(product); onClose(); }} disabled={actionLoading === product.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-100 transition-all disabled:opacity-40">
                <XCircle className="w-4 h-4" /> Tolak
              </button>
              <button onClick={() => { onApprove(product.id); onClose(); }} disabled={actionLoading === product.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition-all disabled:opacity-40">
                {actionLoading === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Setujui
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Admin Products ──────────────────────────────────────────────────────────
export function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingProducts().then(({ data, error }) => {
      if (error) toast.error("Gagal memuat produk pending.");
      setProducts(data || []);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const handleApprove = async (id) => {
    setActionLoading(id);
    const { error } = await approveProduct(id);
    if (error) {
      toast.error("Gagal menyetujui produk: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk berhasil disetujui.");
    }
    setActionLoading(null);
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setActionLoading(id);
    const { error } = await rejectProduct(id, reason);
    if (error) {
      toast.error("Gagal menolak produk: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk telah ditolak.");
      setRejectTarget(null);
    }
    setActionLoading(null);
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-products" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Approval Produk</h1>
          <p className="text-slate-500 text-sm mb-6">Review dan setujui produk yang diajukan oleh lender.</p>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada produk yang menunggu review.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">Produk</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Lender</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Kategori</th>
                      <th className="px-4 py-3 text-right hidden sm:table-cell">Harga/hari</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.brand || ""} · {new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">{p.lender?.name || "—"}</td>
                        <td className="px-4 py-4 text-sm text-slate-600 hidden md:table-cell">{p.category}</td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-slate-800 hidden sm:table-cell">{formatRupiah(p.price_per_day)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setPreviewProduct(p)} title="Preview"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Preview</span>
                            </button>
                            <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-all disabled:opacity-40">
                              {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">Setujui</span>
                            </button>
                            <button onClick={() => setRejectTarget({ id: p.id, label: p.name })} disabled={actionLoading === p.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-all disabled:opacity-40">
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Tolak</span>
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

          <ProductPreviewModal
            open={!!previewProduct}
            product={previewProduct}
            onClose={() => setPreviewProduct(null)}
            onApprove={handleApprove}
            onReject={(p) => setRejectTarget({ id: p.id, label: p.name })}
            actionLoading={actionLoading}
          />

          <RejectModal
            open={!!rejectTarget}
            target={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
            loading={actionLoading === rejectTarget?.id}
          />
        </main>
      </div>
    </PageTransition>
  );
}

// ─── Store Preview Modal ─────────────────────────────────────────────────────
function StorePreviewModal({ open, store, onClose, onApprove, onReject, actionLoading }) {
  const [ktpUrl, setKtpUrl] = useState(null);
  const [ktpLoading, setKtpLoading] = useState(false);

  // Fetch signed URL untuk KTP saat modal dibuka (KTP di bucket private)
  useEffect(() => {
    if (!open || !store?.ktp_url) {
      setKtpUrl(null);
      return;
    }
    setKtpLoading(true);
    getDocumentSignedUrl(store.ktp_url)
      .then(url => setKtpUrl(url))
      .finally(() => setKtpLoading(false));
  }, [open, store?.ktp_url]);

  if (!store) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Preview Toko</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Header: nama toko + tanggal */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">{store.store_name}</h2>
                  {store.description && (
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{store.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Diajukan {new Date(store.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Info lender */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Informasi Lender</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Nama"  value={store.lender?.name  || "—"} />
                  <InfoRow label="Email" value={store.lender?.email || "—"} />
                  <InfoRow label="HP Toko" value={store.phone || store.lender?.phone || "—"} icon={Phone} />
                  <InfoRow label="Kota"  value={store.city || "—"}  icon={MapPin} />
                </div>
              </div>

              {/* Info bank */}
              {(store.bank_name || store.bank_account || store.bank_holder) && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Rekening Pencairan
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Bank"        value={store.bank_name    || "—"} />
                    <InfoRow label="No. Rekening" value={store.bank_account || "—"} />
                    <InfoRow label="A.n."        value={store.bank_holder  || "—"} />
                  </div>
                </div>
              )}

              {/* KTP */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Verifikasi Identitas
                </p>
                <div className="space-y-2 mb-3">
                  <InfoRow label="No. KTP" value={store.ktp_number || "—"} />
                </div>
                {ktpLoading ? (
                  <div className="bg-white rounded-xl h-48 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : ktpUrl ? (
                  <a href={ktpUrl} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="relative bg-white rounded-xl overflow-hidden border border-slate-200">
                      <img src={ktpUrl} alt="KTP" className="w-full max-h-72 object-contain" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" /> Buka di tab baru
                      </div>
                    </div>
                  </a>
                ) : store.ktp_url ? (
                  <div className="bg-white rounded-xl h-32 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <ImageOff className="w-7 h-7" />
                    <span className="text-xs">Tidak bisa memuat foto KTP</span>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <ImageOff className="w-6 h-6" />
                    <span className="text-xs">Belum upload KTP</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all">
                Tutup
              </button>
              <button onClick={() => { onReject(store); onClose(); }} disabled={actionLoading === store.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-100 transition-all disabled:opacity-40">
                <XCircle className="w-4 h-4" /> Tolak
              </button>
              <button onClick={() => { onApprove(store.id); onClose(); }} disabled={actionLoading === store.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition-all disabled:opacity-40">
                {actionLoading === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Setujui
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Reusable little row ────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
    </div>
  );
}

// ─── Admin Stores ────────────────────────────────────────────────────────────
export function AdminStores() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [previewStore, setPreviewStore] = useState(null);

  useEffect(() => {
    fetchPendingStores().then(({ data, error }) => {
      if (error) toast.error("Gagal memuat toko pending.");
      setStores(data || []);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const handleApprove = async (id) => {
    setActionLoading(id);
    const { error } = await approveStore(id);
    if (error) {
      toast.error("Gagal menyetujui toko: " + error.message);
    } else {
      setStores(prev => prev.filter(s => s.id !== id));
      toast.success("Toko berhasil disetujui.");
    }
    setActionLoading(null);
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setActionLoading(id);
    const { error } = await rejectStore(id, reason);
    if (error) {
      toast.error("Gagal menolak toko: " + error.message);
    } else {
      setStores(prev => prev.filter(s => s.id !== id));
      toast.success("Toko telah ditolak.");
      setRejectTarget(null);
    }
    setActionLoading(null);
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-stores" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Approval Toko</h1>
          <p className="text-slate-500 text-sm mb-6">Verifikasi pengajuan toko baru dari lender.</p>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
          ) : stores.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada toko yang menunggu verifikasi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {stores.map(store => (
                <motion.div key={store.id} layout className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{store.store_name}</h3>
                      <p className="text-sm text-slate-500 truncate">{store.lender?.name || "—"}</p>
                      <p className="text-xs text-slate-400 truncate">{store.lender?.email || "—"}</p>
                      {store.city && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {store.city}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0 ml-3">
                      {new Date(store.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPreviewStore(store)} disabled={actionLoading === store.id}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-all disabled:opacity-40">
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button onClick={() => handleApprove(store.id)} disabled={actionLoading === store.id}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-40">
                      {actionLoading === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Setujui
                    </button>
                    <button onClick={() => setRejectTarget({ id: store.id, label: store.store_name })} disabled={actionLoading === store.id}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all disabled:opacity-40">
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <StorePreviewModal
            open={!!previewStore}
            store={previewStore}
            onClose={() => setPreviewStore(null)}
            onApprove={handleApprove}
            onReject={(s) => setRejectTarget({ id: s.id, label: s.store_name })}
            actionLoading={actionLoading}
          />

          <RejectModal
            open={!!rejectTarget}
            target={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
            loading={actionLoading === rejectTarget?.id}
          />
        </main>
      </div>
    </PageTransition>
  );
}

// ─── Admin Approved Stores ───────────────────────────────────────────────────
export function AdminApprovedStores() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [storeProducts, setStoreProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("stores")
      .select("*, lender:lender_id(id, name, email)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Gagal memuat toko aktif.");
        setStores(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  const toggleStore = async (store) => {
    if (expanded === store.id) {
      setExpanded(null);
      return;
    }
    setExpanded(store.id);
    if (storeProducts[store.id]) return;

    setLoadingProducts(store.id);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("lender_id", store.lender_id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Gagal memuat produk toko.");
    setStoreProducts(prev => ({ ...prev, [store.id]: data || [] }));
    setLoadingProducts(null);
  };

  const filtered = stores.filter(s =>
    s.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.lender?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-approved-stores" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Toko Aktif</h1>
          <p className="text-slate-500 text-sm mb-6">Daftar toko yang sudah disetujui beserta produk masing-masing.</p>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
                placeholder="Cari toko atau lender..." />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? "Toko tidak ditemukan." : "Belum ada toko aktif."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(store => {
                const isExpanded = expanded === store.id;
                const products = storeProducts[store.id] || [];

                return (
                  <motion.div key={store.id} layout className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Store header — clickable to expand */}
                    <button
                      onClick={() => toggleStore(store)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{store.store_name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span className="text-xs text-slate-500">{store.lender?.name || "—"}</span>
                            {store.city && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="w-3 h-3" /> {store.city}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              Bergabung {new Date(store.created_at).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        {isExpanded && !loadingProducts && storeProducts[store.id] && (
                          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">
                            {products.length} produk
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-400" />
                          : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                    </button>

                    {/* Products list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100">
                            {loadingProducts === store.id ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                              </div>
                            ) : products.length === 0 ? (
                              <div className="py-8 text-center text-slate-400">
                                <Package className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                                <p className="text-sm">Belum ada produk dari toko ini.</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                      <th className="px-6 py-3 text-left">Produk</th>
                                      <th className="px-4 py-3 text-left hidden sm:table-cell">Kategori</th>
                                      <th className="px-4 py-3 text-right hidden sm:table-cell">Harga/hari</th>
                                      <th className="px-4 py-3 text-center">Status</th>
                                      <th className="px-4 py-3 text-center hidden md:table-cell">Stok</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {products.map(p => (
                                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3.5">
                                          <div className="flex items-center gap-3">
                                            {p.image_url ? (
                                              <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Package className="w-4 h-4 text-slate-300" />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <p className="font-medium text-sm text-slate-800 truncate">{p.name}</p>
                                              {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{p.category}</td>
                                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 text-right hidden sm:table-cell">{formatRupiah(p.price_per_day)}</td>
                                        <td className="px-4 py-3.5 text-center"><StatusBadge status={p.status} /></td>
                                        <td className="px-4 py-3.5 text-center text-sm text-slate-600 hidden md:table-cell">{p.stock} unit</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}

// ─── Admin Users ─────────────────────────────────────────────────────────────
export function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers().then(({ data, error }) => {
      if (error) toast.error("Gagal memuat data user.");
      setUsers(data || []);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-users" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Manajemen User</h1>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
                  placeholder="Cari user..." />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? "User tidak ditemukan." : "Belum ada user terdaftar."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">Pengguna</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-800">{u.name || "—"}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.role === "lender" ? "bg-purple-100 text-purple-700" : u.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 text-center hidden sm:table-cell">
                          {new Date(u.created_at).toLocaleDateString("id-ID")}
                        </td>
                      </tr>
                    ))}
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

// ─── Transaction Detail Modal ────────────────────────────────────────────────
function TransactionDetailModal({ open, order, onClose }) {
  if (!order) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Detail Transaksi</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* ID + status */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">ID Pesanan</p>
                  <p className="font-mono text-sm text-slate-800 break-all">{order.id}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Produk */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Produk</p>
                <div className="flex items-center gap-3">
                  {order.product?.image_url ? (
                    <img src={order.product.image_url} alt={order.product.name} className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-slate-300 flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{order.product?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{order.product?.category || "—"}</p>
                    {order.product?.price_per_day && (
                      <p className="text-xs text-slate-500">{formatRupiah(order.product.price_per_day)}/hari</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pihak terlibat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Penyewa</p>
                  <InfoRow label="Nama"  value={order.user?.name  || "—"} />
                  <div className="mt-1.5"><InfoRow label="Email" value={order.user?.email || "—"} /></div>
                  {order.user?.phone && <div className="mt-1.5"><InfoRow label="HP" value={order.user.phone} icon={Phone} /></div>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lender</p>
                  <InfoRow label="Nama"  value={order.lender?.name  || "—"} />
                  <div className="mt-1.5"><InfoRow label="Email" value={order.lender?.email || "—"} /></div>
                  {order.lender?.phone && <div className="mt-1.5"><InfoRow label="HP" value={order.lender.phone} icon={Phone} /></div>}
                </div>
              </div>

              {/* Ringkasan order */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ringkasan Sewa</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Jumlah Unit" value={`${order.quantity || 1} unit`} />
                  <InfoRow label="Durasi"      value={`${order.duration_days} hari`} />
                  <InfoRow label="Mulai"       value={order.start_date} />
                  <InfoRow label="Selesai"     value={order.end_date} />
                  {order.expected_return_date && <InfoRow label="Target Kembali" value={order.expected_return_date} />}
                  {order.actual_return_date   && <InfoRow label="Kembali Aktual" value={order.actual_return_date} />}
                  <InfoRow label="Metode Bayar" value={(order.payment_method || "—").toUpperCase()} />
                  <InfoRow label="Total"       value={<span className="font-bold text-blue-600">{formatRupiah(order.total_price)}</span>} />
                </div>
              </div>

              {/* Alamat */}
              {order.shipping_address && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Alamat Pengiriman
                  </p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-line">{order.shipping_address}</p>
                </div>
              )}

              {/* Foto serah-terima */}
              {(order.handover_photo_url || order.return_photo_url) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.handover_photo_url && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Foto Serah-Terima</p>
                      <a href={order.handover_photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.handover_photo_url} alt="handover" className="w-full h-44 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
                      </a>
                    </div>
                  )}
                  {order.return_photo_url && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Foto Pengembalian</p>
                      <a href={order.return_photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={order.return_photo_url} alt="return" className="w-full h-44 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {order.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Catatan</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-line">{order.notes}</p>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Dibuat: {new Date(order.created_at).toLocaleString("id-ID")}
              </p>
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

// ─── Admin Transactions ───────────────────────────────────────────────────────
export function AdminTransactions() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOrder, setDetailOrder]   = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await fetchAllTransactions(100);
      if (error) toast.error("Gagal memuat data transaksi.");
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line

  const STATUSES = ["all", "pending", "confirmed", "shipped", "active", "returned", "completed", "cancelled"];

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.lender?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar activePage="admin-transactions" />
        <main className="flex-1 lg:ml-64 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Transaksi</h1>
          <p className="text-slate-500 text-sm mb-6">Pantau seluruh transaksi penyewaan di platform.</p>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
                  placeholder="Cari ID, produk, penyewa, atau lender..." />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all">
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s === "all" ? "Semua status" : s}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {search || statusFilter !== "all" ? "Tidak ada transaksi yang cocok." : "Belum ada transaksi."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Penyewa</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Produk</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Lender</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{t.id.slice(0, 8)}…</td>
                        <td className="px-4 py-4 text-sm text-slate-700 font-medium hidden sm:table-cell">{t.user?.name || "—"}</td>
                        <td className="px-4 py-4 text-sm text-slate-600 hidden md:table-cell">{t.product?.name || "—"}</td>
                        <td className="px-4 py-4 text-sm text-slate-600 hidden lg:table-cell">{t.lender?.name || "—"}</td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">{formatRupiah(t.total_price)}</td>
                        <td className="px-4 py-4 text-center"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setDetailOrder(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <TransactionDetailModal
            open={!!detailOrder}
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
          />
        </main>
      </div>
    </PageTransition>
  );
}
