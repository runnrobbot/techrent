import { createClient } from '@supabase/supabase-js'

// ─── Client Setup ──────────────────────────────────────────────────────────
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ─── Storage bucket constants ─────────────────────────────────────────────
// Sumber kebenaran tunggal — kalau bucket di Supabase berubah, ubah di sini.
export const STORAGE_BUCKETS = {
  PRODUCTS:  'products',   // foto produk (public)
  AVATARS:   'avatars',    // avatar user (public)
  DOCUMENTS: 'documents',  // KTP lender, dll (private, signed URL)
  HANDOVER:  'handover',   // bukti serah-terima barang (public)
}

// ─── Query Fragments (sumber kebenaran tunggal) ────────────────────────────
const PRODUCT_WITH_RELATIONS = `
  *,
  lender:lender_id ( id, name, avatar_url ),
  store:store_id   ( id, store_name, city )
`

const ORDER_WITH_RELATIONS = `
  *,
  product:product_id ( id, name, image_url, category ),
  user:user_id       ( id, name, email, phone )
`

const ORDER_FULL_RELATIONS = `
  *,
  product:product_id ( id, name, image_url, category, price_per_day ),
  user:user_id       ( id, name, email, phone, address ),
  lender:lender_id   ( id, name, email, phone )
`

// ─── Auth Helpers ──────────────────────────────────────────────────────────

export async function signUp(email, password, metadata = {}) {
  return supabase.auth.signUp({ email, password, options: { data: metadata } })
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function fetchProducts(filters = {}) {
  let query = supabase
    .from('products')
    .select(PRODUCT_WITH_RELATIONS)
    .eq('status', 'approved')

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.search)   query = query.ilike('name', `%${filters.search}%`)

  return query.order('created_at', { ascending: false })
}

export async function fetchProductById(id) {
  return supabase
    .from('products')
    .select(PRODUCT_WITH_RELATIONS)
    .eq('id', id)
    .single()
}

export async function fetchLenderProducts(lenderId) {
  return supabase
    .from('products')
    .select('*')
    .eq('lender_id', lenderId)
    .order('created_at', { ascending: false })
}

export async function createProduct(product) {
  return supabase
    .from('products')
    .insert([{ ...product, status: 'pending' }])
    .select()
    .single()
}

export async function updateProduct(id, updates) {
  return supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteProduct(id) {
  return supabase.from('products').delete().eq('id', id)
}

// ─── Product Stock (RPC) ───────────────────────────────────────────────────
// Decrement / increment dilakukan via stored function untuk:
//   1. Atomic (cek stok cukup + update dalam 1 transaksi)
//   2. Bypass RLS (user biasa tidak punya policy update di products)
// Lihat migration-2026-05-25.sql untuk definisi fungsinya.

export async function decrementProductStock(productId, quantity) {
  return supabase.rpc('decrement_product_stock', {
    p_product_id: productId,
    p_quantity:   quantity,
  })
}

export async function incrementProductStock(productId, quantity) {
  return supabase.rpc('increment_product_stock', {
    p_product_id: productId,
    p_quantity:   quantity,
  })
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function createOrder(order) {
  return supabase
    .from('orders')
    .insert([order])
    .select()
    .single()
}

export async function fetchOrdersByUser(userId) {
  return supabase
    .from('orders')
    .select(ORDER_WITH_RELATIONS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function fetchOrdersByLender(lenderId) {
  return supabase
    .from('orders')
    .select(ORDER_WITH_RELATIONS)
    .eq('lender_id', lenderId)
    .order('created_at', { ascending: false })
}

export async function fetchOrderById(id) {
  return supabase
    .from('orders')
    .select(ORDER_FULL_RELATIONS)
    .eq('id', id)
    .single()
}

export async function updateOrderStatus(id, status, extraFields = {}) {
  return supabase
    .from('orders')
    .update({ status, ...extraFields })
    .eq('id', id)
    .select()
    .single()
}

// ─── Stores ────────────────────────────────────────────────────────────────

export async function createStore(store) {
  return supabase
    .from('stores')
    .insert([{ ...store, status: 'pending' }])
    .select()
    .single()
}

export async function updateStore(id, updates) {
  return supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export async function fetchStoreByLender(lenderId) {
  return supabase
    .from('stores')
    .select('*')
    .eq('lender_id', lenderId)
    .maybeSingle()
}

// ─── Profile ───────────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

export async function updateProfile(id, updates) {
  return supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

// ─── Storage Helpers ──────────────────────────────────────────────────────

/**
 * Upload file ke bucket products.
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string|null>} public URL or null on failure
 */
export async function uploadProductImage(file, userId) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data: uploaded, error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKETS.PRODUCTS)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadErr) {
    console.warn('[uploadProductImage]', uploadErr.message)
    return null
  }
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.PRODUCTS)
    .getPublicUrl(uploaded.path)
  return publicUrl
}

/**
 * Upload foto bukti serah-terima.
 * @param {File} file
 * @param {string} orderId
 * @param {string} kind  'handover' | 'return'
 * @returns {Promise<string|null>}
 */
export async function uploadHandoverPhoto(file, orderId, kind = 'handover') {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `${orderId}/${kind}_${Date.now()}.${ext}`

  const { data: uploaded, error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKETS.HANDOVER)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadErr) {
    console.warn('[uploadHandoverPhoto]', uploadErr.message)
    return null
  }
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.HANDOVER)
    .getPublicUrl(uploaded.path)
  return publicUrl
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export async function fetchPendingProducts() {
  return supabase
    .from('products')
    .select(PRODUCT_WITH_RELATIONS)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
}

export async function approveProduct(id)         { return updateProduct(id, { status: 'approved' }) }
export async function rejectProduct(id, reason)  { return updateProduct(id, { status: 'rejected', reject_reason: reason }) }

export async function fetchPendingStores() {
  return supabase
    .from('stores')
    .select('*, lender:lender_id(id, name, email, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
}

export async function approveStore(id) {
  return supabase.from('stores').update({ status: 'approved' }).eq('id', id).select().single()
}

export async function rejectStore(id, reason) {
  return supabase.from('stores').update({ status: 'rejected', reject_reason: reason }).eq('id', id).select().single()
}

export async function fetchAllUsers() {
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function fetchAllTransactions(limit = 100) {
  return supabase
    .from('orders')
    .select(ORDER_FULL_RELATIONS)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function fetchAdminStats() {
  const [users, products, orders, stores] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('orders').select('id',   { count: 'exact', head: true }),
    supabase.from('stores').select('id',   { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  return {
    totalUsers:    users.count    || 0,
    totalProducts: products.count || 0,
    totalOrders:   orders.count   || 0,
    totalStores:   stores.count   || 0,
  }
}

/**
 * Helper untuk admin: ambil signed URL document (KTP) lender.
 * @param {string} path
 * @returns {Promise<string|null>}
 */
export async function getDocumentSignedUrl(path) {
  if (!path) return null
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .createSignedUrl(path, 60 * 60)
    if (error) throw error
    return data.signedUrl
  } catch (err) {
    console.warn('[getDocumentSignedUrl]', err.message)
    return null
  }
}
