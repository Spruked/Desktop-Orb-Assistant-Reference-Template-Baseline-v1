import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the app/interfaces/web directory
      '@': path.resolve(__dirname, './app/interfaces/web'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  // Disable generation of sourcemaps for production builds to avoid
  // eval-based source map wrappers that can conflict with strict CSP.
  build: {
    sourcemap: false,
  },
  // Tweak esbuild/dep optimization to reduce runtime code-gen patterns
  // that some tooling use during dev.
  optimizeDeps: {
    esbuildOptions: {
      legalComments: 'none',
    },
  },
})
