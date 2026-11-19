import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Charts and the React runtime are split into their own chunks so the first
// paint on low-spec machines only loads what the landing page needs.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
