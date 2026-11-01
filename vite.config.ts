import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [react(), tailwindcss()],
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'lucide-react',
          'motion/react',
          'framer-motion',
          'sonner',
          'canvas-confetti'
        ]
      },
      build: {
        cssCodeSplit: true,
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-core': ['react', 'react-dom'],
              'vendor-motion': ['motion/react', 'framer-motion'],
              'vendor-icons': ['lucide-react'],
              'vendor-ui': ['sonner', 'canvas-confetti']
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom']
      }
    };
});
