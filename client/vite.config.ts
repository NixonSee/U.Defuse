import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,      // Default Vite port
    // Optional HTTPS for mobile camera access (required by getUserMedia)
    // Provide certs via env or place files in client/certs/dev-cert.pem & dev-key.pem
    https: (() => {
      try {
        const certPath = process.env.VITE_SSL_CERT || path.resolve(__dirname, 'certs', 'dev-cert.pem');
        const keyPath = process.env.VITE_SSL_KEY || path.resolve(__dirname, 'certs', 'dev-key.pem');
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
          }
        }
      } catch {}
      return undefined;
    })()
  }
})
