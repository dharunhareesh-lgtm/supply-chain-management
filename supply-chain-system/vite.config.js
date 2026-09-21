import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8082', changeOrigin: true },
      '/suppliers': { target: 'http://localhost:8082', changeOrigin: true },
      '/products': { target: 'http://localhost:8082', changeOrigin: true },
      '/packaging-standards': { target: 'http://localhost:8082', changeOrigin: true },
      '/warehouse-locations': { target: 'http://localhost:8082', changeOrigin: true },
      '/category-capacity': { target: 'http://localhost:8082', changeOrigin: true },
      '/orders': { target: 'http://localhost:8082', changeOrigin: true },
      '/inventory': { target: 'http://localhost:8082', changeOrigin: true },
      '/managers': { target: 'http://localhost:8082', changeOrigin: true },
      '/deliveries': { target: 'http://localhost:8082', changeOrigin: true },
      '/insurance-policies': { target: 'http://localhost:8082', changeOrigin: true },
      '/insurance-claims': { target: 'http://localhost:8082', changeOrigin: true },
      '/warehouse-settings': { target: 'http://localhost:8082', changeOrigin: true },
      '/warehouse-partnerships': { target: 'http://localhost:8082', changeOrigin: true },
      '/warehouse-finance': { target: 'http://localhost:8082', changeOrigin: true },
      '/supplier-finance': { target: 'http://localhost:8082', changeOrigin: true },
      '/logistics': { target: 'http://localhost:8082', changeOrigin: true },
      '/logistics-companies': { target: 'http://localhost:8082', changeOrigin: true },
      '/logistics-vehicles': { target: 'http://localhost:8082', changeOrigin: true },
      '/vehicle-locations': { target: 'http://localhost:8082', changeOrigin: true },
      '/cargo-packing': { target: 'http://localhost:8082', changeOrigin: true }
    }
  }
})

