import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Termux has no native lightningcss binary, so CSS minify is skipped there only.
const inTermux = Boolean(process.env.TERMUX_VERSION)

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    cssMinify: inTermux ? false : 'lightningcss',
  },
})