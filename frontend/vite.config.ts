import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/v3': 'http://127.0.0.1:8080',
      '/swagger-ui': 'http://127.0.0.1:8080',
      '/swagger-ui.html': 'http://127.0.0.1:8080',
    },
  },
})
