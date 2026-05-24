import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Star, Laptop, Camera, Gamepad2, Plane, Headphones, Tablet, ChevronRight, Play, CheckCircle, Users, Award, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const features = [
  { icon: Shield, title: "Asuransi Penuh", desc: "Proteksi 100% untuk semua perangkat sewaan kamu.", color: "bg-blue-50 text-blue-600" },
  { icon: Clock, title: "Proses Cepat", desc: "Konfirmasi dalam 1 jam. Pengiriman hari yang sama.", color: "bg-purple-50 text-purple-600" },
  { icon: Star, title: "Produk Premium", desc: "Hanya perangkat berkualitas tinggi yang terverifikasi.", color: "bg-amber-50 text-amber-600" },
  { icon: Zap, title: "Teknologi Terbaru", desc: "Selalu update dengan gadget terkini di pasaran.", color: "bg-green-50 text-green-600" },
];

const categories = [
  { icon: Laptop, name: "Laptop", count: "120+ Unit" },
  { icon: Camera, name: "Kamera", count: "85+ Unit" },
  { icon: Gamepad2, name: "Gaming", count: "200+ Unit" },
  { icon: Plane, name: "Drone", count: "45+ Unit" },
  { icon: Headphones, name: "Audio", count: "160+ Unit" },
  { icon: Tablet, name: "Tablet", count: "95+ Unit" },
];

const stats = [
  { value: "10.000+", label: "Pengguna Aktif" },
  { value: "500+", label: "Perangkat Tersedia" },
  { value: "50+", label: "Kota di Indonesia" },
  { value: "4.9★", label: "Rating Rata-rata" },
];

export default function LandingPage() {
  const { navigate } = useAuth();

  return (
    <div className="min-h-screen bg-white font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <span className="font-bold text-2xl text-blue-600 tracking-tight">TechRent</span>
          <nav className="hidden md:flex items-center gap-6">
            {["Kategori", "Promo", "Tentang"].map(item => (
              <a key={item} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("login")} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              Masuk
            </button>
            <button onClick={() => navigate("register")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero */}
        <section className="relative px-5 md:px-10 py-16 md:py-28 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent -z-10 rounded-bl-[80px]" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl -z-10 opacity-60" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div className="space-y-7" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-sm font-semibold">
                <Award className="w-4 h-4" />
                #1 Platform Penyewaan Elektronik di Indonesia
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
                Sewa Perangkat Teknologi <span className="text-blue-600">Impian Anda</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                Laptop, kamera, drone, dan gaming device premium. Proses cepat, harga terjangkau, langsung ke pintu kamu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("register")}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 justify-center">
                  Mulai Sewa Sekarang <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 justify-center">
                  <Play className="w-5 h-5 text-blue-600" /> Lihat Cara Kerja
                </button>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {["B", "S", "A", "R"].map((l, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{l}</div>
                  ))}
                </div>
                <p className="text-sm text-slate-500"><span className="font-bold text-slate-800">10.000+</span> pengguna aktif</p>
              </div>
            </motion.div>

            <motion.div className="relative" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-100 border border-white/50">
                <img src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=700&q=80" alt="Tech Setup" className="w-full h-96 object-cover" />
              </div>
              <motion.div
                animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -bottom-5 -left-5 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Asuransi Full</p>
                  <p className="text-xs text-slate-500">Proteksi Gadget 100%</p>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -top-5 -right-5 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Terverifikasi</p>
                  <p className="text-xs text-slate-500">Semua Perangkat</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-blue-600 py-12">
          <div className="max-w-7xl mx-auto px-5 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-blue-200 text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-5 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Mengapa TechRent?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Layanan penyewaan perangkat teknologi dengan standar internasional yang bisa kamu andalkan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white border border-slate-200 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-5 md:px-10 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Kategori Perangkat</h2>
              <p className="text-slate-500">Ribuan pilihan perangkat teknologi premium siap disewa</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate("register")}
                    className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">{cat.name}</p>
                      <p className="text-xs text-slate-400">{cat.count}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-5 md:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-3xl scale-150" />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Siap Mulai Menyewa?</h2>
                <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">Bergabung dengan 10.000+ pengguna yang sudah menikmati kemudahan TechRent.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate("register")} className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-lg">
                    Daftar Sekarang — Gratis
                  </button>
                  <button onClick={() => navigate("login")} className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-2xl hover:bg-blue-800 transition-all border border-blue-500">
                    Sudah Punya Akun? Masuk
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Lender CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="mt-6 bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 text-sm font-semibold">Untuk Lender</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Jadilah Lender TechRent</h3>
                <p className="text-slate-400">Monetisasi gadget idle kamu dan raih penghasilan tambahan hingga jutaan rupiah per bulan.</p>
              </div>
              <button onClick={() => navigate("register")}
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-500 transition-all flex items-center gap-2 flex-shrink-0">
                Daftar Jadi Lender <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>© 2024 TechRent. Platform penyewaan elektronik terpercaya di Indonesia.</p>
      </footer>
    </div>
  );
}
