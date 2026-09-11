import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // ✅ زيادة حد التحذير إلى 1 ميجابايت
    chunkSizeWarningLimit: 1000,

    // ✅ تقسيم الكود (Code Splitting) بالطريقة الصحيحة
    rollupOptions: {
      output: {
        manualChunks(id) {
          // فصل المكتبات الأساسية
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor';
          }
          // فصل الأيقونات
          if (id.includes('node_modules/react-icons/')) {
            return 'icons';
          }
          // فصل مكتبات الـ UI
          if (id.includes('node_modules/aos/')) {
            return 'ui';
          }
          // فصل أي مكتبات أخرى كبيرة
          if (id.includes('node_modules/')) {
            return 'npm';
          }
          // باقي الكود
          return 'main';
        },
      },
    },
  },

  // ✅ تحسين الأداء في التطوير
  server: {
    port: 5173,
    open: true,
  },
});