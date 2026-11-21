import { build } from 'vite';
import react from '@vitejs/plugin-react';

// Avoid Vite's temporary config bundle scanning parent directories in the
// managed desktop workspace. Keep this equivalent to vite.config.js.
await build({
  configFile: false,
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

