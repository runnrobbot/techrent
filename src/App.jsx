import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// User Pages
import HomePage from "./pages/user/HomePage";
import ProductDetailPage from "./pages/user/ProductDetailPage";
import CartPage from "./pages/user/CartPage";
import CheckoutPage from "./pages/user/CheckoutPage";
import TrackingPage from "./pages/user/TrackingPage";
import ProfilePage from "./pages/user/ProfilePage";
import HelpPage from "./pages/user/HelpPage";

// Lender Pages
import LenderDashboard from "./pages/lender/LenderDashboard";
import LenderInventory from "./pages/lender/LenderInventory";
import LenderAddProduct from "./pages/lender/LenderAddProduct";
import LenderOrders from "./pages/lender/LenderOrders";
import LenderStoreSetup from "./pages/lender/LenderStoreSetup";

// Admin Pages
import { AdminProducts, AdminStores, AdminUsers, AdminTransactions, AdminApprovedStores } from "./pages/admin/AdminProducts";
import AdminDashboard from "./pages/admin/AdminDashboard";

function AppRouter() {
  const { user, profile, loading, currentPage } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (currentPage === "login")    return <LoginPage />;
    if (currentPage === "register") return <RegisterPage />;
    if (currentPage === "landing")  return <LandingPage />;

    if (!user || !profile) return <LandingPage />;

    if (profile.role === "admin") {
      if (currentPage === "admin-dashboard")       return <AdminDashboard />;
      if (currentPage === "admin-products")        return <AdminProducts />;
      if (currentPage === "admin-stores")          return <AdminStores />;
      if (currentPage === "admin-approved-stores") return <AdminApprovedStores />;
      if (currentPage === "admin-users")           return <AdminUsers />;
      if (currentPage === "admin-transactions")    return <AdminTransactions />;
      return <AdminDashboard />;
    }

    if (profile.role === "lender") {
      if (currentPage === "lender-dashboard")   return <LenderDashboard />;
      if (currentPage === "lender-inventory")   return <LenderInventory />;
      if (currentPage === "lender-add-product") return <LenderAddProduct />;
      if (currentPage === "lender-orders")      return <LenderOrders />;
      if (currentPage === "lender-store-setup") return <LenderStoreSetup />;
      return <LenderDashboard />;
    }

    if (profile.role === "user") {
      if (currentPage === "home")           return <HomePage />;
      if (currentPage === "product-detail") return <ProductDetailPage />;
      if (currentPage === "cart")           return <CartPage />;
      if (currentPage === "checkout")       return <CheckoutPage />;
      if (currentPage === "tracking")       return <TrackingPage />;
      if (currentPage === "profile")        return <ProfilePage />;
      if (currentPage === "help")           return <HelpPage />;
      return <HomePage />;
    }

    return <LandingPage />;
  };

  return (
    <AnimatePresence mode="wait">
      {renderPage()}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
