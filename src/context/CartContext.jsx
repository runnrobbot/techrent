import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const CartContext = createContext(null);

// ─── Keys untuk localStorage (cart & wishlist persist antar refresh) ──────
const CART_KEY     = "techrent:cart";
const WISHLIST_KEY = "techrent:wishlist";

// ─── Load/save helpers — defensive parsing supaya tidak crash kalau corrupt ─
const loadFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
};

export function CartProvider({ children }) {
  // Hydrate dari localStorage sekali saat init
  const [cart,     setCart]     = useState(() => loadFromStorage(CART_KEY));
  const [wishlist, setWishlist] = useState(() => loadFromStorage(WISHLIST_KEY));

  // Persist setiap perubahan
  useEffect(() => { saveToStorage(CART_KEY,     cart);     }, [cart]);
  useEffect(() => { saveToStorage(WISHLIST_KEY, wishlist); }, [wishlist]);

  // ─── Cart actions ──────────────────────────────────────────────────────
  //
  // PENTING: simpan HANYA field yang dibutuhkan ke cart, dan SIMPAN APA
  // ADANYA dari DB (snake_case). Jangan mix camelCase/snake_case lagi.
  // Field yang dipakai UI: id, name, image_url, price_per_day,
  //                        lender_id, store?.store_name, stock
  //
  // Field cart-specific: quantity, days, startDate, endDate

  const addToCart = useCallback((product, rentOptions = {}) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: (i.quantity || 1) + 1, ...rentOptions }
            : i
        );
      }
      // Simpan slice dari product agar tidak menyimpan blob besar di localStorage
      const slim = {
        id:            product.id,
        name:          product.name,
        image_url:     product.image_url,
        price_per_day: product.price_per_day,
        lender_id:     product.lender_id,
        store_name:    product.store?.store_name || product.lender?.name || "",
        stock:         product.stock,
      };
      return [...prev, { ...slim, quantity: 1, days: 1, ...rentOptions }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateCartItem = useCallback((id, updates) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ─── Wishlist actions ──────────────────────────────────────────────────
  const toggleWishlist = useCallback((product) => {
    setWishlist(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.filter(i => i.id !== product.id);
      // Simpan slim juga untuk wishlist
      return [...prev, {
        id:            product.id,
        name:          product.name,
        image_url:     product.image_url,
        price_per_day: product.price_per_day,
        lender_id:     product.lender_id,
        store_name:    product.store?.store_name || product.lender?.name || "",
      }];
    });
  }, []);

  const isInWishlist = useCallback((id) => wishlist.some(i => i.id === id), [wishlist]);

  // ─── Derived state (memoized) ──────────────────────────────────────────
  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + (i.quantity || 1), 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce(
      (s, i) => s + ((i.price_per_day || 0) * (i.days || 1) * (i.quantity || 1)),
      0
    ),
    [cart]
  );

  const value = useMemo(() => ({
    cart, wishlist,
    addToCart, removeFromCart, updateCartItem, clearCart,
    toggleWishlist, isInWishlist,
    cartCount, cartTotal,
  }), [cart, wishlist, addToCart, removeFromCart, updateCartItem, clearCart, toggleWishlist, isInWishlist, cartCount, cartTotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
