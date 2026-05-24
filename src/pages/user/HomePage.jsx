import { useState, useEffect, useRef } from "react";
import { Flame, Loader2, PackageOpen, AlertCircle } from "lucide-react";
import { UserNav, PageTransition } from "../../components/common/Layout";
import ProductCard from "../../components/common/ProductCard";
import { CATEGORIES } from "../../lib/data";
import { fetchProducts } from "../../lib/supabase";
import { useToast } from "../../context/ToastContext";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const toast = useToast();

  // Cegah race condition saat user cepat ganti kategori
  const requestIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const filters = activeCategory !== "all" ? { category: activeCategory } : {};
      const { data, error: err } = await fetchProducts(filters);

      // Abaikan response dari request yang sudah outdated
      if (cancelled || reqId !== requestIdRef.current) return;

      if (err) {
        console.error("[HomePage] fetchProducts error:", err);
        setError(err.message || "Gagal memuat produk.");
        setProducts([]);
        // Toast hanya sekali, bukan setiap re-render
        toast.error("Gagal memuat produk. Coba lagi.");
      } else {
        // data: [] (empty) BUKAN error — biarkan empty-state UI yang handle
        setProducts(data || []);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = () => {
    // Trigger refetch dengan increment req id manual
    setActiveCategory(prev => prev); // tidak trigger karena nilai sama
    // Solusi: panggil ulang via dummy state — atau pakai pattern terpisah:
    requestIdRef.current++; // invalidate
    setError(null);
    setLoading(true);
    fetchProducts(activeCategory !== "all" ? { category: activeCategory } : {})
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message || "Gagal memuat produk.");
          toast.error("Gagal memuat produk. Coba lagi.");
        } else {
          setProducts(data || []);
        }
        setLoading(false);
      });
  };

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-12">
        {/* Categories */}
        <section className="px-4 md:px-10 max-w-7xl mx-auto pt-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800">Kategori</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="px-4 md:px-10 max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Produk Tersedia
              </h2>
              <p className="text-sm text-slate-500">Gadget & elektronik siap disewa</p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Error state — hanya muncul jika benar-benar error dari server */}
          {!loading && error && (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-3 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">Tidak dapat memuat produk</p>
              <p className="text-sm text-slate-500 mb-3">Terjadi kesalahan saat mengambil data.</p>
              <button onClick={retry} className="text-blue-600 text-sm font-medium hover:underline">
                Coba lagi
              </button>
            </div>
          )}

          {/* Empty state — bukan error, produk memang belum ada */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                <PackageOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">Belum Ada Produk</p>
              <p className="text-sm text-slate-500">
                {activeCategory === "all"
                  ? "Belum ada produk yang tersedia saat ini."
                  : "Belum ada produk di kategori ini. Coba kategori lain."}
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </PageTransition>
  );
}
