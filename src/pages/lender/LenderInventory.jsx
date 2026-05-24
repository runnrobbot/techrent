import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LenderSidebar, PageTransition, StatusBadge } from "../../components/common/Layout";
import { Plus, Search, Edit2, Trash2, Loader2, Package, Eye, X, ImageOff, CheckCircle, Upload } from "lucide-react";
import { useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { formatRupiah, CATEGORIES } from "../../lib/data";
import { supabase, deleteProduct, updateProduct } from "../../lib/supabase";

// ─── Kondisi sama persis dengan LenderAddProduct ─────────────────────────────
const CONDITIONS = ["Baru", "Sangat Baik", "Baik", "Cukup"];
const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

// ─── Preview Modal ───────────────────────────────────────────────────────────
function ProductPreviewModal({ open, product, onClose }) {
  if (!product) return null;

  const conditionColor = {
    "Baru": "bg-green-100 text-green-700",
    "Sangat Baik": "bg-blue-100 text-blue-700",
    "Baik": "bg-amber-100 text-amber-700",
    "Cukup": "bg-orange-100 text-orange-700",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Preview Produk</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image */}
              <div className="w-full h-52 rounded-2xl bg-slate-100 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs">Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{product.category}</span>
                  {product.condition && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conditionColor[product.condition] || "bg-slate-100 text-slate-600"}`}>
                      {product.condition}
                    </span>
                  )}
                  <StatusBadge status={product.status} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h2>
                {product.brand && <p className="text-sm text-slate-500 mb-3">{product.brand}</p>}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Harga/hari</p>
                    <p className="font-bold text-blue-600">{formatRupiah(product.price_per_day)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Stok</p>
                    <p className="font-bold text-slate-800">{product.stock} unit</p>
                  </div>
                  {product.rating > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">Rating</p>
                      <p className="font-bold text-amber-600">{Number(product.rating).toFixed(1)} ★</p>
                    </div>
                  )}
                  {product.price_per_week && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">Harga/minggu</p>
                      <p className="font-bold text-slate-800">{formatRupiah(product.price_per_week)}</p>
                    </div>
                  )}
                </div>
              </div>

              {product.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deskripsi</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}

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

              {product.reject_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Alasan Ditolak</p>
                  <p className="text-sm text-red-700">{product.reject_reason}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl">
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

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;

function EditProductModal({ open, product, onClose, onSaved }) {
  const toast = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  // Image state: existing URL (bisa di-remove) + file baru
  const [existingUrl, setExistingUrl] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);  // File object
  const [newImagePreview, setNewImagePreview] = useState(null); // blob URL

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        condition: product.condition || "Baik",
        description: product.description || "",
        price_per_day: product.price_per_day || "",
        price_per_week: product.price_per_week || "",
        stock: product.stock || 1,
      });
      setExistingUrl(product.image_url || null);
      setNewImageFile(null);
      setNewImagePreview(null);
    }
  }, [product]);

  // Cleanup blob URL saat unmount / ganti file
  useEffect(() => {
    return () => { if (newImagePreview) URL.revokeObjectURL(newImagePreview); };
  }, [newImagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.warning("File harus berupa gambar."); return; }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { toast.warning(`Ukuran foto maks. ${MAX_FILE_SIZE_MB}MB.`); return; }
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
    e.target.value = ""; // reset input
  };

  const removeImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setExistingUrl(null);
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const uploadNewImage = async () => {
    if (!newImageFile || !user?.id) return null;
    const ext = newImageFile.name.split(".").pop().toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(path, newImageFile, { cacheControl: "3600", upsert: false });
    if (uploadErr) {
      console.warn("[EditProductModal] upload error:", uploadErr.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(uploadData.path);
    return publicUrl;
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning("Nama produk wajib diisi."); return; }
    const pricePerDay = Number(form.price_per_day);
    if (!pricePerDay || pricePerDay <= 0) { toast.warning("Harga per hari harus lebih dari 0."); return; }

    setLoading(true);

    // Upload gambar baru jika ada
    let finalImageUrl = existingUrl; // null jika di-remove, existing URL jika tidak diubah
    if (newImageFile) {
      const uploaded = await uploadNewImage();
      if (uploaded) finalImageUrl = uploaded;
      // jika upload gagal, pertahankan existingUrl
    }

    const updates = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      condition: form.condition,
      description: form.description.trim() || null,
      price_per_day: pricePerDay,
      stock: Math.max(1, Number(form.stock) || 1),
      image_url: finalImageUrl,
    };
    const priceWeek = Number(form.price_per_week);
    if (priceWeek > 0) updates.price_per_week = priceWeek;

    const { data, error } = await updateProduct(product.id, updates);
    setLoading(false);

    if (error) {
      toast.error("Gagal menyimpan perubahan: " + error.message);
      return;
    }
    toast.success("Produk berhasil diperbarui.");
    onSaved(data);
    onClose();
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800">Edit Produk</h3>
              </div>
              <button onClick={onClose} disabled={loading} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ─── Image Section ─── */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Foto Produk</label>
                {(existingUrl || newImagePreview) ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={newImagePreview || existingUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      {/* Ganti foto */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow text-slate-600 hover:text-blue-600 transition-all text-xs font-medium flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Ganti
                      </button>
                      {/* Hapus foto */}
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={loading}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow text-slate-600 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {newImagePreview && (
                      <span className="absolute bottom-2 left-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Foto baru</span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
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

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Nama Produk <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="Nama produk" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Merek</label>
                <input value={form.brand} onChange={e => set("brand", e.target.value)} className={inputCls} placeholder="e.g. Apple" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Kategori</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                    {CATEGORIES.filter(c => c.id !== "all").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Kondisi</label>
                  <select value={form.condition} onChange={e => set("condition", e.target.value)} className={inputCls}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  className={`${inputCls} resize-none h-20`} placeholder="Deskripsi produk..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Harga/hari (Rp) <span className="text-red-500">*</span></label>
                  <input type="number" min={1} value={form.price_per_day} onChange={e => set("price_per_day", e.target.value)} className={inputCls} placeholder="450000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Harga/minggu (Rp)</label>
                  <input type="number" min={0} value={form.price_per_week} onChange={e => set("price_per_week", e.target.value)} className={inputCls} placeholder="Opsional" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Stok</label>
                  <input type="number" min={1} value={form.stock} onChange={e => set("stock", parseInt(e.target.value, 10) || 1)} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={onClose} disabled={loading}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSave} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LenderInventory() {
  const { navigate, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("lender_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error("[LenderInventory] load error:", error);
        toast.error("Gagal memuat produk.");
      }
      setProducts(data || []);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: "Hapus produk?",
      description: `"${product.name}" akan dihapus permanen dan tidak bisa dikembalikan.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(product.id);
    const { error } = await deleteProduct(product.id);
    if (error) {
      toast.error("Gagal menghapus produk: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success("Produk berhasil dihapus.");
    }
    setDeleting(null);
  };

  const handleSaved = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-inventory" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Inventaris Produk</h1>
            <button onClick={() => navigate("lender-add-product")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-sm w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4" /> Tambah Produk
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
                  placeholder="Cari produk..." />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? "Produk tidak ditemukan." : "Belum ada produk."}</p>
                {!search && <button onClick={() => navigate("lender-add-product")} className="text-blue-600 underline text-sm mt-1">Tambah produk pertama</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-3 text-left">Produk</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">Stok</th>
                      <th className="px-4 py-3 text-right hidden md:table-cell">Rating</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.category}{p.brand ? ` · ${p.brand}` : ""} · {formatRupiah(p.price_per_day)}/hari</p>
                          {p.reject_reason && <p className="text-xs text-red-500 mt-0.5 italic">Alasan: {p.reject_reason}</p>}
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-4 text-center text-sm text-slate-600 hidden md:table-cell">{p.stock} unit</td>
                        <td className="px-4 py-4 text-right text-sm text-slate-600 hidden md:table-cell">{p.rating > 0 ? `${Number(p.rating).toFixed(1)}★` : "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setPreviewProduct(p)} title="Preview"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditProduct(p)} title="Edit"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p)} disabled={deleting === p.id} title="Hapus"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40">
                              {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          />

          <EditProductModal
            open={!!editProduct}
            product={editProduct}
            onClose={() => setEditProduct(null)}
            onSaved={handleSaved}
          />
        </main>
      </div>
    </PageTransition>
  );
}