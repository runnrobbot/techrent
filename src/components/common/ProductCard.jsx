import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, MapPin, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatRupiah } from "../../lib/data";

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { navigate } = useAuth();
  const wishlisted = isInWishlist(product.id);

  // Sumber nama toko: stores join → fallback ke lender name
  const storeName = product.store?.store_name || product.lender?.name || "Toko";

  // Image fallback: jika image_url kosong, render placeholder
  const imgSrc = product.image_url || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.4 }}
      className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
      onClick={() => navigate("product-detail", { productId: product.id })}
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package className="w-12 h-12" />
          </div>
        )}

        {/* Wishlist toggle */}
        <button
          aria-label={wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm backdrop-blur-sm transition-all ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/80 text-slate-500 hover:text-red-500"
          }`}
          onClick={e => { e.stopPropagation(); toggleWishlist(product); }}
        >
          <Heart className="w-4 h-4" fill={wishlisted ? "currentColor" : "none"} />
        </button>

        {/* Low-stock badge */}
        {product.stock > 0 && product.stock <= 2 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">
            Sisa {product.stock}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 bg-slate-700 text-white text-[11px] font-bold px-2 py-1 rounded-full">
            Habis
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-1 mb-1.5">
          {product.rating > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-slate-600">{Number(product.rating).toFixed(1)}</span>
              <span className="text-xs text-slate-400">({product.review_count || 0})</span>
            </>
          ) : (
            <span className="text-xs text-slate-400">Belum ada ulasan</span>
          )}
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1 truncate max-w-[8rem]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{storeName}</span>
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 text-sm mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{product.description || "Tidak ada deskripsi"}</p>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Mulai dari</span>
            <span className="text-base font-bold text-blue-600">{formatRupiah(product.price_per_day)}</span>
            <span className="text-xs text-slate-400">/hari</span>
          </div>
          <button
            aria-label="Tambah ke keranjang"
            disabled={product.stock === 0}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
            onClick={e => { e.stopPropagation(); addToCart(product, { days: 1 }); }}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
