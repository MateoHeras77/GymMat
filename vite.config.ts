import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      pwaAssets: { config: true, overrideManifestIcons: true },
      includeAssets: ["favicon.svg", "icons/*.png", "sounds/notification.wav"],
      manifest: {
        id: "/?source=pwa",
        name: "GymMat",
        short_name: "GymMat",
        description: "Your personal gym workout tracker",
        categories: ["health", "fitness", "sports"],
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        shortcuts: [
          {
            name: "Start Workout",
            short_name: "Workout",
            url: "/workout",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
          { name: "History", url: "/history" },
          { name: "Progress", url: "/progress" },
        ],
        // Manifest icons (incl. maskable with safe-zone) are generated and
        // injected by the PWA assets generator (pwa-assets.config.ts) via
        // `pwaAssets.overrideManifestIcons`.
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // iOS splash screens are loaded directly via <link> on launch; no need
        // to bloat the precache (~6MB) with them.
        globIgnores: ["**/apple-splash-*.png"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
