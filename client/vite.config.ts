// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-to-app',
      configureServer(server) {
        // Explicitly set to 'any' to prevent strict TS warnings
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url === '/') {
            res.statusCode = 302;
            res.setHeader('Location', '/index.html');
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: 'index.html'
      }
    }
  }
});