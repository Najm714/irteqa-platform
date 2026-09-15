// frontend/portal-a/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ✅ مهم: مسار مجلد public
  publicDir: 'public',

  build: {
    // ✅ انسخ public/ إلى dist/
    copyPublicDir: true,

    // ✅ زيادة حد التحذير إلى 1 ميجابايت
    chunkSizeWarningLimit: 1000,

    // ✅ تقييم الكود (Code Splitting)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ✅ المكتبات الأساسية
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor';
          }
          // ✅ الأيقونات
          if (id.includes('node_modules/react-icons/')) {
            return 'icons';
          }
          // ✅ مكتبات UI (aos, framer-motion, إلخ)
          if (id.includes('node_modules/aos/') ||
              id.includes('node_modules/framer-motion/')) {
            return 'ui';
          }
          // ✅ أي مكتبة أخرى كبيرة
          if (id.includes('node_modules/')) {
            return 'npm';
          }
          // ✅ باقي الكود
          return 'main';
        },
      },
    },
  },

  // ✅ إعدادات التطوير
  server: {
    port: 5174,
    open: true,
  },
});