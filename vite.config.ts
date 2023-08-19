import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
  	alias: {
  		events: 'rollup-plugin-node-polyfills/polyfills/events',
  	}
  }
});
