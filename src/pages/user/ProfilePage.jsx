import { useState } from "react";
import { UserNav, PageTransition } from "../../components/common/Layout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, navigate, logout, updateUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:    profile?.name    || "",
    phone:   profile?.phone   || "",
    address: profile?.address || "",
  });

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Sesi tidak valid. Silakan login ulang.");
      return;
    }
    if (!form.name.trim()) {
      toast.warning("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    const updates = {
      name:    form.name.trim(),
      phone:   form.phone.trim() || null,
      address: form.address.trim() || null,
    };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (error) {
      console.error("[Profile] save error:", error);
      toast.error("Gagal menyimpan profil: " + error.message);
    } else {
      updateUser(updates);
      setEditing(false);
      toast.success("Profil berhasil diperbarui.");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title:        "Keluar dari akun?",
      description:  "Kamu akan keluar dari TechRent dan harus login ulang nanti.",
      confirmLabel: "Keluar",
      cancelLabel:  "Batal",
      variant:      "warning",
    });
    if (!ok) return;
    await logout();
  };

  const displayProfile = { ...profile, ...form };

  return (
    <PageTransition>
      <UserNav />
      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-10 py-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil Saya</h1>
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(displayProfile?.name || user?.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{displayProfile?.name || "—"}</h2>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">{profile?.role || "user"}</span>
                </div>
                <button onClick={() => setEditing(!editing)} className="ml-auto px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all">
                  {editing ? "Batal" : "Edit"}
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Nama Lengkap", key: "name",    type: "text" },
                  { label: "No. HP",       key: "phone",   type: "tel" },
                  { label: "Alamat",       key: "address", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{f.label}</label>
                    {editing ? (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                    ) : (
                      <p className="text-sm text-slate-800 py-2">{displayProfile[f.key] || "—"}</p>
                    )}
                  </div>
                ))}
                {editing && (
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Perubahan
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {[
                { label: "Pesanan Saya", desc: "Lihat dan lacak semua pesanan", page: "tracking" },
                { label: "Bantuan",      desc: "FAQ dan hubungi support",        page: "help" },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate(item.page)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0 text-left">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center p-4 hover:bg-red-50 transition-all text-left text-red-500 text-sm font-medium">
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
