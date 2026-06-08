import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Canadian-Government-Semantic-Map/',
  server: {
    port: 3000
  },
  publicDir: 'data'
})
