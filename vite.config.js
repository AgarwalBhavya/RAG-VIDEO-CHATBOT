import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5180,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  build: {
    // Optimize bundle
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    },
    // Minify CSS and JS
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    // Source maps for production debugging
    sourcemap: true,
    // Reduce chunk size warning threshold
    chunkSizeWarningLimit: 500
  },

  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom']
  },

  // Ensure CSS is properly scoped
  css: {
    preprocessorOptions: {
      css: {
        sourceMap: true
      }
    }
  }
})