import { useState, useRef, useEffect } from "react";
import { LenderSidebar, PageTransition } from "../../components/common/Layout";
import { Store, Upload, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase, fetchStoreByLender } from "../../lib/supabase";

export default function LenderStoreSetup() {
  const { profile, updateUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    storeName:   "",
    city:        "",
    description: "",
    phone:       profile?.phone || "",
    ktpNumber:   "",
    bankName:    "",
    bankAccount: "",
    bankHolder:  "",
  });

  const [ktpPath, setKtpPath]         = useState(null);
  const [ktpFile, setKtpFile]         = useState(null);
  const [ktpPreview, setKtpPreview]   = useState(null);
  const [ktpSignedUrl, setKtpSignedUrl] = useState(null);
  const [uploadingKtp, setUploadingKtp] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [storeData, setStoreData] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const getSignedUrl = async (path) => {
    if (!path) return null;
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    fetchStoreByLender(profile.id).then(async ({ data }) => {
      if (!data) return;
      setStoreData(data);
      setForm({
        storeName:   data.store_name   || "",
        city:        data.city         || "",
        description: data.description  || "",
        phone:       data.phone        || profile?.phone || "",
        ktpNumber:   data.ktp_number   || "",
        bankName:    data.bank_name    || "",
        bankAccount: data.bank_account || "",
        bankHolder:  data.bank_holder  || "",
      });
      if (data.ktp_url) {
        setKtpPath(data.ktp_url);
        const signed = await getSignedUrl(data.ktp_url);
        if (signed) setKtpSignedUrl(signed);
      }
    });
  }, [profile?.id]); // eslint-disable-line

  const handleKtpSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File KTP harus berupa gambar (JPG/PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }
    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
    toast.info("Foto KTP siap diunggah.");
  };

  const uploadKtp = async () => {
    if (!ktpFile || !profile?.id) return null;
    setUploadingKtp(true);
    try {
      const ext  = ktpFile.name.split(".").pop().toLowerCase();
      const path = `${profile.id}/ktp-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, ktpFile, {
          upsert:      true,
          contentType: ktpFile.type,
        });

      if (uploadError) throw uploadError;

      setKtpPath(path);
      const signed = await getSignedUrl(path);
      if (signed) setKtpSignedUrl(signed);
      return path;
    } catch (err) {
      toast.error("Gagal upload KTP: " + err.message);
      return null;
    } finally {
      setUploadingKtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeName.trim()) {
      toast.warning("Nama toko wajib diisi.");
      return;
    }
    setLoading(true);

    try {
      let finalKtpPath = ktpPath;
      if (ktpFile) {
        finalKtpPath = await uploadKtp();
        if (!finalKtpPath) { setLoading(false); return; }
      }

      const payload = {
        lender_id:    profile.id,
        store_name:   form.storeName,
        city:         form.city,
        description:  form.description,
        phone:        form.phone,
        ktp_number:   form.ktpNumber,
        ktp_url:      finalKtpPath || null,
        bank_name:    form.bankName,
        bank_account: form.bankAccount,
        bank_holder:  form.bankHolder,
      };

      let result;
      if (storeData?.id) {
        result = await supabase
          .from("stores").update(payload).eq("id", storeData.id).select().single();
      } else {
        result = await supabase
          .from("stores").insert([{ ...payload, status: "pending" }]).select().single();
      }

      if (result.error) throw result.error;

      setStoreData(result.data);
      setKtpFile(null);
      setSaved(true);
      updateUser({ store_name: form.storeName });
      toast.success(storeData?.id ? "Data toko berhasil diperbarui." : "Toko berhasil diajukan ke admin!");
    } catch (err) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearKtp = () => {
    setKtpFile(null);
    setKtpPreview(null);
    setKtpPath(null);
    setKtpSignedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isApproved = storeData?.status === "approved";
  const isPending  = storeData?.status === "pending" || saved;
  const ktpDisplay = ktpPreview || ktpSignedUrl;

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50">
        <LenderSidebar activePage="lender-store-setup" />
        <main className="flex-1 lg:ml-60 p-5 md:p-8 max-w-4xl pt-16 md:pt-16 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil Toko</h1>
          <p className="text-slate-500 text-sm mb-6">Lengkapi informasi toko kamu untuk bisa mulai berjualan di TechRent.</p>

          {isApproved ? (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">Toko kamu sudah aktif dan terverifikasi!</p>
            </div>
          ) : isPending ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-amber-800">Pengajuan Toko Sedang Direview</p>
                <p className="text-xs mt-0.5 text-amber-600">Admin kami akan memverifikasi toko kamu dalam 1×24 jam kerja.</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-800">Lengkapi Data Toko</p>
                <p className="text-xs mt-0.5 text-blue-600">Lengkapi semua data dan ajukan ke admin untuk mulai berjualan.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom kiri */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" /> Informasi Toko
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Nama Toko",         key: "storeName", placeholder: "e.g. Gadget Pro Store" },
                    { label: "Kota",              key: "city",      placeholder: "e.g. Jakarta Selatan" },
                    { label: "No. WhatsApp Toko", key: "phone",     placeholder: "e.g. 08123456789" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">{f.label}</label>
                      <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Deskripsi Toko</label>
                    <textarea value={form.description} onChange={e => set("description", e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all resize-none h-24"
                      placeholder="Ceritakan tentang toko dan layanan kamu..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom kanan */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Verifikasi Identitas</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">No. KTP</label>
                    <input value={form.ktpNumber} onChange={e => set("ktpNumber", e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      placeholder="16 digit no. KTP" maxLength={16} />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Foto KTP</label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleKtpSelect} />

                    {ktpDisplay ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img src={ktpDisplay} alt="KTP Preview" className="w-full h-36 object-cover" />
                        <button type="button" onClick={clearKtp}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                          <p className="text-white text-xs truncate">{ktpFile ? ktpFile.name : "KTP tersimpan"}</p>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                        {uploadingKtp
                          ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-1" />
                          : <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mx-auto mb-1 transition-colors" />
                        }
                        <p className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                          {uploadingKtp ? "Mengupload..." : "Klik untuk upload foto KTP"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG — maks. 5MB</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Rekening Bank</h3>
                <div className="space-y-4">
                  {[
                    { label: "Nama Bank",            key: "bankName",    placeholder: "e.g. BCA" },
                    { label: "No. Rekening",          key: "bankAccount", placeholder: "e.g. 1234567890" },
                    { label: "Nama Pemilik Rekening", key: "bankHolder",  placeholder: "Sesuai nama di buku tabungan" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">{f.label}</label>
                      <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || uploadingKtp}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                  : isApproved ? "Simpan Perubahan" : "Ajukan Toko ke Admin"
                }
              </button>
            </div>
          </form>
        </main>
      </div>
    </PageTransition>
  );
}
