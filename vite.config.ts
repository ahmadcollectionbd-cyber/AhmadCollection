import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split big vendor libraries into their own cacheable chunks so the main
    // bundle stays lean (Firebase, Swiper, charts and emoji pickers were
    // pushing first-paint over 1.6 MB).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('swiper')) return 'vendor-swiper';
          if (
            id.includes('chart.js') ||
            id.includes('react-chartjs-2') ||
            id.includes('recharts') ||
            id.includes('d3-')
          ) {
            return 'vendor-charts';
          }
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('react-icons')) return 'vendor-icons';
          if (id.includes('@emailjs')) return 'vendor-emailjs';
          if (
            id.includes('react-hook-form') ||
            id.includes('zod') ||
            id.includes('@hookform')
          ) {
            return 'vendor-forms';
          }
          if (id.includes('react-i18next') || id.includes('i18next')) return 'vendor-i18n';
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
