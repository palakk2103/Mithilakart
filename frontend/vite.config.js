import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { VitePWA } from "vite-plugin-pwa";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let buildOutDir = path.resolve('dist');

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon.png",
        "icons.svg",
        "mithilakartbglogo.png",
        "hero_banner.png",
        "IMG_MGI_48.png",
        "IMG_MGI_96.png",
        "IMG_MGI_144.png",
        "IMG_MGI_192.png",
        "IMG_MGI_512.png",
        "maskable-icon.png"
      ],
      manifest: {
        name: "Mithilakart",
        short_name: "Mithilakart",
        description: "Mithilakart - The Artisan Marketplace",
        theme_color: "#121212",
        background_color: "#121212",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/IMG_MGI_48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/IMG_MGI_96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/IMG_MGI_144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/IMG_MGI_192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/IMG_MGI_512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // INF-3: precache the app shell only. Precaching every image (~84 MB,
        // incl. 11 MB PNGs) made the service worker slow to install — Chrome
        // offers "Install app" only once it is active. Images are cached on
        // use by the "images" runtime rule below; icons/logos via includeAssets.
        globPatterns: ["**/*.{js,css,html,ico,woff,woff2,ttf}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        // SPA routes (/admin, /seller, /home, etc.) — not only /
        navigateFallbackAllowlist: [/^(?!\/api(?:\/|$)).*/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets"
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^(?!\/api(?:\/|$)).*/],
      }
    }),
    {
      name: 'force-close-build',
      apply: 'build',
      configResolved(config) {
        buildOutDir = path.resolve(config.root, config.build.outDir);
      },
      closeBundle() {
        // Forcefully exit once the build is complete (something keeps the
        // process alive on Vercel). It used to exit after a fixed 3 s, which
        // killed vite-plugin-pwa before it wrote sw.js — every build shipped
        // without a service worker, so the PWA could never be installed (INF-3).
        // Wait for sw.js (max 120 s) before exiting.
        const swPath = path.join(buildOutDir, 'sw.js');
        const started = Date.now();
        const timer = setInterval(() => {
          if (fs.existsSync(swPath) || Date.now() - started > 120000) {
            clearInterval(timer);
            if (!fs.existsSync(swPath)) console.error('[force-close-build] sw.js was not generated — the PWA will not be installable');
            setTimeout(() => process.exit(0), 1000);
          }
        }, 500);
      }
    }
  ],
  resolve: {
    alias: {
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (id.includes("src/modules/Admin")) {
            return "admin-portal";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["recharts"]
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
          });
        },
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
          });
        },
      },
    },
  },
});
