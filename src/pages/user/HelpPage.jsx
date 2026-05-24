import { useState } from "react";
import { motion } from "framer-motion";
import { UserNav, PageTransition } from "../../components/common/Layout";
import { MessageCircle, Phone, Mail } from "lucide-react";

const faqs = [
  { q: "Bagaimana cara menyewa perangkat?", a: "Cari perangkat yang kamu butuhkan, pilih durasi sewa, tambahkan ke keranjang, dan lakukan pembayaran. Perangkat akan dikirim dalam 1-2 jam." },
  { q: "Apa yang terjadi jika perangkat rusak?", a: "Setiap penyewaan dilindungi asuransi. Jika terjadi kerusakan yang bukan disebabkan oleh kelalaian pengguna, kamu tidak dikenakan biaya tambahan." },
  { q: "Apakah bisa perpanjang sewa?", a: "Ya! Kamu bisa memperpanjang masa sewa dari halaman tracking pesanan selama perangkat belum dipesan oleh pengguna lain." },
  { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami menerima transfer bank (BCA, BNI, Mandiri), e-wallet (GoPay, OVO, Dana), dan QRIS." },
  { q: "Bagaimana proses pengembalian perangkat?", a: "Jemput gratis akan dijadwalkan di hari terakhir masa sewa. Kamu tinggal siapkan perangkat dan kurir kami akan mengambilnya." },
  { q: "Berapa lama proses verifikasi akun?", a: "Verifikasi akun biasanya selesai dalam 30 menit di jam kerja (09.00 - 21.00)." },
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-10 py-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pusat Bantuan</h1>
          <p className="text-slate-500 mb-8">Ada pertanyaan? Kami siap membantu kamu.</p>

          {/* FAQ */}
          <h2 className="text-lg font-bold text-slate-800 mb-4">Pertanyaan Umum</h2>
          <div className="space-y-3 mb-8">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-all">
                  <span className="font-semibold text-sm text-slate-800 pr-4">{faq.q}</span>
                  <span className="text-slate-400 text-xl flex-shrink-0">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-5 pb-5">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Hubungi Kami</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, label: "Live Chat", desc: "Respons dalam 5 menit", action: "Chat Sekarang", color: "text-green-600 bg-green-50" },
                { icon: Phone, label: "Telepon", desc: "0800-123-456 (Gratis)", action: "Hubungi", color: "text-blue-600 bg-blue-50" },
                { icon: Mail, label: "Email", desc: "support@techrent.id", action: "Kirim Email", color: "text-purple-600 bg-purple-50" },
              ].map(({ icon: Icon, label, desc, action, color }, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl text-center">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">{desc}</p>
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-100 transition-all">{action}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
