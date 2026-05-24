// Format currency helper — satu-satunya yang tersisa dari file ini
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Daftar kategori produk (statis, bukan data dari DB)
export const CATEGORIES = [
  { id: "all",     name: "Semua",   icon: "apps" },
  { id: "Laptop",  name: "Laptop",  icon: "laptop" },
  { id: "Kamera",  name: "Kamera",  icon: "photo_camera" },
  { id: "Gaming",  name: "Gaming",  icon: "sports_esports" },
  { id: "Drone",   name: "Drone",   icon: "flight" },
  { id: "Audio",   name: "Audio",   icon: "headphones" },
  { id: "Tablet",  name: "Tablet",  icon: "tablet" },
];
