import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Bell, Search, Menu, X, LogOut, User, Package, LayoutDashboard, Store, ChevronRight, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { useState } from "react";

// ── Helper: konfirmasi logout sebelum eksekusi ────────────────────────────
function useLogoutWithConfirm() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  return async () => {
    const ok = await confirm({
      title:        "Keluar dari akun?",
      description:  "Kamu akan keluar dari TechRent dan harus login ulang untuk mengakses akunmu.",
      confirmLabel: "Keluar",
      cancelLabel:  "Batal",
      variant:      "warning",
    });
    if (!ok) return;
    await logout();
    toast.info("Kamu sudah keluar dari akun.");
  };
}

export function UserNav() {
  const { profile, navigate } = useAuth();
  const { cartCount } = useCart();
  const handleLogout = useLogoutWithConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
        <button onClick={() => navigate("home")} className="font-bold text-2xl text-blue-600 tracking-tight flex-shrink-0">
          TechRent
        </button>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Cari laptop, kamera, console..."
          />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {[{ label: "Beranda", page: "home" }, { label: "Bantuan", page: "help" }].map(item => (
            <button key={item.page} onClick={() => navigate(item.page)}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => navigate("cart")} className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>

          {/* Bell / Notifikasi */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifikasi</h3>
                      <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-all">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                    <div className="py-10 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Belum ada notifikasi</p>
                      <p className="text-xs text-slate-400 mt-1">Notifikasi aktivitas akan muncul di sini</p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative ml-1">
            <button onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-blue-50 rounded-full transition-all">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {profile?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700">{profile?.name?.split(" ")[0] || "..."}</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <button onClick={() => { navigate("profile"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all">
                    <User className="w-4 h-4 text-blue-600" /> Profil Saya
                  </button>
                  <button onClick={() => { navigate("tracking"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all">
                    <Package className="w-4 h-4 text-blue-600" /> Pesanan Saya
                  </button>
                  <div className="border-t border-slate-100" />
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm outline-none" placeholder="Cari perangkat..." />
              </div>
              {[{ label: "Beranda", page: "home" }, { label: "Bantuan", page: "help" }, { label: "Profil", page: "profile" }, { label: "Pesanan", page: "tracking" }].map(item => (
                <button key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 rounded-lg transition-all">
                  {item.label}
                </button>
              ))}
              <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all">
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function AdminSidebar({ activePage }) {
  const { navigate, profile } = useAuth();
  const handleLogout = useLogoutWithConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { page: "admin-dashboard",       icon: LayoutDashboard, label: "Dashboard" },
    { page: "admin-products",        icon: Package,         label: "Approval Produk" },
    { page: "admin-stores",          icon: Store,           label: "Approval Toko" },
    { page: "admin-approved-stores", icon: Building2,       label: "Toko Aktif" },
    { page: "admin-users",           icon: User,            label: "Manajemen User" },
    { page: "admin-transactions",    icon: ShoppingCart,    label: "Transaksi" },
  ];

  const SidebarContent = ({ onNavigate }) => (
    <>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activePage === item.page;
          return (
            <button key={item.page} onClick={() => { navigate(item.page); onNavigate?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${active ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"} ${collapsed ? "justify-center" : ""}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-medium ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-sm z-50 transition-all duration-300 ${collapsed ? "w-16" : "w-64"} hidden lg:flex flex-col`}>
        <div className={`p-4 border-b border-slate-100 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && <span className="font-bold text-xl text-blue-600">TechRent</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
            <Menu className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {profile?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || "Admin"}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
        )}
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg text-blue-600">TechRent Admin</span>
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xl text-blue-600">TechRent</span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {profile?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || "Admin"}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                </div>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function LenderSidebar({ activePage }) {
  const { navigate, profile } = useAuth();
  const handleLogout = useLogoutWithConfirm();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { page: "lender-dashboard",   icon: LayoutDashboard, label: "Dashboard" },
    { page: "lender-inventory",   icon: Package,         label: "Inventaris" },
    { page: "lender-orders",      icon: ShoppingCart,    label: "Pesanan" },
    { page: "lender-store-setup", icon: Store,           label: "Profil Toko" },
  ];

  const SidebarContent = ({ onNavigate }) => (
    <>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activePage === item.page;
          return (
            <button key={item.page} onClick={() => { navigate(item.page); onNavigate?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${active ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 shadow-sm z-50 hidden lg:flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <span className="font-bold text-xl text-blue-600">TechRent</span>
          <p className="text-xs text-slate-500 mt-0.5">Lender Panel</p>
        </div>
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || "L"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || "Lender"}</p>
              <p className="text-xs text-slate-500">Lender</p>
            </div>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg text-blue-600">TechRent Lender</span>
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xl text-blue-600">TechRent</span>
                  <p className="text-xs text-slate-500">Lender Panel</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                    {profile?.name?.[0]?.toUpperCase() || "L"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || "Lender"}</p>
                    <p className="text-xs text-slate-500">Lender</p>
                  </div>
                </div>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StatusBadge({ status }) {
  const config = {
    approved:  { label: "Disetujui",     className: "bg-green-100 text-green-700" },
    pending:   { label: "Menunggu",      className: "bg-amber-100 text-amber-700" },
    rejected:  { label: "Ditolak",       className: "bg-red-100 text-red-700" },
    active:    { label: "Aktif",         className: "bg-blue-100 text-blue-700" },
    completed: { label: "Selesai",       className: "bg-slate-100 text-slate-600" },
    cancelled: { label: "Dibatalkan",    className: "bg-red-100 text-red-500" },
    confirmed: { label: "Dikonfirmasi",  className: "bg-indigo-100 text-indigo-700" },
    shipped:   { label: "Dikirim",       className: "bg-purple-100 text-purple-700" },
    returned:  { label: "Dikembalikan",  className: "bg-teal-100 text-teal-700" },
  };
  const cfg = config[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
