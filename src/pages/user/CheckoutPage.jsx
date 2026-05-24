import { useState } from "react";
import { motion } from "framer-motion";
import { UserNav, PageTransition } from "../../components/common/Layout";
import { MapPin, CreditCard, CheckCircle, ArrowLeft, Loader2, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import { createOrder } from "../../lib/supabase";

const PAYMENT_METHODS = [
  { id: "bca",   label: "BCA Virtual Account" },
  { id: "bni",   label: "BNI Virtual Account" },
  { id: "gopay", label: "GoPay" },
  { id: "ovo",   label: "OVO" },
  { id: "qris",  label: "QRIS" },
];

const INSURANCE_FEE = 25000;
const SERVICE_FEE   = 5000;

// Helper: hitung tanggal end_date relatif ke start_date + durasi
const computeEndDate = (startISO, days) => {
  const start = new Date(startISO);
  start.setDate(start.getDate() + (days - 1));
  return start.toISOString().split("T")[0];
};

const todayISO = () => new Date().toISOString().split("T")[0];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { navigate, profile } = useAuth();
  const toast = useToast();

  const [address,  setAddress]  = useState(profile?.address || "");
  const [phone,    setPhone]    = useState(profile?.phone || "");
  const [payment,  setPayment]  = useState("bca");
  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [orderId,  setOrderId]  = useState(null);

  const grandTotal = cartTotal + INSURANCE_FEE + SERVICE_FEE;

  const handleOrder = async () => {
    // ─── Validasi pre-flight ───
    if (!profile?.id) {
      toast.error("Sesi tidak valid. Silakan login ulang.");
      return;
    }
    if (!address.trim()) {
      toast.warning("Alamat pengiriman wajib diisi.");
      return;
    }
    if (cart.length === 0) {
      toast.warning("Keranjang masih kosong.");
      return;
    }

    setLoading(true);

    try {
      // ─── Buat order per item secara paralel ───
      // Field name HARUS snake_case match dengan schema DB.
      // Defensif: gunakan default value untuk semua field yang bisa null.
      const start = todayISO();

      const results = await Promise.all(
        cart.map(item => {
          const days     = item.days || 1;
          const quantity = item.quantity || 1;
          const pricePerDay = item.price_per_day || 0;

          return createOrder({
            user_id:          profile.id,
            lender_id:        item.lender_id,
            product_id:       item.id,
            quantity,
            duration_days:    days,
            start_date:       start,
            end_date:         computeEndDate(start, days),
            total_price:      pricePerDay * days * quantity,
            payment_method:   payment,
            shipping_address: address,
          });
        })
      );

      // ─── Cek apakah ada yang gagal ───
      const failed = results.find(r => r.error);
      if (failed) {
        console.error("[Checkout] createOrder error:", failed.error);
        throw new Error(failed.error.message);
      }

      const firstOrder = results[0]?.data;
      if (firstOrder?.id) setOrderId(firstOrder.id);

      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      setStep(2);
    } catch (err) {
      toast.error("Gagal membuat pesanan: " + (err.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ───
  if (step === 2) {
    return (
      <PageTransition>
        <UserNav />
        <main className="min-h-screen bg-slate-50 pt-20 pb-16 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full mx-4 text-center"
          >
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
              <motion.div
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pesanan Berhasil!</h2>
              <p className="text-slate-500 mb-2">
                Nomor pesanan:{" "}
                <span className="font-bold text-slate-800 font-mono">
                  {orderId ? orderId.slice(0, 8).toUpperCase() : "—"}
                </span>
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Perangkat akan dikirimkan dalam 1–2 jam setelah konfirmasi pembayaran.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("tracking")}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" /> Lacak Pesanan
                </button>
                <button
                  onClick={() => navigate("home")}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </PageTransition>
    );
  }

  // ─── Checkout Form ───
  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-6">
          <button
            onClick={() => navigate("cart")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
          </button>
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> Alamat Pengiriman
                </h3>
                <div className="space-y-3">
                  <input
                    value={profile?.name || ""}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Nama penerima"
                  />
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-20"
                    placeholder="Alamat lengkap, kelurahan, kecamatan, kota..."
                  />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="No. HP penerima (cth: 08123456789)"
                  />
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Metode Pembayaran
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                        payment === m.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-sm font-medium ${payment === m.id ? "text-blue-700" : "text-slate-700"}`}>
                        {m.label}
                      </span>
                      {payment === m.id && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4">Ringkasan</h3>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-600 mb-2">
                    <span className="truncate mr-2">{item.name} ({item.days || 1}h)</span>
                    <span className="flex-shrink-0">
                      {formatRupiah((item.price_per_day || 0) * (item.days || 1) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span><span>{formatRupiah(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Asuransi</span><span>{formatRupiah(INSURANCE_FEE)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Biaya layanan</span><span>{formatRupiah(SERVICE_FEE)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span><span>{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={loading || !address.trim() || cart.length === 0}
                  className="w-full mt-5 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                    : `Bayar ${formatRupiah(grandTotal)}`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}