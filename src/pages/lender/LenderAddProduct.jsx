import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { LenderSidebar, PageTransition } from "../../components/common/Layout";
import { ArrowLeft, Plus, X, Loader2, CheckCircle, ImagePlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES } from "../../lib/data";
import { createProduct, uploadProductImage, fetchStoreByLender } from "../../lib/supabase";

// ─── Form constants ────────────────────────────────────────────────────────
const CONDITIONS = ["Baru", "Sangat Baik", "Baik", "Cukup"];

const INITIAL_FORM = {
  name:          "",
  category:      "",
  brand:         "",
  pricePerDay:   "",
  pricePerWeek:  "",
  stock:         1,
  description:   "",
  condition:     "Baik",
};

const INITIAL_SPECS = [""];

const MAX_IMAGES       = 5;
const MAX_FILE_SIZE_MB = 5;

export default function LenderAddProduct() {
  const { navigate, user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm]         = useState(INITIAL_FORM);
  const [specs, setSpecs]       = useState(INITIAL_SPECS);
  const [images, setImages]     = useState([]); // [{ file, preview }]
  const [storeId, setStoreId]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ─── Ambil store_id lender agar product bisa di-join dengan store ─────
  useEffect(() => {
    if (!user?.id) return;
    fetchStoreByLender(user.id).then(({ data }) => {
      if (data?.id) setStoreId(data.id);
    });
  }, [user?.id]);

  // ─── Setters ────────────────────────────────────────────────────────────
  const set        = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const addSpec    = ()     => setSpecs(prev => [...prev, ""]);
  const setSpec    = (i, v) => setSpecs(prev => prev.map((s, idx) => idx === i ? v : s));
  const removeSpec = (i)    => setSpecs(prev => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setSpecs(INITIAL_SPECS);
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setSubmitted(false);
  };

  // ─── Image handlers ──────────────────────────────────────────────────────
  const processFiles = (files) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.warning(`Maksimal ${MAX_IMAGES} foto.`);
      return;
    }
    const toAdd = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.warning(`File "${file.name}" bukan gambar, dilewati.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(`File "${file.name}" melebihi ${MAX_FILE_SIZE_MB}MB, dilewati.`);
        continue;
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) });
    }
    if (toAdd.length > 0) setImages(prev => [...prev, ...toAdd]);
  };

  const handleFileInput = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeImage = (i) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Sesi tidak valid, silakan login ulang.");
      return;
    }

    const pricePerDay = Number(form.pricePerDay);
    if (!pricePerDay || pricePerDay <= 0) {
      toast.warning("Harga per hari harus lebih dari 0.");
      return;
    }

    setLoading(true);

    // Upload gambar (gunakan helper terpusat — bucket di-handle di sana)
    const imageUrls = [];
    for (const { file } of images) {
      const url = await uploadProductImage(file, user.id);
      if (url) imageUrls.push(url);
    }

    if (images.length > 0 && imageUrls.length === 0) {
      setLoading(false);
      toast.error("Gagal mengupload foto produk. Cek koneksi atau coba lagi.");
      return;
    }

    const cleanSpecs = specs.map(s => s.trim()).filter(Boolean);

    const payload = {
      lender_id:     user.id,
      store_id:      storeId, // null jika lender belum setup toko
      name:          form.name.trim(),
      brand:         form.brand.trim() || null,
      category:      form.category,
      condition:     form.condition,
      description:   form.description.trim() || null,
      price_per_day: pricePerDay,
      stock:         Math.max(1, Number(form.stock) || 1),
      specs:         cleanSpecs,
    };

    if (imageUrls.length > 0) payload.image_url = imageUrls[0];

    const priceWeek = Number(form.pricePerWeek);
    if (priceWeek > 0) payload.price_per_week = priceWeek;

    const { error } = await createProduct(payload);

    setLoading(false);

    if (error) {
      console.error("[LenderAddProduct] createProduct error:", error);
      toast.error("Gagal mengajukan produk: " + error.message);
      return;
    }

    toast.success("Produk berhasil diajukan ke admin!");
    setSubmitted(true);
  };

  // ─── Success Screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <PageTransition>
        <div className="flex min-h-screen bg-slate-50">
          <LenderSidebar activePage="lender-inventory" />
          <main className="flex-1 lg:ml-60 flex items-center justify-center p-8 pt-20 lg:pt-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-sm"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Produk Diajukan!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Produk kamu sedang dalam review admin. Biasanya selesai dalam 1×24 jam.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all"
                >
                  Tambah Produk Lain
                </button>
                <button
                  onClick={() => navigate("lender-inventory")}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-all"
                >
                  Lihat Inventaris
                </button>
              </div>
            </motion.div>
          </main>
        </div>
      </PageTransition>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-inventory" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 pt-16 md:pt-16 lg:pt-8">
          <button
            onClick={() => navigate("lender-inventory")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Inventaris
          </button>
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Tambah Produk Baru</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
            Produk yang kamu ajukan akan diverifikasi oleh admin sebelum ditampilkan di marketplace.
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Info dasar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Informasi Dasar</h3>
                <div className="space-y-4">
                  <Field label="Nama Produk" required>
                    <input
                      value={form.name} onChange={e => set("name", e.target.value)} required
                      className={inputCls}
                      placeholder="e.g. MacBook Pro M3 Max"
                    />
                  </Field>
                  <Field label="Merek">
                    <input
                      value={form.brand} onChange={e => set("brand", e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Apple"
                    />
                  </Field>
                  <Field label="Kategori" required>
                    <select
                      value={form.category} onChange={e => set("category", e.target.value)} required
                      className={inputCls}
                    >
                      <option value="">Pilih kategori...</option>
                      {CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Kondisi">
                    <select
                      value={form.condition} onChange={e => set("condition", e.target.value)}
                      className={inputCls}
                    >
                      {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Deskripsi" required>
                    <textarea
                      value={form.description} onChange={e => set("description", e.target.value)} required
                      className={`${inputCls} resize-none h-24`}
                      placeholder="Deskripsikan produk secara detail..."
                    />
                  </Field>
                </div>
              </div>

              {/* Image upload */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">Foto Produk</h3>
                  <span className="text-xs text-slate-400">{images.length}/{MAX_IMAGES} foto</span>
                </div>

                {/* Thumbnails */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                        <img src={img.preview} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-medium">
                            Utama
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                {images.length < MAX_IMAGES && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <ImagePlus className={`w-7 h-7 mx-auto mb-2 ${dragOver ? "text-blue-500" : "text-slate-400"}`} />
                    <p className="text-sm font-medium text-slate-600">
                      {images.length === 0 ? "Klik atau drag & drop foto" : "Tambah foto lagi"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG / PNG · Maks. {MAX_FILE_SIZE_MB}MB per foto · Sisa {MAX_IMAGES - images.length} slot
                    </p>
                  </div>
                )}

                {images.length === MAX_IMAGES && (
                  <p className="text-xs text-amber-600 text-center mt-1">Batas {MAX_IMAGES} foto tercapai.</p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Harga */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Harga & Stok</h3>
                <div className="space-y-4">
                  <Field label="Harga Per Hari (Rp)" required>
                    <input
                      type="number" min={1}
                      value={form.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} required
                      className={inputCls}
                      placeholder="e.g. 450000"
                    />
                  </Field>
                  <Field label="Harga Per Minggu (Rp) — opsional">
                    <input
                      type="number" min={0}
                      value={form.pricePerWeek} onChange={e => set("pricePerWeek", e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 2800000 (kosongkan jika tidak ada diskon)"
                    />
                  </Field>
                  <Field label="Jumlah Stok">
                    <input
                      type="number" min={1}
                      value={form.stock}
                      onChange={e => set("stock", parseInt(e.target.value, 10) || 1)}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Stok akan otomatis berkurang saat ada penyewaan dan kembali saat barang dikembalikan.
                    </p>
                  </Field>
                </div>
              </div>

              {/* Spesifikasi */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">Spesifikasi</h3>
                  <button
                    type="button" onClick={addSpec}
                    className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={spec} onChange={e => setSpec(i, e.target.value)}
                        className={`flex-1 ${inputCls}`}
                        placeholder={`Spesifikasi ${i + 1}...`}
                      />
                      {specs.length > 1 && (
                        <button
                          type="button" onClick={() => removeSpec(i)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Mengajukan...</>
                  : "Ajukan Produk ke Admin"
                }
              </button>
            </div>
          </form>
        </main>
      </div>
    </PageTransition>
  );
}

// ─── Small reusable form bits ───────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
