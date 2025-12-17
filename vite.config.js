import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // The root is the project directory, where index.html is located.
  // We don't need to specify `root` if index.html is at the project root.
  
  // `publicDir` is relative to the project root.
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Changed to 5173
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});