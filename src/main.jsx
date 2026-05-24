import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode sengaja dihapus — React StrictMode menjalankan useEffect DUA KALI
// di development, menyebabkan konflik dengan Supabase auth subscription.
createRoot(document.getElementById('root')).render(<App />)
