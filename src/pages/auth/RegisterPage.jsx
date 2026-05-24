import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register, navigate, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <span className="font-bold text-3xl text-white tracking-tight relative">TechRent</span>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">Bergabung dengan<br />10.000+ Pengguna 🚀</h2>
          <p className="text-slate-300 text-lg">Nikmati akses ke ratusan perangkat teknologi premium. Daftar gratis, mulai sewa hari ini.</p>
          <div className="space-y-3">
            {["✓ Proses verifikasi cepat", "✓ Asuransi perangkat lengkap", "✓ Support 24/7", "✓ Pembayaran fleksibel"].map(item => (
              <p key={item} className="text-blue-200 flex items-center gap-2 text-sm">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <button onClick={() => navigate("login")} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Buat Akun Baru</h1>
            <p className="text-slate-500">Sudah punya akun? <button onClick={() => navigate("login")} className="text-blue-600 font-semibold hover:underline">Masuk sekarang</button></p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-700 block mb-2">Daftar sebagai</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: "user", label: "Penyewa", desc: "Sewa perangkat" }, { value: "lender", label: "Lender", desc: "Sewakan perangkat" }].map(opt => (
                <button key={opt.value} type="button" onClick={() => set("role", opt.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.role === opt.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <p className={`font-semibold text-sm ${form.role === opt.value ? "text-blue-700" : "text-slate-700"}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Nama kamu" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="nama@email.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} required minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Min. 6 karakter" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">Dengan mendaftar, kamu menyetujui <a className="text-blue-600 hover:underline">Syarat & Ketentuan</a> dan <a className="text-blue-600 hover:underline">Kebijakan Privasi</a> TechRent.</p>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...</> : "Daftar Sekarang"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
