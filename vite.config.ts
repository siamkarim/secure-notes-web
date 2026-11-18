import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // The browser only ever talks to this origin; /api is forwarded to the backend.
      // That keeps the refresh cookie first-party (SameSite=Strict works) and avoids CORS.
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
      },
    },
  };
});
