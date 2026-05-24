import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Heart, ShoppingCart, Shield, CheckCircle, Clock, MapPin, Plus, Minus, Loader2 } from "lucide-react";
import { UserNav, PageTransition } from "../../components/common/Layout";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { fetchProductById } from "../../lib/supabase";
import { formatRupiah } from "../../lib/data";

export default function ProductDetailPage() {
  const { navigate, pageParams } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const toast = useToast();
  const [days, setDays] = useState(1);
  const [addedAnim, setAddedAnim] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!pageParams?.productId) {
        setError("Produk tidak ditemukan.");
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await fetchProductById(pageParams.productId);
      if (cancelled) return;
      if (error || !data) {
        console.error("[ProductDetail] error:", error);
        setError("Produk tidak ditemukan.");
      } else {
        setProduct(data);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [pageParams?.productId]);

  if (loading) return (
    <PageTransition>
      <UserNav />
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    </PageTransition>
  );

  if (error || !product) return (
    <PageTransition>
      <UserNav />
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <p>{error || "Produk tidak ditemukan."}</p>
        <button onClick={() => navigate("home")} className="text-blue-600 underline text-sm">Kembali</button>
      </div>
    </PageTransition>
  );

  const wishlisted = isInWishlist(product.id);
  const total = product.price_per_day * days;
  const specs = Array.isArray(product.specs) ? product.specs
    : typeof product.specs === "object" ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`)
    : [];

  const handleAddToCart = () => {
    addToCart(product, { days });
    setAddedAnim(true);
    toast.success(`${product.name} ditambahkan ke keranjang.`);
    setTimeout(() => setAddedAnim(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, { days });
    navigate("checkout");
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    if (wishlisted) {
      toast.info("Dihapus dari wishlist.");
    } else {
      toast.success("Ditambahkan ke wishlist.");
    }
  };

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-6">
          <button onClick={() => navigate("home")} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="w-full h-72 md:h-96 object-cover" />
                  : <div className="w-full h-72 md:h-96 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Tidak ada gambar</div>
                }
              </div>

              {product.description && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-3">Deskripsi Produk</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {specs.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Spesifikasi</h3>
                  <div className="space-y-2">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-slate-700">{Number(product.rating).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({product.review_count} ulasan)</span>
                        </div>
                      )}
                      <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
                      {product.lender?.store_name && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />{product.lender.store_name}
                        </p>
                      )}
                    </div>
                    <button onClick={handleToggleWishlist}
                      className={`p-2.5 rounded-xl border transition-all ${wishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:text-red-400"}`}>
                      <Heart className="w-5 h-5" fill={wishlisted ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 mb-5">
                    <p className="text-xs text-blue-600 font-medium mb-1">Harga per hari</p>
                    <p className="text-3xl font-bold text-blue-700">{formatRupiah(product.price_per_day)}</p>
                  </div>

                  <div className="mb-5">
                    <label className="text-sm font-semibold text-slate-700 block mb-3">Durasi Sewa</label>
                    <div className="flex items-center gap-4 justify-between bg-slate-50 rounded-2xl p-3">
                      <button onClick={() => setDays(Math.max(1, days - 1))}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition-all">
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-slate-900">{days}</span>
                        <span className="text-sm text-slate-500 ml-1">hari</span>
                      </div>
                      <button onClick={() => setDays(Math.min(30, days + 1))}
                        className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-slate-100 mb-5">
                    <span className="text-sm text-slate-500">Total ({days} hari)</span>
                    <span className="text-lg font-bold text-slate-900">{formatRupiah(total)}</span>
                  </div>

                  <div className="space-y-3">
                    <motion.button onClick={handleAddToCart}
                      animate={addedAnim ? { scale: [1, 0.95, 1] } : {}}
                      className={`w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${addedAnim ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"}`}>
                      <ShoppingCart className="w-5 h-5" />
                      {addedAnim ? "Ditambahkan!" : "Tambah ke Keranjang"}
                    </motion.button>
                    <button onClick={handleBuyNow}
                      className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 transition-all">
                      Sewa Sekarang
                    </button>
                  </div>
                </motion.div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                  <div className="space-y-3">
                    {[
                      { icon: Shield, label: "Asuransi perangkat tersedia", color: "text-blue-600" },
                      { icon: CheckCircle, label: `Kondisi: ${product.condition || "-"}`, color: "text-green-600" },
                      { icon: Clock, label: "Konfirmasi dalam 1 jam", color: "text-orange-500" },
                    ].map(({ icon: Icon, label, color }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                        <span className="text-sm text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
