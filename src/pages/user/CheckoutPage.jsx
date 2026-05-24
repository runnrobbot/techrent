import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserNav, PageTransition } from "../../components/common/Layout";
import { MapPin, CreditCard, CheckCircle, ArrowLeft, Loader2, Package, QrCode, Copy, Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatRupiah } from "../../lib/data";
import { createOrder, decrementProductStock } from "../../lib/supabase";

// ─── Payment methods ──────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: "qris",  label: "QRIS",                kind: "qris" },
  { id: "bca",   label: "BCA Virtual Account", kind: "va"   },
  { id: "bni",   label: "BNI Virtual Account", kind: "va"   },
  { id: "gopay", label: "GoPay",               kind: "ewallet" },
  { id: "ovo",   label: "OVO",                 kind: "ewallet" },
];

const INSURANCE_FEE = 25000;
const SERVICE_FEE   = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];

const computeEndDate = (startISO, days) => {
  const start = new Date(startISO);
  start.setDate(start.getDate() + (days - 1));
  return start.toISOString().split("T")[0];
};

// Generate dummy QRIS payload (format mirip EMVCo QRIS, tapi data dummy)
const generateDummyQrisPayload = (amount, orderRef) => {
  // Format dummy yang readable. Real QRIS pakai TLV EMVCo standar.
  return `00020101021126570011ID.DANA.WWW011893600911000000000002150006A01234560303UMI51440014ID.CO.QRIS.WWW0215ID10210000000010303UMI5204481253033605802ID5916TECHRENT DUMMY M6007JAKARTA6105121906304${(orderRef || "DEMO").slice(0, 8).toUpperCase()}AMOUNT${amount}`;
};

// ─── QRIS Modal ────────────────────────────────────────────────────────────
function QrisPaymentModal({ open, amount, orderRef, onClose, onConfirm, processing }) {
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => generateDummyQrisPayload(amount, orderRef), [amount, orderRef]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {/* ignore */}
  };

  // QR placeholder — kotak-kotak random tapi deterministik dari payload
  const qrCells = useMemo(() => {
    const seed = [...payload].reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 21 * 21 }, (_, i) => {
      const v = (i * 9301 + 49297 + seed) % 233280;
      return v / 233280 > 0.5;
    });
  }, [payload]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-lg">Pembayaran QRIS</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">Scan QR di bawah dengan aplikasi e-wallet manapun</p>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-4">
              <div className="bg-white rounded-xl p-4 mx-auto" style={{ width: 220, height: 220 }}>
                <div className="grid w-full h-full" style={{ gridTemplateColumns: "repeat(21, 1fr)", gridTemplateRows: "repeat(21, 1fr)" }}>
                  {qrCells.map((black, i) => (
                    <div key={i} className={black ? "bg-slate-900" : "bg-transparent"} />
                  ))}
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-xs text-slate-500">Jumlah pembayaran</p>
                <p className="text-2xl font-bold text-blue-700">{formatRupiah(amount)}</p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition-all mb-4"
            >
              {copied ? <><Check className="w-4 h-4 text-green-600" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin kode QRIS</>}
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Mode Demo:</strong> Ini adalah QRIS dummy untuk simulasi. Klik "Saya Sudah Bayar" untuk lanjut.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} disabled={processing}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200 transition-all disabled:opacity-50">
                Batal
              </button>
              <button onClick={onConfirm} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Saya Sudah Bayar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { navigate, profile }          = useAuth();
  const toast                          = useToast();

  const [address,  setAddress]  = useState(profile?.address || "");
  const [phone,    setPhone]    = useState(profile?.phone || "");
  const [payment,  setPayment]  = useState("qris");
  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [orderId,  setOrderId]  = useState(null);
  const [qrisOpen, setQrisOpen] = useState(false);

  const grandTotal = cartTotal + INSURANCE_FEE + SERVICE_FEE;

  // ─── Buat order + decrement stock per item ─────────────────────────────
  const finalizeOrder = async () => {
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
      const start = todayISO();

      // 1. Buat semua order paralel
      const results = await Promise.all(
        cart.map(item => {
          const days        = item.days     || 1;
          const quantity    = item.quantity || 1;
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

      const failed = results.find(r => r.error);
      if (failed) {
        console.error("[Checkout] createOrder error:", failed.error);
        throw new Error(failed.error.message);
      }

      // 2. Decrement stock — best effort. Kalau gagal jangan rollback order
      //    (orang sudah bayar), tapi log untuk admin/lender review manual.
      await Promise.all(
        cart.map(item =>
          decrementProductStock(item.id, item.quantity || 1)
            .then(({ error }) => {
              if (error) console.warn("[Checkout] stock decrement warn:", item.id, error.message);
            })
        )
      );

      const firstOrder = results[0]?.data;
      if (firstOrder?.id) setOrderId(firstOrder.id);

      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      setQrisOpen(false);
      setStep(2);
    } catch (err) {
      toast.error("Gagal membuat pesanan: " + (err.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // ─── Tombol Bayar ──────────────────────────────────────────────────────
  const handlePayClick = () => {
    if (!profile?.id || !address.trim() || cart.length === 0) {
      if (!address.trim()) toast.warning("Alamat pengiriman wajib diisi.");
      return;
    }
    // QRIS → buka modal dummy
    if (payment === "qris") {
      setQrisOpen(true);
      return;
    }
    // Non-QRIS → langsung finalize
    finalizeOrder();
  };

  // ─── Success Screen ────────────────────────────────────────────────────
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

  // ─── Checkout Form ─────────────────────────────────────────────────────
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
                      {m.kind === "qris" && <QrCode className={`w-5 h-5 ${payment === m.id ? "text-blue-600" : "text-slate-400"}`} />}
                      {m.kind === "va"   && <CreditCard className={`w-5 h-5 ${payment === m.id ? "text-blue-600" : "text-slate-400"}`} />}
                      {m.kind === "ewallet" && <span className={`w-5 h-5 text-center text-xs font-bold ${payment === m.id ? "text-blue-600" : "text-slate-400"}`}>e</span>}
                      <span className={`text-sm font-medium ${payment === m.id ? "text-blue-700" : "text-slate-700"}`}>
                        {m.label}
                      </span>
                      {m.id === "qris" && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 font-semibold rounded">DEMO</span>
                      )}
                      {payment === m.id && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                    </button>
                  ))}
                </div>
                {payment === "qris" && (
                  <p className="text-xs text-slate-500 mt-3">
                    Setelah klik bayar, QR code akan ditampilkan untuk di-scan dengan e-wallet apapun.
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4">Ringkasan</h3>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-600 mb-2">
                    <span className="truncate mr-2">
                      {item.name} ({item.quantity || 1}×{item.days || 1}h)
                    </span>
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
                  onClick={handlePayClick}
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

      <QrisPaymentModal
        open={qrisOpen}
        amount={grandTotal}
        orderRef={profile?.id}
        onClose={() => !loading && setQrisOpen(false)}
        onConfirm={finalizeOrder}
        processing={loading}
      />
    </PageTransition>
  );
}
