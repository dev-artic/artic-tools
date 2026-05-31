import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Using relative paths so it loads correctly on GitHub Pages
  build: {
    outDir: '../n-bbang-calculator', // Output built assets directly to paytable suite
    emptyOutDir: true
  }
})
