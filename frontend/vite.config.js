import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

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
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,ico}"],
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
      closeBundle() {
        // Forcefully exit the process once the build is successfully completed
        setTimeout(() => {
          process.exit(0);
        }, 3000);
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
    proxy: {
      "/api/v1": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
