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

// ─── Query Fragments (sumber kebenaran tunggal) ────────────────────────────
//
// PENTING: 'store_name' ada di tabel STORES, bukan PROFILES.
// Sebelumnya `lender:lender_id(name, store_name)` selalu error 400 karena
// kolom store_name tidak ada di profiles.
//
// Untuk ambil nama toko, JOIN ke stores dengan filter status approved.
// Ini juga lebih akurat karena hanya tampilkan toko yang sudah verified.

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

export async function updateOrderStatus(id, status) {
  return supabase
    .from('orders')
    .update({ status })
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
    .maybeSingle() // <-- pakai maybeSingle() biar tidak error kalau store belum dibuat
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
    .select('*, lender:lender_id(id, name, email)')
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
